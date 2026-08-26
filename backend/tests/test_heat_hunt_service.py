"""
HeatSentinel AI - Heat Hunt Service Tests (Phase 9 / Step 36)
Tests background job scheduling, incremental progress event persistence,
failure capture, and real-time event subscription.
"""

import pytest
import asyncio
from typing import Dict, Any, Optional, Callable
from unittest.mock import AsyncMock, MagicMock, patch

from app.agent.heat_hunt_service import (
    start_heat_hunt,
    get_heat_hunt_job,
    list_heat_hunt_jobs,
    subscribe_job_events,
    HeatHuntJob,
    ProgressEvent,
)
from app.agent.orchestrator import HeatHuntOrchestrator


class MockOrchestrator:
    """Mock orchestrator that simulates a multi-step investigation."""
    def __init__(self, should_fail: bool = False, fail_message: str = "Mock API failure"):
        self.should_fail = should_fail
        self.fail_message = fail_message

    async def run(
        self,
        target_area_geojson: Optional[Dict[str, Any]] = None,
        date_str: Optional[str] = None,
        time_str: Optional[str] = None,
        on_step: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        if on_step:
            await on_step(1, "scan_city", "Scanned Phoenix urban corridor (4 tiles analyzed).")
            await asyncio.sleep(0.05)
            await on_step(2, "refine_hotspot", "Refined hotspot geometry for Zone 1.")
            await asyncio.sleep(0.05)
            await on_step(3, "finalize_heat_hunt", "Investigation concluded successfully.")

        if self.should_fail:
            raise RuntimeError(self.fail_message)

        return {
            "status": "completed",
            "city": "Phoenix",
            "ranked_zones": [
                {
                    "zone_id": "zone-1",
                    "name": "Zone 1 — Central District",
                    "priority_tier": "CRITICAL",
                    "response_gap_score": 8.5
                }
            ],
            "executive_briefing": "Critical heat emergency in Central District.",
            "disclaimer": "Decision support only."
        }


@pytest.mark.asyncio
async def test_start_heat_hunt_success_lifecycle():
    """Verifies end-to-end background job execution and status updates."""
    mock_orch = MockOrchestrator(should_fail=False)

    job_id = await start_heat_hunt(
        target_area={"type": "Polygon", "coordinates": []},
        date_str="2024-08-01",
        time_str="14:00",
        provider="mock",
        model_name="mock-model",
        mode="live",
        orchestrator=mock_orch,
    )

    assert job_id is not None
    assert len(job_id) > 10

    # Poll until completed (max 2 seconds)
    completed_job: Optional[HeatHuntJob] = None
    for _ in range(20):
        await asyncio.sleep(0.1)
        job = get_heat_hunt_job(job_id)
        if job and job.status == "completed":
            completed_job = job
            break

    assert completed_job is not None
    assert completed_job.status == "completed"
    assert completed_job.mode == "live"
    assert completed_job.error is None
    assert completed_job.completed_at is not None
    assert completed_job.result is not None
    assert completed_job.result["status"] == "completed"
    assert len(completed_job.result["ranked_zones"]) == 1

    # Check progress events persisted in SQLite
    events = completed_job.progress_events
    assert len(events) >= 4  # init + 3 steps
    tool_names = [e.tool_name for e in events]
    assert "agent_init" in tool_names
    assert "scan_city" in tool_names
    assert "refine_hotspot" in tool_names
    assert "finalize_heat_hunt" in tool_names


@pytest.mark.asyncio
@patch("app.agent.heat_hunt_service.resolve_heat_hunt_fallback", new_callable=AsyncMock)
async def test_start_heat_hunt_failure_capture(mock_fallback):
    """Verifies that orchestrator exceptions transition status to 'failed' and capture errors."""
    mock_fallback.side_effect = RuntimeError("Fallback system unresponsive")
    mock_orch = MockOrchestrator(should_fail=True, fail_message="Thermal telemetry sensor offline")

    job_id = await start_heat_hunt(
        provider="mock",
        model_name="mock-model",
        orchestrator=mock_orch,
    )

    failed_job: Optional[HeatHuntJob] = None
    for _ in range(20):
        await asyncio.sleep(0.1)
        job = get_heat_hunt_job(job_id)
        if job and job.status == "failed":
            failed_job = job
            break

    assert failed_job is not None
    assert failed_job.status == "failed"
    assert "Thermal telemetry sensor offline" in (failed_job.error or "")
    assert failed_job.completed_at is not None

    # Error event was recorded in progress events
    err_events = [e for e in failed_job.progress_events if e.type == "error"]
    assert len(err_events) == 1
    assert "Thermal telemetry sensor offline" in err_events[0].message


@pytest.mark.asyncio
async def test_list_heat_hunt_jobs():
    """Verifies job listing query."""
    mock_orch = MockOrchestrator(should_fail=False)
    job_id = await start_heat_hunt(orchestrator=mock_orch)

    jobs = list_heat_hunt_jobs(limit=10)
    assert len(jobs) > 0
    job_ids = [j.job_id for j in jobs]
    assert job_id in job_ids


@pytest.mark.asyncio
async def test_subscribe_job_events_streaming():
    """Verifies real-time event streaming via async generator."""
    mock_orch = MockOrchestrator(should_fail=False)
    job_id = await start_heat_hunt(orchestrator=mock_orch)

    streamed_events = []
    async for event in subscribe_job_events(job_id, timeout_seconds=5.0):
        streamed_events.append(event)
        if event.tool_name == "finalize_heat_hunt":
            break

    assert len(streamed_events) >= 3
    tool_names = [e.tool_name for e in streamed_events]
    assert "scan_city" in tool_names
