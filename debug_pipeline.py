import asyncio
import os
import sys

# Adjust path so we can import from backend app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.services.pipeline_service import load_default_phoenix_target_area
from app.services.scan_service import scan_area
from app.services.hotspot_service import detect_hotspots
from app.services.fortyguard_client import FortyGuardClient
from datetime import datetime

async def main():
    print("--- PIPELINE DEBUG TRACE ---")
    
    # Init client
    client = FortyGuardClient()
    
    now = datetime.now()
    from datetime import timedelta
    yesterday = now - timedelta(days=1)
    start_date = yesterday.strftime("%Y-%m-%d")
    start_time = "14:00"
    
    print(f"-> Querying for {start_date} at {start_time}")
    
    polygon = load_default_phoenix_target_area()
    
    print("1. Initiating scan_area...")
    raw_result = await scan_area(
        polygon=polygon,
        analytic_type="tcm",
        granularity=60,
        start_date=start_date,
        start_time=start_time,
        client=client,
        max_concurrency=1
    )
    
    total_cells_dedup = len(raw_result["data"]["features"])
    print(f"-> Total cells after dedup (from scan_area): {total_cells_dedup}")
    
    print("-> Printing sample raw feature collection from first tile (manually querying)...")
    from app.models.fortyguard import HeatmapRequest
    from app.utils.spatial_engine import tile_polygon
    tiles = tile_polygon(polygon)
    
    req = HeatmapRequest(
        polygon_aoi=tiles[0]["geometry"],
        date_time={
            "start_date": start_date, 
            "start_time": start_time, 
            "end_date": None, 
            "end_time": None, 
            "filter_type": 1
        },
        analytic_type="tcm",
        granularity=60
    )
    raw_geojson = await client.run_heatmap(req)
    print(f"Raw geojson keys: {raw_geojson.keys()}")
    print(f"Number of features in raw response for tile 0: {len(raw_geojson.get('features', []))}")
    if 'data' in raw_geojson:
        print(f"Wait, is it nested in data? -> {len(raw_geojson['data'].get('features', []))}")
    
    print("\n2. Initiating detect_hotspots...")
    hotspots = detect_hotspots({"features": raw_result["data"]["features"]})
    
    print(f"-> Hotspots found (from detect_hotspots): {len(hotspots)}")

if __name__ == "__main__":
    asyncio.run(main())

