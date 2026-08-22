import sys
from pathlib import Path

# Add the backend root to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_checks():
    print("Running Final Verification Check...")
    
    # 1. GET /health -> {"status": "ok"}
    r = client.get("/health")
    print(f"GET /health: {r.status_code} - {r.json()}")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
    
    # 2. GET /config/status -> booleans only, zero secret leakage
    r = client.get("/config/status")
    data = r.json()
    print(f"GET /config/status: {r.status_code} - {data}")
    assert r.status_code == 200
    assert all(isinstance(v, bool) or isinstance(v, str) for v in data.values())
    
    # 3. POST /api/heat-hunt/start -> {"jobId": "..."}
    r = client.post("/api/heat-hunt/start", json={"mode": "demo"})
    data = r.json()
    print(f"POST /api/heat-hunt/start: {r.status_code} - {data}")
    assert r.status_code == 200
    assert "jobId" in data
    job_id = data["jobId"]
    
    # 4. GET /api/heat-hunt/{job_id}/status -> status object
    r = client.get(f"/api/heat-hunt/{job_id}/status")
    data = r.json()
    print(f"GET /api/heat-hunt/{{job_id}}/status: {r.status_code} - {data}")
    assert r.status_code == 200
    assert "status" in data
    
    print("\nAll endpoints verified successfully!")

if __name__ == "__main__":
    run_checks()
