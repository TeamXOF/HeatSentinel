import pytest
import json
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
from app.main import app
from app.db import get_db_connection, init_db

# Mock GeoJSON response
MOCK_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [-112.07, 33.45]},
            "properties": {"temp": 110}
        }
    ]
}

@pytest.fixture(autouse=True)
def setup_test_db():
    # Initialize DB (creates fortyguard_cache table)
    init_db()
    # Clear cache before each test
    with get_db_connection() as conn:
        conn.cursor().execute("DELETE FROM fortyguard_cache")


@pytest.mark.asyncio
@patch("app.routers.fortyguard.FortyGuardClient.run_heatmap", new_callable=AsyncMock)
async def test_test_scan_caching_behavior(mock_run_heatmap):
    # Setup mock to return the fake GeoJSON
    mock_run_heatmap.return_value = MOCK_GEOJSON
    
    # Inject http_client into app.state manually for the test
    import httpx
    app.state.http_client = httpx.AsyncClient()
    
    # 1. First call - Should be a Cache Miss (mode: live)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp1 = await client.post("/api/fortyguard/test-scan", json={"analytic_type": "tcm"})
        assert resp1.status_code == 200
        
        data1 = resp1.json()
        assert data1["mode"] == "live"
        assert data1["cell_count"] == 1
        assert mock_run_heatmap.call_count == 1
        
        req_hash = data1["request_hash"]
        
        # 2. Second call with exact same parameters - Should be Cache Hit (mode: cached)
        resp2 = await client.post("/api/fortyguard/test-scan", json={"analytic_type": "tcm"})
        assert resp2.status_code == 200
        
        data2 = resp2.json()
        assert data2["mode"] == "cached"
        assert data2["request_hash"] == req_hash
        assert data2["cell_count"] == 1
        assert mock_run_heatmap.call_count == 1  # Still 1, didn't call API again!
        
        # 3. Third call with force_refresh=true - Should be Cache Miss (mode: live)
        resp3 = await client.post("/api/fortyguard/test-scan?force_refresh=true", json={"analytic_type": "tcm"})
        assert resp3.status_code == 200
        
        data3 = resp3.json()
        assert data3["mode"] == "live"
        assert data3["request_hash"] == req_hash
        assert mock_run_heatmap.call_count == 2  # Called API again
