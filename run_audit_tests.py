import time
import httpx
import sys

BASE_URL = "http://127.0.0.1:8000/api"
# Use standard library timeouts or httpx client with extended timeouts
client = httpx.Client(timeout=180.0)

def print_step(title):
    print(f"\n{'='*50}\n{title}\n{'='*50}")

def run_full_pipeline(run_idx):
    print_step(f"Run {run_idx}: Historic 7D Live Scan (2024-08-01 14:00)")
    start_ts = time.time()
    res = client.post(f"{BASE_URL}/analysis/basic-scan?force_refresh=true", json={
        "city": "Phoenix",
        "start_date": "2024-08-01",
        "start_time": "14:00",
        "top_n_hotspots": 3
    })
    duration = time.time() - start_ts
    if res.status_code != 200:
        print(f"FAIL Run {run_idx}: HTTP {res.status_code} - {res.text}")
        return False
        
    data = res.json()
    zones = data.get("ranked_zones", [])
    print(f"SUCCESS Run {run_idx}: Completed in {duration:.1f}s.")
    print(f"Mode: {data.get('mode')}")
    
    if len(zones) == 0:
        print(f"FAIL Run {run_idx}: Expected hotspots, got 0.")
        return False

    first_zone_id = zones[0]["zone_id"]
    print(f"-> Selected top zone: {first_zone_id}")

    print_step(f"Run {run_idx}: Heat Intelligence PDF Generation for {first_zone_id}")
    res = client.post(f"{BASE_URL}/analysis/{first_zone_id}/heat-intelligence")
    if res.status_code not in (200, 201, 202):
        print(f"FAIL Run {run_idx}: Failed to trigger Heat Intelligence: {res.text}")
        return False
    
    job_id = res.json().get("job_id")
    print(f"Job triggered. ID: {job_id}")

    print("Polling for PDF completion (up to 150s)...")
    for attempt in range(30):
        time.sleep(5)
        try:
            status_res = client.get(f"{BASE_URL}/analysis/{first_zone_id}/heat-intelligence/{job_id}/status")
        except Exception as e:
            print(f"Exception during polling: {e}")
            continue
            
        if status_res.status_code != 200:
            print(f"Polling HTTP {status_res.status_code}")
            continue
            
        status_data = status_res.json()
        status = status_data.get("status")
        print(f"Attempt {attempt+1}: Status = {status}")
        
        if status == "completed":
            print(f"SUCCESS: PDF Generated! Link: {status_data.get('download_link')}")
            return True
        elif status in ("failed", "expired"):
            print(f"FAIL: Job {status}")
            return False
            
    print("FAIL: Timed out waiting for PDF.")
    return False

def verify():
    # Run 1
    if not run_full_pipeline(1): return False
    print("Waiting 15 seconds before consecutive run to simulate UI pacing...")
    time.sleep(15)
    # Run 2
    if not run_full_pipeline(2): return False
    
    print_step("All two consecutive runs passed successfully with PDF links!")
    return True

if __name__ == "__main__":
    sys.exit(0 if verify() else 1)
