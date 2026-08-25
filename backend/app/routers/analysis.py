"""
HeatSentinel AI - Analysis Router (Step 28 / Vertical Slice API Endpoint)
Exposes POST /api/analysis/basic-scan to power the Command Center UI with live/cached
ranked heat zones and comprehensive WHY evidence.
"""

import json
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, Request, Query, Body, HTTPException
from pydantic import BaseModel, Field

from app.db import get_db_connection
from app.services.fortyguard_client import FortyGuardClient
from app.services.pipeline_service import run_basic_pipeline, load_default_city_target_area, load_default_phoenix_target_area
from app.logging_config import logger

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _default_scan_date() -> str:
    """Returns the official FortyGuard Phoenix dataset date (2024-08-01) containing 16,568 real thermal points."""
    return "2024-08-01"


class BasicScanRequest(BaseModel):
    city: Optional[str] = Field(default="Phoenix", description="Target city name (Phoenix, Las Vegas, Miami, Houston, Los Angeles, New York)")
    polygon_aoi: Optional[Dict[str, Any]] = Field(default=None, description="GeoJSON polygon geometry override")
    start_date: Optional[str] = Field(default=None, description="Date string YYYY-MM-DD (defaults to yesterday)")
    start_time: Optional[str] = Field(default="14:00", description="Time string HH:MM")
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
    
    Uses SQLite response caching for sub-second UI rendering.
    """
    start_ts = time.time()
    
    # 1. Resolve inputs
    req_body = payload or BasicScanRequest()
    city = req_body.city or "Phoenix"
    polygon = req_body.polygon_aoi or load_default_city_target_area(city)
    start_date = req_body.start_date or _default_scan_date()
    start_time = req_body.start_time or "14:00"
    top_n = req_body.top_n_hotspots
    
    cache_key = compute_basic_scan_cache_key(polygon, city, start_date, start_time, top_n)
    
    # 2. Check SQLite Cache
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
