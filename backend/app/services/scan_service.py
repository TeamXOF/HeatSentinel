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
    end_date: Optional[str] = None,
    end_time: Optional[str] = None,
    forecast_hours: Optional[int] = None,
    threshold: Optional[float] = None,
    direction: Optional[str] = None
) -> dict:
    async with semaphore:
        
        # Determine filter_type and end_time based on forecast_hours or end_time
        final_end_date = end_date
        final_end_time = end_time
        filter_type = 1
        
        if forecast_hours is not None and forecast_hours > 0:
            from datetime import datetime, timedelta
            try:
                dt = datetime.strptime(f"{start_date} {start_time}", "%Y-%m-%d %H:%M")
                end_dt = dt + timedelta(hours=forecast_hours)
                final_end_date = end_dt.strftime("%Y-%m-%d")
                final_end_time = end_dt.strftime("%H:%M")
                filter_type = 2
            except Exception as e:
                logger.error(f"Error parsing date/time for forecast: {e}")
        elif final_end_time:
            filter_type = 2
            
        req = HeatmapRequest(
            polygon_aoi=tile["geometry"],
            date_time={
                "start_date": start_date, 
                "start_time": start_time, 
                "end_date": final_end_date, 
                "end_time": final_end_time, 
                "filter_type": filter_type
            },
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
    end_date: Optional[str] = None,
    end_time: Optional[str] = None,
    forecast_hours: Optional[int] = None,
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
            end_date=end_date,
            end_time=end_time,
            forecast_hours=forecast_hours,
            threshold=threshold,
            direction=direction
        )
        for tile in tiles
    ]
    
    results = await asyncio.gather(*tasks)
    
    master_features_map = {}
    failed_tiles = []
    
    for res in results:
        if "error" in res:
            failed_tiles.append(res["tile_id"])
        else:
            for f in res.get("features", []):
                # 1. Prefer native FortyGuard ID if present
                props = f.get("properties", {})
                fid = f.get("id") or props.get("id") or props.get("cell_id")
                
                if not fid:
                    # 2. Fallback to deterministic coordinate hash
                    geom = f.get("geometry", {})
                    coords = geom.get("coordinates")
                    if coords:
                        # Extract representative coordinate
                        geom_type = geom.get("type", "")
                        c = coords
                        while isinstance(c, list) and len(c) > 0 and isinstance(c[0], list):
                            c = c[0]
                        rep_coord = c if isinstance(c, list) and len(c) >= 2 else [0, 0]
                        
                        try:
                            lon = round(float(rep_coord[0]), 6)
                            lat = round(float(rep_coord[1]), 6)
                            fid = f"{lon}_{lat}"
                        except (ValueError, TypeError):
                            fid = f"unknown_{hash(str(f))}"
                    else:
                        fid = f"unknown_{hash(str(f))}"
                
                # 3. Explicit tie-breaking rule: Keep the first-seen value.
                if fid not in master_features_map:
                    master_features_map[fid] = f

    master_features = list(master_features_map.values())
            
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
