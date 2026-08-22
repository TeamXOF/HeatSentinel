import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.analytics_engine import compute_zone_heat_metrics
from app.services.fortyguard_client import FortyGuardClient
from app.db import init_db

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

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
async def test_compute_zone_heat_metrics_success(monkeypatch, mock_client, sample_polygon):
    # Mock tcm
    mock_scan_area = AsyncMock(return_value={
        "data": {"features": [{"properties": {"value": 40.0}}]}
    })
    monkeypatch.setattr("app.services.analytics_engine.scan_area", mock_scan_area)
    
    # Mock historical baseline
    mock_get_historical_baseline = AsyncMock(return_value={
        "baseline_available": True,
        "value": 35.0,
        "dates_sampled": ["2023-08-01"]
    })
    monkeypatch.setattr("app.services.analytics_engine.get_historical_baseline", mock_get_historical_baseline)
    
    # Mock persistence
    mock_get_persistence = AsyncMock(return_value={
        "data": {"features": [{"properties": {"value": 5.0}}]}
    })
    monkeypatch.setattr("app.services.analytics_engine.get_persistence", mock_get_persistence)
    
    # Mock exceedance
    mock_get_exceedance = AsyncMock(return_value={
        "data": {"features": [{"properties": {"value": 15.0}}]}
    })
    monkeypatch.setattr("app.services.analytics_engine.get_exceedance", mock_get_exceedance)
    
    result = await compute_zone_heat_metrics(
        zone_polygon=sample_polygon,
        start_date="2023-08-10",
        start_time="14:00",
        client=mock_client,
        force_refresh=True
    )
    
    assert result.current_temp_c == 40.0
    assert result.anomaly_c == 5.0
    assert result.persistence_hours == 5.0
    assert result.exceedance_hours == 15.0
    assert result.baseline_available is True
    assert result.mode == "live"
    
    # Verify dynamic threshold calculation: 35.0 + 2.0 = 37.0
    mock_get_persistence.assert_called_once()
    assert mock_get_persistence.call_args.kwargs["threshold"] == 37.0

@pytest.mark.asyncio
async def test_compute_zone_heat_metrics_no_baseline(monkeypatch, mock_client, sample_polygon):
    # Mock tcm
    mock_scan_area = AsyncMock(return_value={
        "data": {"features": [{"properties": {"value": 40.0}}]}
    })
    monkeypatch.setattr("app.services.analytics_engine.scan_area", mock_scan_area)
    
    # Mock historical baseline (unavailable)
    mock_get_historical_baseline = AsyncMock(return_value={
        "baseline_available": False,
        "value": None,
        "dates_sampled": []
    })
    monkeypatch.setattr("app.services.analytics_engine.get_historical_baseline", mock_get_historical_baseline)
    
    # Mock persistence
    mock_get_persistence = AsyncMock(return_value={
        "data": {"features": [{"properties": {"value": 2.0}}]}
    })
    monkeypatch.setattr("app.services.analytics_engine.get_persistence", mock_get_persistence)
    
    # Mock exceedance
    mock_get_exceedance = AsyncMock(return_value={
        "data": {"features": [{"properties": {"value": 10.0}}]}
    })
    monkeypatch.setattr("app.services.analytics_engine.get_exceedance", mock_get_exceedance)
    
    result = await compute_zone_heat_metrics(
        zone_polygon=sample_polygon,
        start_date="2023-08-10",
        start_time="14:00",
        client=mock_client,
        force_refresh=True
    )
    
    assert result.current_temp_c == 40.0
    assert result.anomaly_c is None
    assert result.baseline_available is False
    
    # Verify fallback threshold calculation: 35.0
    mock_get_persistence.assert_called_once()
    assert mock_get_persistence.call_args.kwargs["threshold"] == 35.0

@pytest.mark.asyncio
async def test_compute_zone_heat_metrics_caching(monkeypatch, mock_client, sample_polygon):
    # First call - force live
    mock_scan_area = AsyncMock(return_value={
        "data": {"features": [{"properties": {"value": 40.0}}]}
    })
    monkeypatch.setattr("app.services.analytics_engine.scan_area", mock_scan_area)
    
    mock_get_historical_baseline = AsyncMock(return_value={
        "baseline_available": True,
        "value": 35.0,
        "dates_sampled": ["2023-08-01"]
    })
    monkeypatch.setattr("app.services.analytics_engine.get_historical_baseline", mock_get_historical_baseline)
    
    mock_get_persistence = AsyncMock(return_value={
        "data": {"features": [{"properties": {"value": 5.0}}]}
    })
    monkeypatch.setattr("app.services.analytics_engine.get_persistence", mock_get_persistence)
    
    mock_get_exceedance = AsyncMock(return_value={
        "data": {"features": [{"properties": {"value": 15.0}}]}
    })
    monkeypatch.setattr("app.services.analytics_engine.get_exceedance", mock_get_exceedance)
    
    result1 = await compute_zone_heat_metrics(
        zone_polygon=sample_polygon,
        start_date="2023-08-10",
        start_time="15:00",
        client=mock_client,
        force_refresh=True
    )
    
    assert result1.mode == "live"
    
    # Second call - use cache (don't force refresh)
    result2 = await compute_zone_heat_metrics(
        zone_polygon=sample_polygon,
        start_date="2023-08-10",
        start_time="15:00",
        client=mock_client,
        force_refresh=False
    )
    
    assert result2.mode == "cached"
    assert result2.current_temp_c == 40.0
    assert result2.anomaly_c == 5.0
