import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.fortyguard_client import FortyGuardClient
from app.models.fortyguard import HeatmapRequest, StatusResponse
from app.errors import FortyGuardAPIError

# Sample valid request based on the models
sample_request = HeatmapRequest(
    polygon_aoi={
        "type": "Polygon",
        "coordinates": [[[-112.075, 33.450], [-112.070, 33.450], [-112.070, 33.445], [-112.075, 33.445], [-112.075, 33.450]]]
    },
    date_time={"start_date": "2026-08-22", "start_time": "14:00", "filter_type": 1},
    analytic_type="tcm",
    granularity=60
)

# Mock Settings to provide a fake API key
@pytest.fixture(autouse=True)
def mock_settings():
    from app.services.fortyguard_client import reset_budget_guard
    reset_budget_guard()
    with patch("app.services.fortyguard_client.get_settings") as mock_get_settings:
        settings = MagicMock()
        settings.fortyguard_api_key = "fake_test_key"
        settings.fortyguard_mode = "live"
        settings.fortyguard_max_calls_per_run = 100
        settings.fortyguard_request_timeout_seconds = 30.0
        settings.fortyguard_poll_timeout_seconds = 60.0
        settings.fortyguard_max_retries = 2
        mock_get_settings.return_value = settings
        yield settings
    reset_budget_guard()

@pytest.fixture
def mock_http_client():
    client = MagicMock(spec=httpx.AsyncClient)
    client.post = AsyncMock()
    client.get = AsyncMock()
    return client

@pytest.mark.asyncio
async def test_submit_heatmap_success(mock_http_client, mock_settings):
    # Mock the POST response
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "error": False,
        "status_code": 200,
        "message": "Heatmap Submitted Successfully",
        "data": {"activity_id": "test-activity-123"}
    }
    mock_http_client.post.return_value = mock_resp
    
    client = FortyGuardClient(http_client=mock_http_client)
    
    activity_id = await client.submit_heatmap(sample_request)
    assert activity_id == "test-activity-123"
    
    # Ensure api-key was passed in headers correctly
    call_args = mock_http_client.post.call_args
    assert call_args.kwargs["headers"]["api-key"] == "fake_test_key"

@pytest.mark.asyncio
async def test_submit_heatmap_failure(mock_http_client, mock_settings):
    mock_resp = MagicMock()
    mock_resp.status_code = 422
    mock_resp.text = "Validation Error"
    mock_http_client.post.return_value = mock_resp
    
    client = FortyGuardClient(http_client=mock_http_client)
    
    with pytest.raises(FortyGuardAPIError) as exc:
        await client.submit_heatmap(sample_request)
        
    assert "Failed to submit heatmap" in str(exc.value)

@pytest.mark.asyncio
async def test_poll_until_complete_success(mock_http_client, mock_settings):
    # Mock the GET response to return 'Processing' then 'Completed'
    resp_processing = MagicMock()
    resp_processing.status_code = 200
    resp_processing.json.return_value = {
        "error": False,
        "status_code": 200,
        "message": "Processing",
        "data": {"activity_id": "test-123", "status": "Processing"}
    }
    
    resp_completed = MagicMock()
    resp_completed.status_code = 200
    resp_completed.json.return_value = {
        "error": False,
        "status_code": 200,
        "message": "Completed",
        "data": {
            "activity_id": "test-123", 
            "status": "Completed",
            "result": {
                "map_data": {"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {}}]},
                "stats_data": {"activity_id": "test-123", "n_cells": 1}
            }
        }
    }
    
    # side_effect will yield processing on first call, completed on second call
    mock_http_client.get.side_effect = [resp_processing, resp_completed]
    
    client = FortyGuardClient(http_client=mock_http_client)
    
    # Set a tiny interval so the test runs instantly
    result_resp = await client.poll_until_complete("test-123", timeout_seconds=10, interval_seconds=0.01)
    
    assert result_resp.data.status == "Completed"
    assert len(result_resp.data.result.map_data["features"]) == 1
    assert mock_http_client.get.call_count == 2

@pytest.mark.asyncio
async def test_poll_until_complete_timeout(mock_http_client, mock_settings):
    resp_processing = MagicMock()
    resp_processing.status_code = 200
    resp_processing.json.return_value = {
        "error": False,
        "status_code": 200,
        "message": "Processing",
        "data": {"activity_id": "test-123", "status": "Processing"}
    }
    
    mock_http_client.get.return_value = resp_processing
    
    client = FortyGuardClient(http_client=mock_http_client)
    
    # Timeout after 0.05 seconds, interval 0.02
    with pytest.raises(FortyGuardAPIError) as exc:
        await client.poll_until_complete("test-123", timeout_seconds=0.05, interval_seconds=0.02)
        
    assert "Polling timeout" in str(exc.value)

@pytest.mark.asyncio
async def test_run_heatmap_integration(mock_http_client, mock_settings):
    # Mock submit
    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 200
    mock_post_resp.json.return_value = {
        "error": False,
        "status_code": 200,
        "message": "Heatmap Submitted Successfully",
        "data": {"activity_id": "test-123"}
    }
    mock_http_client.post.return_value = mock_post_resp
    
    # Mock poll
    resp_completed = MagicMock()
    resp_completed.status_code = 200
    resp_completed.json.return_value = {
        "error": False,
        "status_code": 200,
        "message": "Completed",
        "data": {
            "activity_id": "test-123", 
            "status": "Completed",
            "result": {
                "map_data": {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"temp": 110}}]},
                "stats_data": {"activity_id": "test-123", "n_cells": 1}
            }
        }
    }
    mock_http_client.get.return_value = resp_completed
    
    client = FortyGuardClient(http_client=mock_http_client)
    
    # Run heatmap should return the normalized map_data (FeatureCollection)
    geojson_result = await client.run_heatmap(sample_request, timeout_seconds=10, interval_seconds=0.01)
    
    assert geojson_result["type"] == "FeatureCollection"
    assert geojson_result["features"][0]["properties"]["temp"] == 110


@pytest.mark.asyncio
async def test_budget_guard_hard_stop_enforcement(mock_http_client, mock_settings):
    """Verifies that exceeding fortyguard_max_calls_per_run hard-stops with FortyGuardAPIError 429."""
    from app.services.fortyguard_client import reset_budget_guard
    mock_settings.fortyguard_mode = "live"
    mock_settings.fortyguard_max_calls_per_run = 2
    reset_budget_guard(2)

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "error": False,
        "status_code": 200,
        "message": "Heatmap Submitted Successfully",
        "data": {"activity_id": "test-activity-123"}
    }
    mock_http_client.post.return_value = mock_resp

    client = FortyGuardClient(http_client=mock_http_client)

    # Call 1: Allowed
    await client.submit_heatmap(sample_request)
    # Call 2: Allowed
    await client.submit_heatmap(sample_request)

    # Call 3: Exceeds max_calls_per_run (2) -> HARD STOP REFUSAL
    with pytest.raises(FortyGuardAPIError) as exc_info:
        await client.submit_heatmap(sample_request)

    assert exc_info.value.status_code == 429
    assert "Budget guard limit reached" in exc_info.value.message
    reset_budget_guard()


@pytest.mark.asyncio
async def test_budget_guard_concurrent_gather_enforcement(mock_http_client, mock_settings):
    """
    Verifies that when multiple coroutines execute CONCURRENTLY via asyncio.gather within a run,
    they atomically share the exact same RunBudgetTracker instance protected by asyncio.Lock.
    With max_allowed = 3 and 10 concurrent requests:
    - Exactly 3 calls succeed.
    - Exactly 7 calls fail with FortyGuardAPIError (HTTP 429).
    - The tracker call count strictly equals 3 (never 10 or 30).
    """
    import asyncio
    from app.services.fortyguard_client import reset_run_budget, get_run_live_call_count, reset_budget_guard
    reset_budget_guard(3)

    mock_settings.fortyguard_mode = "live"
    mock_settings.fortyguard_max_calls_per_run = 3

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "error": False,
        "status_code": 200,
        "message": "Heatmap Submitted Successfully",
        "data": {"activity_id": "test-concurrent-activity"}
    }
    mock_http_client.post.return_value = mock_resp
    client = FortyGuardClient(http_client=mock_http_client)

    # Spawn 10 concurrent coroutines targeting the FortyGuard client
    tasks = [client.submit_heatmap(sample_request) for _ in range(10)]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    successes = [r for r in results if isinstance(r, str)]
    failures = [r for r in results if isinstance(r, FortyGuardAPIError)]

    assert len(successes) == 3, f"Expected exactly 3 successful calls, got {len(successes)}"
    assert len(failures) == 7, f"Expected exactly 7 blocked calls, got {len(failures)}"
    for f in failures:
        assert f.status_code == 429
        assert "Budget guard limit reached" in f.message

    assert get_run_live_call_count() == 3
    reset_budget_guard()


@pytest.mark.asyncio
async def test_budget_guard_cross_run_reset_isolation(mock_http_client, mock_settings):
    """
    Verifies that the Request Budget Guard is scoped per run context and resets cleanly across separate runs,
    even when each run executes concurrent asyncio.gather tasks.
    - Run 1 spawns 5 concurrent tasks with limit=2 -> 2 succeed, 3 blocked with 429.
    - Run 2 starts fresh with limit=2 and spawns 5 concurrent tasks -> 2 succeed, 3 blocked with 429.
    """
    import asyncio
    from app.services.fortyguard_client import reset_run_budget, get_run_live_call_count, reset_budget_guard
    reset_budget_guard()

    mock_settings.fortyguard_mode = "live"
    mock_settings.fortyguard_max_calls_per_run = 2

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "error": False,
        "status_code": 200,
        "message": "Heatmap Submitted Successfully",
        "data": {"activity_id": "test-activity-123"}
    }
    mock_http_client.post.return_value = mock_resp
    client = FortyGuardClient(http_client=mock_http_client)

    # -------------------------------------------------------------
    # RUN 1: Starts fresh with limit 2, runs 5 concurrent tasks
    # -------------------------------------------------------------
    reset_run_budget(2)
    assert get_run_live_call_count() == 0

    run1_tasks = [client.submit_heatmap(sample_request) for _ in range(5)]
    run1_results = await asyncio.gather(*run1_tasks, return_exceptions=True)

    run1_successes = [r for r in run1_results if isinstance(r, str)]
    run1_failures = [r for r in run1_results if isinstance(r, FortyGuardAPIError)]
    assert len(run1_successes) == 2
    assert len(run1_failures) == 3
    assert get_run_live_call_count() == 2

    # -------------------------------------------------------------
    # RUN 2: Starts fresh (e.g. new user investigation), runs 5 concurrent tasks
    # -------------------------------------------------------------
    reset_run_budget(2)
    assert get_run_live_call_count() == 0

    run2_tasks = [client.submit_heatmap(sample_request) for _ in range(5)]
    run2_results = await asyncio.gather(*run2_tasks, return_exceptions=True)

    run2_successes = [r for r in run2_results if isinstance(r, str)]
    run2_failures = [r for r in run2_results if isinstance(r, FortyGuardAPIError)]
    assert len(run2_successes) == 2
    assert len(run2_failures) == 3
    assert get_run_live_call_count() == 2

    reset_budget_guard()


@pytest.mark.asyncio
async def test_orchestrator_and_pipeline_budget_lifecycle_under_limit(mock_settings):
    """
    Verifies that real entrypoints (run_basic_pipeline and HeatHuntOrchestrator.run)
    initialize the budget tracker with the correct configured ceiling (e.g. 12),
    allowing normal under-limit runs to execute to completion without false-positive 429 blocks at call #1.
    """
    from app.services.pipeline_service import run_basic_pipeline
    from app.agent.orchestrator import HeatHuntOrchestrator
    from app.services.fortyguard_client import get_current_run_tracker, reset_budget_guard
    from app.db import init_db

    init_db()
    mock_settings.fortyguard_mode = "mock"
    mock_settings.fortyguard_max_calls_per_run = 12

    # 1. Pipeline entrypoint test
    pipeline_res = await run_basic_pipeline(city="Phoenix", top_n_hotspots=2)
    assert pipeline_res.status in ("ok", "success")
    assert len(pipeline_res.ranked_zones) > 0
    # Confirm tracker initialized with ceiling 12, not 0
    tracker = get_current_run_tracker()
    assert tracker.max_allowed == 12

    # 2. Orchestrator entrypoint test
    orchestrator = HeatHuntOrchestrator(model_name="gemini-2.5-flash")
    steps = []
    async def capture_step(s):
        steps.append(s)

    hunt_res = await orchestrator.run(
        target_area_geojson=None,
        date_str="2024-08-01",
        time_str="14:00",
        on_step=capture_step
    )
    assert hunt_res.get("status") == "completed"
    assert len(hunt_res.get("ranked_zones", [])) > 0
    tracker = get_current_run_tracker()
    assert tracker.max_allowed == 12

    reset_budget_guard()




