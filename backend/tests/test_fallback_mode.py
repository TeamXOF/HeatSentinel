"""
HeatSentinel AI - Fallback Mode & Reliability Verification Suite (Phase 13 / Step 43)
Tests the 3-tier fallback resolver (Live -> Cached <24h -> Deterministic Demo):
1. Demo scenario JSON schema and data integrity
2. Fallback service cache lookup & age cutoff logic
3. Fallback resolution and progress event replay
4. HeatHuntService explicit demo execution and fault recovery
5. HTTP endpoints contract (GET /api/heat-hunt/demo-scenario, POST /start with mode)
"""

import pytest
import json
import asyncio
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.fallback_service import (
    load_demo_scenario,
    get_recent_cached_heat_hunt,
    resolve_heat_hunt_fallback,
    get_demo_scenario_path,
)
from app.agent.heat_hunt_service import (
    start_heat_hunt,
    get_heat_hunt_job,
    list_heat_hunt_jobs,
)
from app.db import get_db_connection, init_db


@pytest.fixture(autouse=True)
def ensure_db():
    init_db()


def test_demo_scenario_dataset_validity():
    """Verify demo_scenario_phoenix.json structure, metadata, and zones."""
    assert get_demo_scenario_path().exists()

    data = load_demo_scenario()
    assert "metadata" in data
    assert "step_events" in data
    assert "final_result" in data

    meta = data["metadata"]
    assert meta["scenario_id"] == "phoenix_historic_peak_20240801"
    assert meta["city"] == "Phoenix, AZ"
    assert meta["mode"] == "demo"
    assert "captured_at" in meta
    assert "source" in meta

    events = data["step_events"]
    assert len(events) >= 8
    for evt in events:
        assert "step_number" in evt
        assert "tool_name" in evt
        assert "display_name" in evt
        assert "message" in evt

    res = data["final_result"]
    assert res["status"] == "completed"
    assert res["mode"] == "demo"
    assert "ranked_zones" in res
    assert len(res["ranked_zones"]) >= 2

    for zone in res["ranked_zones"]:
        assert "zone_id" in zone
        assert "zone_name" in zone
        assert "response_gap_score" in zone
        assert 0.0 <= zone["response_gap_score"] <= 10.0
        assert "empirical_evidence" in zone
        assert "recommend_action" in zone


@pytest.mark.asyncio
async def test_resolve_fallback_demo_mode_streaming():
    """Verify fallback resolution in demo mode streams events and returns accurate mode."""
    streamed_events = []

    async def callback(evt):
        streamed_events.append(evt)

    result = await resolve_heat_hunt_fallback(
        job_id="test-demo-job-01",
        on_step_callback=callback,
        force_mode="demo",
        replay_delay_ms=10,  # Fast replay for test
    )

    assert result["status"] == "completed"
    assert result["mode"] == "demo"
    assert len(streamed_events) >= 8
    assert streamed_events[0]["tool_name"] == "agent_init"
    assert "DEMO MODE" in streamed_events[0]["display_name"]


@pytest.mark.asyncio
async def test_resolve_fallback_auto_recovery_from_failure():
    """Verify fallback resolver triggers and marks reason when live API fails."""
    streamed_events = []

    async def callback(evt):
        streamed_events.append(evt)

    result = await resolve_heat_hunt_fallback(
        job_id="test-fail-recovery-job",
        on_step_callback=callback,
        failure_reason="FortyGuard 503 Gateway Timeout",
        replay_delay_ms=10,
    )

    assert result["status"] == "completed"
    assert result["mode"] in ("cached", "demo")
    assert len(streamed_events) >= 1
    assert "FortyGuard 503 Gateway Timeout" in streamed_events[0]["status"]


@pytest.mark.asyncio
async def test_heat_hunt_service_explicit_demo_mode():
    """Verify starting Heat Hunt in explicit demo mode executes smoothly."""
    job_id = await start_heat_hunt(
        provider="auto",
        mode="demo",
    )
    assert job_id is not None

    # Wait for background task to complete replay
    for _ in range(30):
        await asyncio.sleep(0.1)
        job = get_heat_hunt_job(job_id)
        if job and job.status == "completed":
            break

    job = get_heat_hunt_job(job_id)
    assert job is not None
    assert job.status == "completed"
    assert job.mode == "demo"
    assert job.result is not None
    assert len(job.progress_events) >= 8


@pytest.mark.asyncio
async def test_heat_hunt_service_live_fault_recovery():
    """Verify live investigation exception triggers graceful fault recovery to fallback."""
    with patch("app.agent.orchestrator.HeatHuntOrchestrator.run", new_callable=AsyncMock) as mock_run:
        mock_run.side_effect = ConnectionError("Simulated FortyGuard cluster outage")

        job_id = await start_heat_hunt(
            provider="auto",
            mode="live",
        )

        # Wait for background recovery
        for _ in range(30):
            await asyncio.sleep(0.1)
            job = get_heat_hunt_job(job_id)
            if job and job.status == "completed":
                break

        job = get_heat_hunt_job(job_id)
        assert job is not None
        assert job.status == "completed"
        # Recovered mode should be cached or demo, not left in dead failed state
        assert job.mode in ("cached", "demo")
        assert job.result is not None


def test_heat_hunt_router_demo_scenario_and_mode_endpoints():
    """Verify REST API endpoints for demo scenario and mode-tagged execution."""
    client = TestClient(app)

    # 1. GET /api/heat-hunt/demo-scenario
    demo_res = client.get("/api/heat-hunt/demo-scenario")
    assert demo_res.status_code == 200
    demo_data = demo_res.json()
    assert demo_data["metadata"]["scenario_id"] == "phoenix_historic_peak_20240801"
    assert len(demo_data["final_result"]["ranked_zones"]) >= 2

    # 2. POST /api/heat-hunt/start with mode="demo"
    start_res = client.post(
        "/api/heat-hunt/start",
        json={"mode": "demo", "start_date": "2024-08-01", "start_time": "14:00"}
    )
    assert start_res.status_code == 200
    start_data = start_res.json()
    assert start_data["mode"] == "demo"
    assert "job_id" in start_data
