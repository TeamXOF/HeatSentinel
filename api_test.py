import time
import httpx
import sys

def main():
    print("TEST 2: Core Scan Pipeline Backend Trigger")
    resp = httpx.post(
        "http://127.0.0.1:8000/api/analysis/basic-scan",
        json={"city": "Phoenix", "state": "AZ", "forecast_hours": 0},
        timeout=120.0
    )
    scan_data = resp.json()
    print(f"Scan Status: {resp.status_code}")
    print(f"Hotspots found: {len(scan_data.get('hotspots', []))}")
    if scan_data.get('hotspots'):
        zone_id = scan_data['hotspots'][0]['id']
        print(f"First zone ID: {zone_id}")
    else:
        print("No hotspots found, exiting.")
        sys.exit(1)

    print("\nTEST 5: Heat Intelligence PDF Background Job")
    resp2 = httpx.post(f"http://127.0.0.1:8000/api/analysis/{zone_id}/heat-intelligence", timeout=10.0)
    job_data = resp2.json()
    print(f"Trigger Status: {resp2.status_code}")
    print(f"Job ID: {job_data.get('job_id')}")
    
    job_id = job_data.get('job_id')
    print("Polling status...")
    for _ in range(50):
        time.sleep(2)
        resp_status = httpx.get(f"http://127.0.0.1:8000/api/analysis/{zone_id}/heat-intelligence/{job_id}/status")
        status_data = resp_status.json()
        status = status_data.get("status")
        print(f"Status: {status}")
        if status in ["completed", "failed", "expired"]:
            print(f"Final State: {status}")
            if status == "completed":
                print(f"Download link: {status_data.get('download_link')}")
            break
            
    print("\nTEST 4: Forecast Capability")
    resp3 = httpx.post(
        "http://127.0.0.1:8000/api/analysis/basic-scan",
        json={"city": "Phoenix", "state": "AZ", "forecast_hours": 6},
        timeout=120.0
    )
    print(f"Forecast Status: {resp3.status_code}")
    
if __name__ == "__main__":
    main()
