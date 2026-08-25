import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.routers.analysis import _resolve_scan_date, compute_basic_scan_cache_key


def test_resolve_scan_date_rules():
    """Verify temporal date resolution heuristics."""
    # 1. Explicit date provided
    assert _resolve_scan_date(requested_date="2026-08-25") == "2026-08-25"

    # 2. Today / Forecast relative scope
    live_date = _resolve_scan_date(time_range="Today")
    assert len(live_date) == 10
    assert live_date.count("-") == 2

    # 3. Default dataset fallback
    assert _resolve_scan_date(requested_date=None, time_range="Historic 7D") == "2024-08-01"


def test_compute_cache_key_city_differentiation():
    """Ensure different cities produce distinct cache keys for same bounding box/date."""
    poly = {"type": "Polygon", "coordinates": [[[-112.0, 33.0], [-112.0, 33.5], [-112.5, 33.5], [-112.0, 33.0]]]}
    
    key_phx = compute_basic_scan_cache_key(poly, "Phoenix", "2024-08-01", "14:00", 5)
    key_vegas = compute_basic_scan_cache_key(poly, "Las Vegas", "2024-08-01", "14:00", 5)
    key_miami = compute_basic_scan_cache_key(poly, "Miami", "2024-08-01", "14:00", 5)

    assert key_phx != key_vegas
    assert key_vegas != key_miami


from unittest.mock import patch, AsyncMock
from datetime import datetime, timezone
from app.models.zone import BasicPipelineResult


@pytest.mark.asyncio
async def test_basic_scan_endpoint_multi_city_and_refresh():
    """Test POST /api/analysis/basic-scan accepts city and force_refresh flags."""
    mock_result = BasicPipelineResult(
        status="ok",
        city="Las Vegas",
        timestamp=datetime.now(timezone.utc),
        scan_summary={"total_tiles": 2, "total_cells": 5000, "duration_ms": 200},
        ranked_zones=[],
        total_zones=0,
        disclaimer="Prototype disclaimer"
    )
    
    with patch("app.routers.analysis.run_basic_pipeline", new_callable=AsyncMock) as mock_pipe:
        mock_pipe.return_value = mock_result
        
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/api/analysis/basic-scan",
                json={"city": "Las Vegas", "time_range": "Today", "top_n_hotspots": 2},
                params={"force_refresh": "true"}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "ok"
            assert data["city"] == "Las Vegas"