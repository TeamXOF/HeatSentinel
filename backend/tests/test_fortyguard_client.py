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
@pytest.fixture
def mock_settings():
    with patch("app.services.fortyguard_client.get_settings") as mock_get_settings:
        settings = MagicMock()
        settings.fortyguard_api_key = "fake_test_key"
        mock_get_settings.return_value = settings
        yield settings

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
