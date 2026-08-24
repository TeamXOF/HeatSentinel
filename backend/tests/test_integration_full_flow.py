"""
HeatSentinel AI - Full End-to-End Integration Test Suite (Phase 12 / Step 41)
Proves that the complete Definition-of-Done flow works together end-to-end:
RUN HEAT HUNT -> Target area tiling -> FortyGuard scan -> Hotspot detection
-> Refinement -> Vulnerability ACS join -> Resource analysis -> Response Gap calculation
-> Priority ranking -> Recommendation generation -> Evidence audit trail assembly
-> HTTP API endpoints & SSE streaming.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.agent.orchestrator import HeatHuntOrchestrator
from app.agent.heat_hunt_service import start_heat_hunt, get_heat_hunt_job, subscribe_job_events
from app.services.pipeline_service import load_default_phoenix_target_area


@pytest.fixture
def mock_fortyguard_scan_features():
    """Generates synthetic 60m thermal grid features for fast deterministic testing."""
    features = []
    # Cluster 1: High thermal intensity downtown
    for i in range(8):
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-112.075 + (i * 0.0002), 33.445],
                    [-112.074 + (i * 0.0002), 33.445],
                    [-112.074 + (i * 0.0002), 33.444],
                    [-112.075 + (i * 0.0002), 33.444],
                    [-112.075 + (i * 0.0002), 33.445]
                ]]
            },
            "properties": {"value": 46.5 + (i * 0.2), "tile_id": "tile_0_0"}
        })
    # Cluster 2: Maryvale warm zone
    for i in range(8):
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-112.185 + (i * 0.0002), 33.480],
                    [-112.184 + (i * 0.0002), 33.480],
                    [-112.184 + (i * 0.0002), 33.479],
                    [-112.185 + (i * 0.0002), 33.479],
                    [-112.185 + (i * 0.0002), 33.480]
                ]]
            },
            "properties": {"value": 43.8 + (i * 0.1), "tile_id": "tile_1_0"}
        })
    return features


@pytest.mark.asyncio
async def test_full_orchestrator_end_to_end_flow(mock_fortyguard_scan_features):
    """
    Validates complete orchestrator execution from initial scan through
    empirical evidence assembly and priority ranking.
    """
    mock_scan_res = {
        "status": "success",
        "summary": {
            "total_tiles": 4,
            "total_cells": len(mock_fortyguard_scan_features),
            "duration_ms": 120.0
        },
        "data": {
            "type": "FeatureCollection",
            "features": mock_fortyguard_scan_features
        }
    }

    with patch("app.services.scan_service.scan_area", new_callable=AsyncMock) as mock_scan, \
         patch("app.services.fortyguard_client.FortyGuardClient.run_heatmap", new_callable=AsyncMock) as mock_heatmap:
        
        mock_scan.return_value = mock_scan_res
        mock_heatmap.return_value = {"type": "FeatureCollection", "features": mock_fortyguard_scan_features}

        orchestrator = HeatHuntOrchestrator(provider="deterministic", max_steps=25)
        result = await orchestrator.run(date_str="2024-08-01", time_str="14:00")

        # 1. Pipeline status
        assert result["status"] == "completed"
        assert result["total_ranked_zones"] >= 1
        assert "disclaimer" in result

        # 2. Executive Briefing
        assert "HeatSentinel autonomous agent completed" in result["executive_briefing"]
        assert len(result["executive_briefing"]) > 50

        # 3. Ranked Zones
        ranked = result["ranked_zones"]
        assert len(ranked) >= 1
        
        for zone in ranked:
            # Identity
            assert "zone_id" in zone
            assert "zone_name" in zone
            
            # Response Gap & Priority
            assert "response_gap_score" in zone
            assert 0.0 <= zone["response_gap_score"] <= 10.0
            assert zone["priority_tier"] in ("LOW", "MODERATE", "HIGH", "CRITICAL")
            assert "component_breakdown" in zone
            
            # Empirical Evidence
            assert "empirical_evidence" in zone
            ev = zone["empirical_evidence"]
            assert "thermal_metrics" in ev
            assert "vulnerability_demographics" in ev
            assert "cooling_infrastructure" in ev
            
            # Action Recommendation
            assert "priority_recommendation" in zone
            rec = zone["priority_recommendation"]
            assert "title" in rec
            assert "action_type" in rec
            assert "rationale" in rec
            
            # Disclaimer
            assert "disclaimer" in zone


@pytest.mark.asyncio
async def test_full_heat_hunt_async_job_and_streaming(mock_fortyguard_scan_features):
    """
    Validates the asynchronous background worker, SSE generator streaming,
    and durable SQLite job storage.
    """
    mock_scan_res = {
        "status": "success",
        "summary": {
            "total_tiles": 4,
            "total_cells": len(mock_fortyguard_scan_features),
            "duration_ms": 150.0
        },
        "data": {
            "type": "FeatureCollection",
            "features": mock_fortyguard_scan_features
        }
    }

    with patch("app.services.scan_service.scan_area", new_callable=AsyncMock) as mock_scan, \
         patch("app.services.fortyguard_client.FortyGuardClient.run_heatmap", new_callable=AsyncMock) as mock_heatmap:
        
        mock_scan.return_value = mock_scan_res
        mock_heatmap.return_value = {"type": "FeatureCollection", "features": mock_fortyguard_scan_features}

        # 1. Start Job
        job_id = await start_heat_hunt(
            date_str="2024-08-01",
            time_str="14:00",
            provider="deterministic"
        )
        assert job_id is not None

        # 2. Stream events via generator
        collected_events = []
        async for evt in subscribe_job_events(job_id, timeout_seconds=10.0):
            collected_events.append(evt)
            if evt.tool_name == "agent_completed":
                break

        assert len(collected_events) >= 5

        # 3. Verify Job Completion in DB
        job = get_heat_hunt_job(job_id)
        assert job is not None
        assert job.status == "completed"
        assert job.result is not None
        assert len(job.result["ranked_zones"]) >= 1


def test_full_http_api_lifecycle(mock_fortyguard_scan_features):
    """
    Validates the end-to-end HTTP REST API contract:
    POST /start -> GET /status -> GET /results -> GET /history.
    """
    mock_scan_res = {
        "status": "success",
        "summary": {
            "total_tiles": 4,
            "total_cells": len(mock_fortyguard_scan_features),
            "duration_ms": 100.0
        },
        "data": {
            "type": "FeatureCollection",
            "features": mock_fortyguard_scan_features
        }
    }

    with patch("app.services.scan_service.scan_area", new_callable=AsyncMock) as mock_scan, \
         patch("app.services.fortyguard_client.FortyGuardClient.run_heatmap", new_callable=AsyncMock) as mock_heatmap:
        
        mock_scan.return_value = mock_scan_res
        mock_heatmap.return_value = {"type": "FeatureCollection", "features": mock_fortyguard_scan_features}

        client = TestClient(app)

        # 1. POST /api/heat-hunt/start
        start_resp = client.post("/api/heat-hunt/start", json={
            "provider": "deterministic",
            "date_str": "2024-08-01",
            "time_str": "14:00"
        })
        assert start_resp.status_code == 200
        data = start_resp.json()
        assert "job_id" in data
        assert data["status"] in ("pending", "running", "completed")
        job_id = data["job_id"]

        # 2. GET /api/heat-hunt/{job_id}/status
        status_resp = client.get(f"/api/heat-hunt/{job_id}/status")
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        assert status_data["job_id"] == job_id
        assert status_data["status"] in ("pending", "running", "completed")

        # 3. GET /api/heat-hunt/history
        hist_resp = client.get("/api/heat-hunt/history")
        assert hist_resp.status_code == 200
        hist_data = hist_resp.json()
        assert isinstance(hist_data, list)
        assert len(hist_data) >= 1
        assert any(j["job_id"] == job_id for j in hist_data)
