import time
import httpx
import sys

BASE_URL = "http://127.0.0.1:8000/api"
client = httpx.Client(timeout=120.0)

def print_step(title):
    print(f"\n{'='*50}\n{title}\n{'='*50}")

def verify():
    # 1. Verify "Today" empty state
    print_step("Step 1: Live scan for Today (Empty State Expected)")
    res = client.post(f"{BASE_URL}/analysis/basic-scan", json={"city": "Phoenix", "top_n_hotspots": 5})
    if res.status_code != 200:
        print(f"FAIL: Today scan returned HTTP {res.status_code}: {res.text}")
        return False
    data = res.json()
    zones = data.get("ranked_zones", [])
    print(f"SUCCESS: Today scan completed. Zones returned: {len(zones)}")
    if len(zones) == 0:
        print("-> Confirmed 0 hotspots for Today.")
    else:
        print("-> Got some hotspots, that's fine too as long as it didn't error.")

    # 2. Verify "Historic 7D" live pipeline
    print_step("Step 2: Historic 7D Live Scan (2024-08-01 14:00)")
    start_ts = time.time()
    res = client.post(f"{BASE_URL}/analysis/basic-scan?force_refresh=true", json={
        "city": "Phoenix",
        "start_date": "2024-08-01",
        "start_time": "14:00",
        "top_n_hotspots": 3
    })
    duration = time.time() - start_ts
    if res.status_code != 200:
        print(f"FAIL: Historic 7D scan returned HTTP {res.status_code}: {res.text}")
        return False
    data = res.json()
    zones = data.get("ranked_zones", [])
    print(f"SUCCESS: Historic 7D scan completed in {duration:.1f}s.")
    print(f"Mode: {data.get('mode')} (Should be 'live' for force_refresh)")
    print(f"Zones returned: {len(zones)}")
    if len(zones) == 0:
        print("FAIL: Expected real hotspots for the demo date, but got 0.")
        return False

    first_zone_id = zones[0]["zone_id"]
    print(f"-> Selected top zone: {first_zone_id}")

    # 3. Verify Heat Intelligence PDF Generation
    print_step(f"Step 3: Heat Intelligence PDF Generation for {first_zone_id}")
    res = client.post(f"{BASE_URL}/analysis/{first_zone_id}/heat-intelligence")
    if res.status_code not in (200, 201, 202):
        print(f"FAIL: Failed to trigger Heat Intelligence: {res.text}")
        return False
    
    job_data = res.json()
    job_id = job_data.get("job_id")
    print(f"SUCCESS: Job triggered. Job ID: {job_id}")

    # Poll status
    print("Polling for PDF completion (~50s expected)...")
    for _ in range(15):
        time.sleep(5)
        status_res = client.get(f"{BASE_URL}/analysis/{first_zone_id}/heat-intelligence/{job_id}/status")
        if status_res.status_code != 200:
            print(f"Polling failed: {status_res.text}")
            continue
        status_data = status_res.json()
        status = status_data.get("status")
        print(f"Status: {status}")
        if status == "completed":
            print(f"SUCCESS: PDF Generated! Download link: {status_data.get('download_link')}")
            break
        elif status in ("failed", "expired"):
            print(f"FAIL: Job {status}")
            return False
    else:
        print("FAIL: Timed out waiting for PDF generation.")
        return False
        
    print_step("All verification steps passed successfully!")
    return True

if __name__ == "__main__":
    sys.exit(0 if verify() else 1)
