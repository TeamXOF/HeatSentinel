"""
HeatSentinel AI - Analysis Router (Step 28 / Vertical Slice API Endpoint)
Exposes POST /api/analysis/basic-scan to power the Command Center UI with live/cached
ranked heat zones and comprehensive WHY evidence.
"""

import json
import hashlib
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

from fastapi import APIRouter, Request, Query, Body, HTTPException
from pydantic import BaseModel, Field

from app.db import get_db_connection
from app.services.fortyguard_client import FortyGuardClient
from app.services.pipeline_service import run_basic_pipeline, load_default_city_target_area, load_default_phoenix_target_area
from app.logging_config import logger

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _resolve_scan_date(requested_date: Optional[str] = None, time_range: Optional[str] = None) -> str:
    """Resolves scan date dynamically. Defaults to dataset date if unspecified, or live UTC date when requested."""
    if requested_date:
        return requested_date
    if time_range and time_range.lower() in ("today", "live", "forecast"):
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return "2024-08-01"


class BasicScanRequest(BaseModel):
    city: Optional[str] = Field(default="Phoenix", description="Target city name (Phoenix, Las Vegas, Miami, Houston, Los Angeles, New York)")
    polygon_aoi: Optional[Dict[str, Any]] = Field(default=None, description="GeoJSON polygon geometry override")
    start_date: Optional[str] = Field(default=None, description="Date string YYYY-MM-DD")
    start_time: Optional[str] = Field(default="14:00", description="Time string HH:MM")
    time_range: Optional[str] = Field(default="Today", description="Temporal scope (Today, 24h Forecast, Peak Heat, Historic 7D)")
    top_n_hotspots: int = Field(default=5, ge=1, le=20, description="Max number of ranked hotspots to detect and return")


def compute_basic_scan_cache_key(
    polygon: Dict[str, Any],
    city: str,
    start_date: str,
    start_time: str,
    top_n: int
) -> str:
    """Computes a deterministic SHA-256 hash for basic scan caching."""
    data = {
        "city": city.lower().strip(),
        "polygon": polygon,
        "start_date": start_date,
        "start_time": start_time,
        "top_n": top_n
    }
    payload_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(payload_str.encode("utf-8")).hexdigest()


@router.post("/basic-scan")
async def basic_scan(
    request: Request,
    payload: Optional[BasicScanRequest] = Body(default=None),
    force_refresh: bool = Query(False, description="Bypass SQLite cache and run live computation")
):
    """
    Executes the end-to-end basic analysis pipeline for any monitored city:
    Target Area -> FortyGuard Scan -> DBSCAN Hotspots -> Heat Metrics -> Census Joins ->
    MAG Cooling Coverage -> Response Gap -> Ranked Zones with WHY Evidence.
    
    Supports dynamic temporal shifts and live cache invalidation.
    """
    start_ts = time.time()
    
    # 1. Resolve inputs
    req_body = payload or BasicScanRequest()
    city = req_body.city or "Phoenix"
    polygon = req_body.polygon_aoi or load_default_city_target_area(city)
    start_date = _resolve_scan_date(req_body.start_date, req_body.time_range)
    start_time = req_body.start_time or "14:00"
    top_n = req_body.top_n_hotspots
    
    cache_key = compute_basic_scan_cache_key(polygon, city, start_date, start_time, top_n)
    
    # 2. Check SQLite Cache (if not force refresh)
    if not force_refresh:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT response_json FROM pipeline_basic_scan_cache WHERE cache_key = ?",
                (cache_key,)
            )
            row = cursor.fetchone()
            if row:
                duration_ms = int((time.time() - start_ts) * 1000)
                logger.info(f"AnalysisRouter: Cache hit for basic-scan ({city} - {cache_key})")
                cached_data = json.loads(row["response_json"])
                cached_data["mode"] = "cached"
                cached_data["cache_key"] = cache_key
                cached_data["duration_ms"] = duration_ms
                return cached_data
    else:
        # Clear stale cache entry on force refresh
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM pipeline_basic_scan_cache WHERE cache_key = ?", (cache_key,))
            conn.commit()
            logger.info(f"AnalysisRouter: Invalidation triggered for {city} cache key {cache_key}")

                
    # 3. Cache Miss / Refresh - Execute Pipeline
    logger.info(f"AnalysisRouter: Executing live basic-scan pipeline for {city} ({cache_key})...")
    http_client = getattr(request.app.state, "http_client", None)
    fg_client = FortyGuardClient(http_client) if http_client else FortyGuardClient()
    
    try:
        pipeline_result = await run_basic_pipeline(
            target_area=polygon,
            city=city,
            start_date=start_date,
            start_time=start_time,
            top_n_hotspots=top_n,
            client=fg_client
        )

    except Exception as e:
        logger.error(f"AnalysisRouter: Pipeline execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Basic scan pipeline failed: {str(e)}")
        
    result_dict = pipeline_result.model_dump(mode="json")
    duration_ms = int((time.time() - start_ts) * 1000)
    
    # 4. Save to Cache
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO pipeline_basic_scan_cache (cache_key, response_json)
            VALUES (?, ?)
            ON CONFLICT(cache_key) DO UPDATE SET response_json = excluded.response_json
            """,
            (cache_key, json.dumps(result_dict))
        )
        
    result_dict["mode"] = "live"
    result_dict["cache_key"] = cache_key
    result_dict["duration_ms"] = duration_ms
    
    return result_dict


def _find_zone_in_caches(zone_id: str) -> Optional[Dict[str, Any]]:
    """Helper to find a zone's metrics from recent basic scans or heat hunt jobs."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Check pipeline basic scan cache (recent 10 scans)
        cursor.execute(
            "SELECT response_json FROM pipeline_basic_scan_cache ORDER BY created_at DESC LIMIT 10"
        )
        for row in cursor.fetchall():
            try:
                data = json.loads(row["response_json"])
                for zone in data.get("ranked_zones", []):
                    if zone.get("zone_id") == zone_id:
                        return zone
            except Exception:
                continue
                
        # 2. Check heat hunt jobs
        cursor.execute(
            "SELECT result_json FROM heat_hunt_jobs WHERE status = 'completed' ORDER BY created_at DESC LIMIT 10"
        )
        for row in cursor.fetchall():
            if not row["result_json"]: continue
            try:
                data = json.loads(row["result_json"])
                for zone in data.get("ranked_zones", []):
                    if zone.get("zone_id") == zone_id:
                        return zone
            except Exception:
                continue
                
    return None


@router.post("/{zone_id}/heat-intelligence")
async def trigger_heat_intelligence(zone_id: str, request: Request):
    """
    Triggers an asynchronous FortyGuard heat intelligence PDF report generation.
    Returns a job_id immediately.
    """
    zone_data = _find_zone_in_caches(zone_id)
    if not zone_data:
        raise HTTPException(status_code=404, detail="Zone data not found in recent scans.")
        
    try:
        lat = float(zone_data["center"]["lat"])
        lng = float(zone_data["center"]["lng"])
        temp_c = float(zone_data["mean_temp_c"])
    except KeyError:
        raise HTTPException(status_code=500, detail="Zone data is missing required coordinate or temperature fields.")
        
    # Use today's date
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    from app.services.heat_intelligence_service import start_heat_intelligence
    
    http_client = getattr(request.app.state, "http_client", None)
    fg_client = FortyGuardClient(http_client) if http_client else FortyGuardClient()
    
    job_id = start_heat_intelligence(
        zone_id=zone_id,
        latitude=lat,
        longitude=lng,
        temperature=temp_c,
        date=date_str,
        client=fg_client
    )
    
    return {"job_id": job_id, "status": "pending"}


@router.get("/{zone_id}/heat-intelligence/{job_id}/status")
async def get_heat_intelligence_status(zone_id: str, job_id: str):
    """
    Polls the status of a previously triggered heat intelligence report.
    Returns download_link when completed.
    """
    from app.services.heat_intelligence_service import get_heat_intelligence_job
    
    job = get_heat_intelligence_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return job.model_dump()

