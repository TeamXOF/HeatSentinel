import pytest
import json
import sqlite3
from unittest.mock import AsyncMock, patch

from app.agent.orchestrator import HeatHuntOrchestrator
from app.services.pipeline_service import run_basic_pipeline
from app.services.fortyguard_client import FortyGuardClient
from app.models.fortyguard import StatusResponse, StatusData, HeatmapResult
from app.db import get_db_connection, init_db

@pytest.mark.asyncio
async def test_audit_fortyguard_call_multipliers_cold_and_warm_cache():
    """
    Measure FortyGuard call counts on both cold cache (fresh date) and warm cache (re-query).
    """
    init_db()
    # Clear cache tables to simulate a fresh/uncached run
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute("DELETE FROM fortyguard_cache")
        c.execute("DELETE FROM zone_heat_metrics_cache")
        c.execute("DELETE FROM pipeline_basic_scan_cache")
        conn.commit()

    call_log = []

    async def mock_submit_heatmap(self, request):
        payload = request.model_dump(mode="json", exclude_none=True)
        call_log.append({
            "endpoint": "/v1/heatmap",
            "analytic_type": payload.get("analytic_type"),
            "date_time": payload.get("date_time"),
            "granularity": payload.get("granularity"),
            "polygon_type": payload.get("polygon_aoi", {}).get("type")
        })
        return f"mock-act-{len(call_log)}"

    # Generate synthetic 60m features for tiles so DBSCAN finds clusters
    synthetic_features = []
    for i in range(12):
        synthetic_features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-112.075 + (i * 0.001), 33.445],
                    [-112.074 + (i * 0.001), 33.445],
                    [-112.074 + (i * 0.001), 33.444],
                    [-112.075 + (i * 0.001), 33.444],
                    [-112.075 + (i * 0.001), 33.445]
                ]]
            },
            "properties": {"value": 45.0 + (i * 0.1), "cell_id": f"cell-{i}"}
        })

    async def mock_poll_until_complete(self, activity_id, timeout_seconds=None, interval_seconds=0.01, request_context=None):
        return StatusResponse(
            error=False,
            status_code=200,
            message="Success",
            data=StatusData(
                activity_id=activity_id,
                status="completed",
                result=HeatmapResult(
                    map_data={
                        "type": "FeatureCollection",
                        "features": synthetic_features
                    }
                )
            )
        )

    with patch.object(FortyGuardClient, "submit_heatmap", mock_submit_heatmap), \
         patch.object(FortyGuardClient, "poll_until_complete", mock_poll_until_complete):
        
        # -------------------------------------------------------------
        # PHASE 1: Cold Cache Run (First investigation of this date)
        # -------------------------------------------------------------
        call_log.clear()
        orchestrator = HeatHuntOrchestrator(provider="deterministic")
        result = await orchestrator.run(date_str="2024-08-01", time_str="14:00")
        cold_heat_hunt_calls = len(call_log)

        print(f"\n=======================================================")
        print(f"[COLD CACHE AUDIT] Heat Hunt FortyGuard calls: {cold_heat_hunt_calls}")
        for i, c in enumerate(call_log, 1):
            print(f"  [{i:02d}] {c['endpoint']} | type={c['analytic_type']} | dt={c['date_time']}")

        call_log.clear()
        pipeline_res = await run_basic_pipeline(city="Phoenix", start_date="2024-08-01", start_time="14:00")
        cold_basic_scan_calls = len(call_log)

        print(f"\n=======================================================")
        print(f"[COLD CACHE AUDIT] Basic Scan FortyGuard calls: {cold_basic_scan_calls}")
        for i, c in enumerate(call_log, 1):
            print(f"  [{i:02d}] {c['endpoint']} | type={c['analytic_type']} | dt={c['date_time']}")

        total_cold = cold_heat_hunt_calls + cold_basic_scan_calls
        print(f"\n=======================================================")
        print(f"[COLD CACHE SUMMARY] Total Combined Calls: {total_cold} (Prior unoptimized: 75 calls)")
        print(f"=======================================================\n")

        # -------------------------------------------------------------
        # PHASE 2: Warm Cache Run (Second click / repeat investigation)
        # -------------------------------------------------------------
        call_log.clear()
        warm_orchestrator = HeatHuntOrchestrator(provider="deterministic")
        warm_result = await warm_orchestrator.run(date_str="2024-08-01", time_str="14:00")
        warm_heat_hunt_calls = len(call_log)

        call_log.clear()
        warm_pipeline_res = await run_basic_pipeline(city="Phoenix", start_date="2024-08-01", start_time="14:00")
        warm_basic_scan_calls = len(call_log)

        total_warm = warm_heat_hunt_calls + warm_basic_scan_calls
        print(f"=======================================================")
        print(f"[WARM CACHE AUDIT] Heat Hunt Calls: {warm_heat_hunt_calls}")
        print(f"[WARM CACHE AUDIT] Basic Scan Calls: {warm_basic_scan_calls}")
        print(f"[WARM CACHE SUMMARY] Total Combined Warm Calls: {total_warm} (100% Served from SQLite)")
        print(f"=======================================================\n")

        assert cold_heat_hunt_calls <= 10, f"Expected <= 10 cold Heat Hunt calls, got {cold_heat_hunt_calls}"
        assert cold_basic_scan_calls <= 4, f"Expected <= 4 cold Basic Scan calls, got {cold_basic_scan_calls}"
        assert warm_heat_hunt_calls == 0, f"Expected 0 warm Heat Hunt calls, got {warm_heat_hunt_calls}"
        assert warm_basic_scan_calls == 0, f"Expected 0 warm Basic Scan calls, got {warm_basic_scan_calls}"
