import sys
import os
import json
import asyncio
from pathlib import Path

# Add the backend root to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx
from app.config import get_settings
from datetime import datetime

async def generate_fixture():
    settings = get_settings()
    if not settings.fortyguard_api_key:
        print("ERROR: FORTYGUARD_API_KEY is missing.")
        sys.exit(1)
        
    base_url = "https://api.fortyguard.com"
    headers = {
        "api-key": settings.fortyguard_api_key,
        "accept": "application/json"
    }
    
    # Very small polygon for testing
    payload = {
        "polygon_aoi": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-112.075, 33.450],
                    [-112.070, 33.450],
                    [-112.070, 33.445],
                    [-112.075, 33.445],
                    [-112.075, 33.450]
                ]
            ]
        },
        "date_time": {
            "start_date": "2026-08-22",
            "start_time": "14:00",
            "filter_type": 1
        },
        "analytic_type": "tcm",
        "granularity": 60
    }
    
    print("Submitting heatmap request...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        submit_url = f"{base_url}/v1/heatmap"
        resp = await client.post(submit_url, headers=headers, json=payload)
        
        if resp.status_code != 200 and resp.status_code != 201 and resp.status_code != 202:
            print(f"Failed to submit. Code: {resp.status_code}, Body: {resp.text}")
            sys.exit(1)
            
        data = resp.json()
        print(f"Submit response: {data}")
        
        # activity_id is nested inside 'data'
        inner_data = data.get("data", {})
        activity_id = inner_data.get("activity_id")
        
        if not activity_id:
            print("No activity_id returned!")
            sys.exit(1)
            
        print(f"Got activity_id: {activity_id}. Polling...")
        
        status_url = f"{base_url}/v1/status/{activity_id}"
        
        # Poll up to 15 times, waiting 2 seconds between polls
        for i in range(15):
            await asyncio.sleep(2)
            poll_resp = await client.get(status_url, headers=headers)
            
            if poll_resp.status_code != 200:
                print(f"Poll failed. Code: {poll_resp.status_code}, Body: {poll_resp.text}")
                continue
                
            poll_data = poll_resp.json()
            print(f"[{i+1}/15] Poll response: {poll_data}")
            
            # Check top-level status or nested status
            status = poll_data.get("status")
            if not status and "data" in poll_data and isinstance(poll_data["data"], dict):
                status = poll_data["data"].get("status")
            
            if status and status.lower() in ("succeeded", "completed", "failed", "error"):
                print("Terminal status reached!")
                
                # Save fixture
                out_path = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "fortyguard_heatmap_sample.json"
                with open(out_path, "w") as f:
                    json.dump(poll_data, f, indent=2)
                    
                print(f"Saved fixture to {out_path}")
                break
        else:
            print("Timed out waiting for terminal status.")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(generate_fixture())
