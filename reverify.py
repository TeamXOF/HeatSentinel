import asyncio
import httpx
import json
import time

async def main():
    print("=== LIVE RE-VERIFICATION ===")
    
    # Use yesterday's date as the known live time with anomalies
    start_date = "2024-08-01"
    start_time = "14:00"
    
    print(f"\n[Test 2] Re-running live basic-scan for Phoenix at {start_date} {start_time}...")
    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(
            "http://127.0.0.1:8000/api/analysis/basic-scan",
            json={
                "city": "Phoenix",
                "start_date": start_date,
                "start_time": start_time
            }
        )
        if resp.status_code != 200:
            print(f"FAILED: {resp.status_code} {resp.text}")
            return
            
        data = resp.json()
        zones = data.get("ranked_zones", [])
        hotspots_count = len(zones)
        print(f"-> Hotspots found: {hotspots_count}")
        
        if hotspots_count == 0:
            print("Still 0 hotspots. Aborting.")
            return
            
        zone_id = zones[0]["zone_id"]
        print(f"-> Selected zone_id: {zone_id}")
        
        print(f"\n[Test 3] Re-running live Heat Hunt for {zone_id}...")
        hh_resp = await client.post(
            f"http://127.0.0.1:8000/api/analysis/{zone_id}/heat-hunt",
            json={"run_full_investigation": True}
        )
        print(f"-> Heat Hunt Start Status: {hh_resp.status_code}")
        hh_job_id = hh_resp.json().get("job_id")
        
        if hh_job_id:
            # Poll Heat Hunt
            while True:
                status_resp = await client.get(f"http://127.0.0.1:8000/api/analysis/heat-hunt/{hh_job_id}")
                status_data = status_resp.json()
                print(f"   Heat Hunt Status: {status_data['status']}")
                if status_data["status"] in ["completed", "failed", "error"]:
                    break
                await asyncio.sleep(2)
        
        print(f"\n[Test 5] Re-running live Heat Intelligence PDF job for {zone_id}...")
        pdf_resp = await client.post(
            f"http://127.0.0.1:8000/api/analysis/{zone_id}/heat-intelligence"
        )
        print(f"-> Heat Intelligence Start Status: {pdf_resp.status_code}")
        pdf_job_id = pdf_resp.json().get("job_id")
        
        if pdf_job_id:
            # Poll PDF job
            polls = 0
            while True:
                polls += 1
                status_resp = await client.get(f"http://127.0.0.1:8000/api/analysis/heat-intelligence/{pdf_job_id}")
                status_data = status_resp.json()
                print(f"   PDF Status (poll {polls}): {status_data['status']}")
                if status_data["status"] in ["completed", "failed", "error"]:
                    if status_data["status"] == "completed":
                        print(f"-> SUCCESS: PDF link returned: {status_data['result']['download_link']}")
                    break
                await asyncio.sleep(2)
                
        print(f"\n[Test 5.b] Testing 404 behavior for invalid zone_id...")
        invalid_resp = await client.post(
            f"http://127.0.0.1:8000/api/analysis/invalid_zone_xyz/heat-intelligence"
        )
        print(f"-> Invalid zone status: {invalid_resp.status_code}")
        if invalid_resp.status_code == 404:
            print("-> SUCCESS: Clean 404 error returned as expected.")
        else:
            print(f"-> UNEXPECTED: {invalid_resp.text}")

if __name__ == "__main__":
    asyncio.run(main())
