import asyncio
import json
import time
import hashlib
from typing import Optional

from app.db import get_db_connection
from app.models.fortyguard import HeatmapRequest, GeoJSONPolygon
from app.services.fortyguard_client import FortyGuardClient
from app.utils.spatial_engine import tile_polygon
from app.logging_config import logger

def _compute_request_hash(request: HeatmapRequest) -> str:
    payload_str = json.dumps(request.model_dump(mode="json", exclude_none=True), sort_keys=True)
    return hashlib.sha256(payload_str.encode("utf-8")).hexdigest()

async def _process_tile(
    tile: dict,
    start_date: str,
    start_time: str,
    analytic_type: str,
    granularity: int,
    client: FortyGuardClient,
    semaphore: asyncio.Semaphore,
    threshold: Optional[float] = None,
    direction: Optional[str] = None
) -> dict:
    async with semaphore:
        req = HeatmapRequest(
            polygon_aoi=tile["geometry"],
            date_time={"start_date": start_date, "start_time": start_time, "filter_type": 1},
            analytic_type=analytic_type,
            granularity=granularity,
            threshold=threshold,
            direction=direction
        )
        req_hash = _compute_request_hash(req)
        
        # Check cache
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT response_json FROM fortyguard_cache WHERE request_hash = ?", (req_hash,))
            row = cursor.fetchone()
            if row:
                logger.info(f"ScanService: Cache hit for tile {tile['id']} ({req_hash})")
                cached_data = json.loads(row["response_json"])
                # Tag features with tile_id
                for f in cached_data.get("features", []):
                    f["properties"]["tile_id"] = tile["id"]
                return cached_data
                
        # Cache miss
        try:
            logger.info(f"ScanService: Calling FortyGuard for tile {tile['id']} ({req_hash})")
            geojson_result = await client.run_heatmap(req)
            
            # Save to cache
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
                
            # Tag features with tile_id
            for f in geojson_result.get("features", []):
                f["properties"]["tile_id"] = tile["id"]
                
            return geojson_result
            
        except Exception as e:
            logger.error(f"ScanService: Failed to process tile {tile['id']}: {e}")
            return {"error": str(e), "tile_id": tile["id"]}

async def scan_area(
    polygon: dict, 
    analytic_type: str, 
    granularity: int, 
    start_date: str, 
    start_time: str, 
    client: FortyGuardClient,
    threshold: Optional[float] = None,
    direction: Optional[str] = None,
    max_concurrency: int = 3
) -> dict:
    """
    Tiles a large polygon and fetches heatmaps concurrently for all tiles.
    """
    start_ts = time.time()
    
    # Tile the polygon using our spatial engine (ensures no tile > 10 mi2)
    tiles = tile_polygon(polygon)
    logger.info(f"ScanService: Orchestrating scan for {len(tiles)} tiles.")
    
    semaphore = asyncio.Semaphore(max_concurrency)
    
    tasks = [
        _process_tile(
            tile=tile,
            start_date=start_date,
            start_time=start_time,
            analytic_type=analytic_type,
            granularity=granularity,
            client=client,
            semaphore=semaphore,
            threshold=threshold,
            direction=direction
        )
        for tile in tiles
    ]
    
    results = await asyncio.gather(*tasks)
    
    master_features = []
    failed_tiles = []
    
    for res in results:
        if "error" in res:
            failed_tiles.append(res["tile_id"])
        else:
            master_features.extend(res.get("features", []))
            
    duration_ms = int((time.time() - start_ts) * 1000)
    
    return {
        "summary": {
            "total_tiles": len(tiles),
            "failed_tiles": failed_tiles,
            "total_cells": len(master_features),
            "duration_ms": duration_ms
        },
        "data": {
            "type": "FeatureCollection",
            "features": master_features
        }
    }
