"""
HeatSentinel AI - Heat Hunt Router Tests (Phase 10 / Step 37)
Tests REST and SSE endpoints:
- POST /api/heat-hunt/start
- GET /api/heat-hunt/{job_id}/status
- GET /api/heat-hunt/{job_id}/results (and alias /result)
- GET /api/heat-hunt/{job_id}/stream
- GET /api/heat-hunt/history
"""

import pytest
import asyncio
import json
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.agent.heat_hunt_service import (
    start_heat_hunt,
    get_heat_hunt_job,
)


class MockFastOrchestrator:
    """Fast mock orchestrator for integration testing."""
    async def run(self, **kwargs):
        on_step = kwargs.get("on_step")
        if on_step:
            await on_step(1, "scan_city", "Scanned Phoenix urban corridor.")
            await on_step(2, "finalize_heat_hunt", "Investigation concluded.")
        return {
            "status": "completed",
            "city": "Phoenix",
            "ranked_zones": [{"zone_id": "zone-1", "name": "Zone 1", "priority_tier": "CRITICAL"}],
            "executive_briefing": "Critical heat identified.",
            "disclaimer": "Decision support."
        }


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_post_start_heat_hunt(client):
    """Verifies that POST /api/heat-hunt/start returns immediately with a valid job_id."""
    with patch("app.routers.heat_hunt.service_start_heat_hunt") as mock_start:
        mock_start.return_value = "test-job-uuid-12345"

        response = client.post(
            "/api/heat-hunt/start",
            json={
                "start_date": "2024-08-01",
                "start_time": "14:00",
                "provider": "auto",
                "model_name": "gemini-3.5-flash-lite",
                "mode": "live"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["job_id"] == "test-job-uuid-12345"
        assert data["jobId"] == "test-job-uuid-12345"
        assert data["status"] == "pending"
        assert data["mode"] == "live"


def test_get_status_404(client):
    """Verifies that requesting an unknown job_id returns 404."""
    response = client.get("/api/heat-hunt/nonexistent-job-xyz/status")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_status_and_results_lifecycle(client):
    """Verifies status polling and result retrieval across lifecycle."""
    mock_orch = MockFastOrchestrator()
    job_id = await start_heat_hunt(
        provider="mock",
        model_name="mock-model",
        orchestrator=mock_orch,
    )

    # 1. Immediate status check
    status_resp = client.get(f"/api/heat-hunt/{job_id}/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["job_id"] == job_id
    assert status_data["jobId"] == job_id
    assert status_data["status"] in ("pending", "running", "completed")

    # Wait for completion (max 2s)
    for _ in range(20):
        await asyncio.sleep(0.1)
        job = get_heat_hunt_job(job_id)
        if job and job.status == "completed":
            break

    # 2. Check completed status
    completed_status_resp = client.get(f"/api/heat-hunt/{job_id}/status")
    assert completed_status_resp.status_code == 200
    assert completed_status_resp.json()["status"] == "completed"
    assert completed_status_resp.json()["events_count"] >= 3

    # 3. Check results endpoint
    results_resp = client.get(f"/api/heat-hunt/{job_id}/results")
    assert results_resp.status_code == 200
    results_data = results_resp.json()
    assert results_data["status"] == "completed"
    assert results_data["job_id"] == job_id
    assert results_data["result"] is not None
    assert len(results_data["result"]["ranked_zones"]) == 1

    # Check alias /result
    alias_resp = client.get(f"/api/heat-hunt/{job_id}/result")
    assert alias_resp.status_code == 200
    assert alias_resp.json()["status"] == "completed"


def test_get_history(client):
    """Verifies /api/heat-hunt/history endpoint returns recent job records."""
    response = client.get("/api/heat-hunt/history?limit=10")
    assert response.status_code == 200
    history = response.json()
    assert isinstance(history, list)
    if history:
        first = history[0]
        assert "job_id" in first
        assert "status" in first
        assert "progress_events" in first


@pytest.mark.asyncio
async def test_stream_sse_events(client):
    """Verifies SSE streaming endpoint yields valid text/event-stream chunks."""
    mock_orch = MockFastOrchestrator()
    job_id = await start_heat_hunt(
        provider="mock",
        model_name="mock-model",
        orchestrator=mock_orch,
    )

    # Stream SSE chunks
    with client.stream("GET", f"/api/heat-hunt/{job_id}/stream?timeout_seconds=5.0") as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")
        lines = []
        for line in response.iter_lines():
            if line:
                lines.append(line)
                if "[DONE]" in line:
                    break

        assert len(lines) > 0
        data_lines = [l for l in lines if l.startswith("data: ")]
        assert len(data_lines) >= 1
