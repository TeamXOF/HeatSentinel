import pytest
import asyncio
from httpx import Response
from app.services.heat_intelligence_service import start_heat_intelligence, get_heat_intelligence_job
from app.services.fortyguard_client import FortyGuardClient
from app.db import init_db, get_db_connection

class MockAsyncClient:
    async def post(self, url, headers=None, json=None):
        if "heat_intelligence" in url:
            return Response(200, json={"data": {"activity_id": "test_activity_123"}})
        return Response(500)
        
    async def get(self, url, headers=None):
        if "test_activity_123" in url:
            # Simulate completion
            return Response(200, json={
                "error": False,
                "status_code": 200,
                "message": "Success",
                "data": {
                    "activity_id": "test_activity_123",
                    "status": "completed",
                    "result": {
                        "map_data": {},
                        "stats_data": {},
                        "download_link": "https://s3.amazonaws.com/test-report.pdf"
                    }
                }
            })
        return Response(500)

@pytest.fixture
def mock_client():
    client = FortyGuardClient()
    client.http_client = MockAsyncClient()
    return client

@pytest.mark.asyncio
async def test_heat_intelligence_success_flow(mock_client):
    init_db()
    # 1. Trigger the background job
    job_id = start_heat_intelligence(
        zone_id="zone-1",
        latitude=33.4,
        longitude=-112.0,
        temperature=42.0,
        date="2026-08-22",
        client=mock_client
    )
    
    # 2. Assert job is initially pending/processing
    job = get_heat_intelligence_job(job_id)
    assert job is not None
    assert job.zone_id == "zone-1"
    assert job.status in ["pending", "processing"]
    
    # 3. Wait for the background task to complete (should be very fast with mock)
    await asyncio.sleep(0.5)
    
    # 4. Assert completed status and download link
    job = get_heat_intelligence_job(job_id)
    assert job.status == "completed"
    assert job.download_link == "https://s3.amazonaws.com/test-report.pdf"
    assert job.expires_at is not None
