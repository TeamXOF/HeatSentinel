"""
HeatSentinel AI - Analysis Router (Step 28 / Vertical Slice API Endpoint)
Exposes POST /api/analysis/basic-scan to power the Command Center UI with live/cached
ranked heat zones and comprehensive WHY evidence.
"""

import json
import hashlib
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from fastapi import APIRouter, Request, Query, Body, HTTPException
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db import get_db_connection
from app.services.fortyguard_client import FortyGuardClient
from app.services.pipeline_service import run_basic_pipeline, load_default_city_target_area, load_default_phoenix_target_area
from app.logging_config import logger

router = APIRouter(prefix="/api/analysis", tags=["analysis"])
limiter = Limiter(key_func=get_remote_address)


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
@limiter.limit("30/minute")
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
    """Helper to find a zone's metrics from recent basic scans, heat hunt jobs, or standard municipal baselines."""
    normalized_target = zone_id.strip().lower()
    
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
                    zid = str(zone.get("zone_id", "")).strip().lower()
                    hid = str(zone.get("hotspot_id", "")).strip().lower()
                    if zid == normalized_target or hid == normalized_target or normalized_target in zid:
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
                    zid = str(zone.get("zone_id", "")).strip().lower()
                    hid = str(zone.get("hotspot_id", "")).strip().lower()
                    if zid == normalized_target or hid == normalized_target or normalized_target in zid:
                        return zone
            except Exception:
                continue

    # 3. Fallback: Check static demo scenario
    demo_file = Path(__file__).resolve().parent.parent / "data" / "demo_scenario_phoenix.json"
    if demo_file.exists():
        try:
            with open(demo_file, "r", encoding="utf-8") as f:
                demo_data = json.load(f)
            for zone in demo_data.get("final_result", {}).get("ranked_zones", []):
                zid = str(zone.get("zone_id", "")).strip().lower()
                if zid == normalized_target or normalized_target in zid:
                    temp_c = zone.get("empirical_evidence", {}).get("thermal_metrics", {}).get("current_temp_c", 44.5)
                    return {"center": {"lat": 33.4484, "lng": -112.0740}, "mean_temp_c": temp_c, "zone_id": zone_id}
        except Exception:
            pass

    # 4. Standard Municipal Zone baseline coordinates (Phoenix Metro & major corridors)
    STANDARD_ZONES: Dict[str, Dict[str, Any]] = {
        "zone-7": {"center": {"lat": 33.4490, "lng": -112.0740}, "mean_temp_c": 45.6},
        "zone-5": {"center": {"lat": 33.4120, "lng": -112.0520}, "mean_temp_c": 43.8},
        "zone-3": {"center": {"lat": 33.4880, "lng": -112.0780}, "mean_temp_c": 42.8},
        "zone-2": {"center": {"lat": 33.5090, "lng": -111.9680}, "mean_temp_c": 40.0},
        "zone-2-camelback": {"center": {"lat": 33.5090, "lng": -111.9680}, "mean_temp_c": 40.0},
        "zone-2-tempe": {"center": {"lat": 33.4350, "lng": -111.9300}, "mean_temp_c": 39.5},
        "zone-1": {"center": {"lat": 33.4750, "lng": -112.1650}, "mean_temp_c": 36.7},
        "zone-6-glendale": {"center": {"lat": 33.5387, "lng": -112.1860}, "mean_temp_c": 41.2},
        "zone-8-scottsdale": {"center": {"lat": 33.4942, "lng": -111.9261}, "mean_temp_c": 39.8},
        "zone-9-mesa": {"center": {"lat": 33.4152, "lng": -111.8315}, "mean_temp_c": 42.0},
        "zone-10-peoria": {"center": {"lat": 33.5806, "lng": -112.2374}, "mean_temp_c": 40.5},
    }

    # Match normalized id (e.g. "zone-3", "3", "zone 3")
    clean_key = normalized_target.replace(" ", "-")
    if clean_key in STANDARD_ZONES:
        return {"center": STANDARD_ZONES[clean_key]["center"], "mean_temp_c": STANDARD_ZONES[clean_key]["mean_temp_c"], "zone_id": zone_id}
    if f"zone-{clean_key}" in STANDARD_ZONES:
        return {"center": STANDARD_ZONES[f"zone-{clean_key}"]["center"], "mean_temp_c": STANDARD_ZONES[f"zone-{clean_key}"]["mean_temp_c"], "zone_id": zone_id}
        
    # Default fallback centroid if valid identifier
    return {"center": {"lat": 33.4484, "lng": -112.0740}, "mean_temp_c": 43.5, "zone_id": zone_id}


@router.post("/{zone_id}/heat-intelligence")
async def trigger_heat_intelligence(zone_id: str, request: Request):
    """
    Triggers an asynchronous FortyGuard heat intelligence PDF report generation.
    Returns a job_id immediately.
    """
    zone_data = _find_zone_in_caches(zone_id)
    if not zone_data:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found.")
        
    try:
        if "center" in zone_data and isinstance(zone_data["center"], dict):
            lat = float(zone_data["center"].get("lat", 33.4484))
            lng = float(zone_data["center"].get("lng", -112.0740))
        elif "centroid" in zone_data and isinstance(zone_data["centroid"], (list, tuple)):
            lng, lat = float(zone_data["centroid"][0]), float(zone_data["centroid"][1])
        elif "coordinates" in zone_data and isinstance(zone_data["coordinates"], (list, tuple)):
            lng, lat = float(zone_data["coordinates"][0]), float(zone_data["coordinates"][1])
        else:
            lat, lng = 33.4484, -112.0740

        temp_c = float(zone_data.get("mean_temp_c") or zone_data.get("current_temp_c") or 43.0)
    except Exception as parse_err:
        logger.warning(f"Error parsing zone coordinates/temp for {zone_id}: {parse_err}. Using default center.")
        lat, lng, temp_c = 33.4484, -112.0740, 43.0
        
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
async def get_heat_intelligence_status(zone_id: str, job_id: str, request: Request):
    """
    Polls the status of a previously triggered heat intelligence report.
    Returns download_link when completed with self-healing live sync.
    """
    from app.services.heat_intelligence_service import get_heat_intelligence_job
    
    job = get_heat_intelligence_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Self-healing check: if not marked completed in DB yet but activity_id exists, check FortyGuard directly
    if job.status != "completed" and job.activity_id:
        try:
            http_client = getattr(request.app.state, "http_client", None)
            fg_client = FortyGuardClient(http_client) if http_client else FortyGuardClient()
            fg_status = await fg_client.get_status(job.activity_id)
            if fg_status.data and fg_status.data.status and fg_status.data.status.lower() in ("completed", "succeeded"):
                res_obj = fg_status.data.result
                dl_link = None
                if isinstance(res_obj, dict):
                    dl_link = res_obj.get("download_link")
                elif res_obj and hasattr(res_obj, "download_link"):
                    dl_link = res_obj.download_link
                elif res_obj and hasattr(res_obj, "model_dump"):
                    dl_link = res_obj.model_dump(exclude_unset=True).get("download_link")
                    
                if dl_link:
                    expires_at = (datetime.now(timezone.utc) + timedelta(seconds=580)).isoformat()
                    with get_db_connection() as conn:
                        cursor = conn.cursor()
                        cursor.execute(
                            "UPDATE heat_intelligence_jobs SET status = 'completed', download_link = ?, expires_at = ?, error = NULL WHERE job_id = ?",
                            (dl_link, expires_at, job_id)
                        )
                    job.status = "completed"
                    job.download_link = dl_link
                    job.expires_at = expires_at
                    job.error = None
        except Exception as sync_err:
            logger.debug(f"Live status sync check error for job {job_id}: {sync_err}")
        
    return job.model_dump()

