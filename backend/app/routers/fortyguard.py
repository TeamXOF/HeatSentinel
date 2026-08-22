import json
import hashlib
import time
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from fastapi import APIRouter, Request, Query, Body, HTTPException
from pydantic import BaseModel

from app.db import get_db_connection
from app.models.fortyguard import HeatmapRequest
from app.services.fortyguard_client import FortyGuardClient
from app.logging_config import logger

import os
from pathlib import Path

router = APIRouter(prefix="/api/fortyguard", tags=["fortyguard"])

# Path to the pre-computed Phoenix polygon
DEFAULT_POLYGON_PATH = Path(__file__).resolve().parent.parent / "data" / "phoenix_target_area.geojson"


class TestScanRequest(BaseModel):
    polygon_aoi: Optional[Dict[str, Any]] = None
    start_date: Optional[str] = None
    start_time: Optional[str] = None
    analytic_type: str = "tcm"
    granularity: int = 60


def get_default_polygon() -> Dict[str, Any]:
    if not DEFAULT_POLYGON_PATH.exists():
        raise HTTPException(status_code=500, detail="Default Phoenix target area not found.")
    with open(DEFAULT_POLYGON_PATH, "r") as f:
        feature_collection = json.load(f)
        # Extract just the Polygon from the first feature
        return feature_collection["features"][0]["geometry"]


def compute_request_hash(request: HeatmapRequest) -> str:
    """Computes a deterministic SHA-256 hash of the request."""
    # sort_keys=True ensures identical dictionaries produce identical JSON strings
    payload_str = json.dumps(request.model_dump(mode="json", exclude_none=True), sort_keys=True)
    return hashlib.sha256(payload_str.encode("utf-8")).hexdigest()


@router.post("/test-scan")
async def test_scan(
    request: Request,
    payload: TestScanRequest = Body(...),
    force_refresh: bool = Query(False, description="Bypass SQLite cache and hit API")
):
    """
    Triggers a FortyGuard heatmap scan for a single AOI.
    Uses SQLite caching to avoid redundant API calls.
    Defaults to the pre-computed Phoenix Target Area and yesterday at 14:00.
    """
    # 1. Resolve Parameters
    polygon = payload.polygon_aoi or get_default_polygon()
    
    # Default to yesterday at 14:00 if not provided
    if not payload.start_date or not payload.start_time:
        yesterday = datetime.now() - timedelta(days=1)
        start_date = yesterday.strftime("%Y-%m-%d")
        start_time = "14:00"
    else:
        start_date = payload.start_date
        start_time = payload.start_time

    # 2. Construct the strict HeatmapRequest
    heatmap_req = HeatmapRequest(
        polygon_aoi=polygon,
        date_time={"start_date": start_date, "start_time": start_time, "filter_type": 1},
        analytic_type=payload.analytic_type,
        granularity=payload.granularity
    )

    req_hash = compute_request_hash(heatmap_req)
    
    start_ts = time.time()

    # 3. Check SQLite Cache
    if not force_refresh:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT response_json FROM fortyguard_cache WHERE request_hash = ?", (req_hash,))
            row = cursor.fetchone()
            
            if row:
                duration_ms = int((time.time() - start_ts) * 1000)
                logger.info(f"Cache hit for test-scan: {req_hash}")
                cached_data = json.loads(row["response_json"])
                return {
                    "mode": "cached",
                    "request_hash": req_hash,
                    "duration_ms": duration_ms,
                    "cell_count": len(cached_data.get("features", [])),
                    "data": cached_data
                }

    # 4. Cache Miss - Call FortyGuard API
    logger.info(f"Cache miss for {req_hash}. Calling FortyGuard API...")
    
    http_client = request.app.state.http_client
    fortyguard_client = FortyGuardClient(http_client)
    
    # run_heatmap handles submit, poll, and normalize
    geojson_result = await fortyguard_client.run_heatmap(heatmap_req)
    
    # 5. Save to Cache
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO fortyguard_cache (request_hash, response_json)
            VALUES (?, ?)
            ON CONFLICT(request_hash) DO UPDATE SET response_json = excluded.response_json
            """,
            (req_hash, json.dumps(geojson_result))
        )
        
    duration_ms = int((time.time() - start_ts) * 1000)
    
    return {
        "mode": "live",
        "request_hash": req_hash,
        "duration_ms": duration_ms,
        "cell_count": len(geojson_result.get("features", [])),
        "data": geojson_result
    }
