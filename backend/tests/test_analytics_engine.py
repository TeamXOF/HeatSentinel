import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.analytics_engine import get_persistence, get_exceedance, get_historical_baseline, calculate_anomaly
from app.services.fortyguard_client import FortyGuardClient

@pytest.fixture
def mock_client():
    return MagicMock(spec=FortyGuardClient)

@pytest.fixture
def sample_polygon():
    return {
        "type": "Polygon",
        "coordinates": [[
            [-112.074, 33.448],
            [-112.074, 33.449],
            [-112.073, 33.449],
            [-112.073, 33.448],
            [-112.074, 33.448]
        ]]
    }

@pytest.mark.asyncio
async def test_get_persistence(monkeypatch, mock_client, sample_polygon):
    mock_scan_area = AsyncMock(return_value={"summary": {}, "data": {"features": []}})
    monkeypatch.setattr("app.services.analytics_engine.scan_area", mock_scan_area)
    
    result = await get_persistence(
        polygon=sample_polygon,
        start_date="2023-08-01",
        start_time="14:00",
        threshold=38.0,
        client=mock_client
    )
    
    assert "data" in result
    mock_scan_area.assert_called_once_with(
        polygon=sample_polygon,
        analytic_type="persistence",
        granularity=60,
        start_date="2023-08-01",
        start_time="14:00",
        client=mock_client,
        threshold=38.0,
        direction="above"
    )

@pytest.mark.asyncio
async def test_get_exceedance(monkeypatch, mock_client, sample_polygon):
    mock_scan_area = AsyncMock(return_value={"summary": {}, "data": {"features": []}})
    monkeypatch.setattr("app.services.analytics_engine.scan_area", mock_scan_area)
    
    result = await get_exceedance(
        polygon=sample_polygon,
        start_date="2023-08-01",
        start_time="14:00",
        threshold=40.5,
        client=mock_client,
        direction="below"
    )
    
    assert "data" in result
    mock_scan_area.assert_called_once_with(
        polygon=sample_polygon,
        analytic_type="exceedance",
        granularity=60,
        start_date="2023-08-01",
        start_time="14:00",
        client=mock_client,
        threshold=40.5,
        direction="below"
    )

@pytest.mark.asyncio
async def test_get_historical_baseline_success(monkeypatch, mock_client, sample_polygon):
    # Mock scan_area to return dummy features with tcm values for each day
    mock_scan_area = AsyncMock(side_effect=[
        {"data": {"features": [{"properties": {"value": 40.0}}]}},
        {"data": {"features": [{"properties": {"value": 38.0}}]}},
        {"data": {"features": [{"properties": {"value": 39.0}}]}},
        {"data": {"features": [{"properties": {"value": 41.0}}]}},
        {"data": {"features": [{"properties": {"value": 42.0}}]}}
    ])
    monkeypatch.setattr("app.services.analytics_engine.scan_area", mock_scan_area)
    
    result = await get_historical_baseline(
        polygon=sample_polygon,
        reference_date="2023-08-10",
        reference_time="14:00",
        client=mock_client,
        lookback_days=5
    )
    
    assert result["baseline_available"] is True
    assert len(result["dates_sampled"]) == 5
    # (40+38+39+41+42) / 5 = 40.0
    assert result["value"] == 40.0

@pytest.mark.asyncio
async def test_get_historical_baseline_partial_fail(monkeypatch, mock_client, sample_polygon):
    # Mock some days failing and some succeeding
    mock_scan_area = AsyncMock(side_effect=[
        {"data": {"features": [{"properties": {"value": 30.0}}]}},
        Exception("API Error"),
        {"data": {"features": []}}, # empty features
        {"data": {"features": [{"properties": {"value": 32.0}}]}},
        {"data": {"features": [{"properties": {"value": 34.0}}]}}
    ])
    monkeypatch.setattr("app.services.analytics_engine.scan_area", mock_scan_area)
    
    result = await get_historical_baseline(
        polygon=sample_polygon,
        reference_date="2023-08-10",
        reference_time="14:00",
        client=mock_client,
        lookback_days=5
    )
    
    assert result["baseline_available"] is True
    assert len(result["dates_sampled"]) == 3
    # (30+32+34) / 3 = 32.0
    assert result["value"] == 32.0

@pytest.mark.asyncio
async def test_get_historical_baseline_unavailable(monkeypatch, mock_client, sample_polygon):
    # All days fail or return empty
    mock_scan_area = AsyncMock(side_effect=[Exception("API Error")] * 5)
    monkeypatch.setattr("app.services.analytics_engine.scan_area", mock_scan_area)
    
    result = await get_historical_baseline(
        polygon=sample_polygon,
        reference_date="2023-08-10",
        reference_time="14:00",
        client=mock_client,
        lookback_days=5
    )
    
    assert result["baseline_available"] is False
    assert result["value"] is None
    assert result["dates_sampled"] == []

def test_calculate_anomaly_success():
    baseline = {
        "baseline_available": True,
        "value": 35.0,
        "dates_sampled": ["2023-08-01"]
    }
    result = calculate_anomaly(40.5, baseline)
    assert result is not None
    assert result["anomaly_c"] == 5.5
    assert result["current"] == 40.5
    assert result["baseline"] == 35.0

def test_calculate_anomaly_unavailable():
    baseline = {
        "baseline_available": False,
        "value": None,
        "dates_sampled": []
    }
    result = calculate_anomaly(40.5, baseline)
    assert result is None

