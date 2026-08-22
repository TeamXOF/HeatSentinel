import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.scan_service import scan_area
from app.models.fortyguard import HeatmapRequest
from app.services.fortyguard_client import FortyGuardClient

# A tiny polygon for tests
TEST_POLYGON = {
    "type": "Polygon",
    "coordinates": [[
        [-112.08, 33.44],
        [-112.07, 33.44],
        [-112.07, 33.43],
        [-112.08, 33.43],
        [-112.08, 33.44]
    ]]
}

@pytest.fixture
def mock_client():
    client = MagicMock(spec=FortyGuardClient)
    client.run_heatmap = AsyncMock()
    return client

@pytest.fixture
def mock_db_connection():
    with patch("app.services.scan_service.get_db_connection") as mock_conn:
        conn = MagicMock()
        cursor = MagicMock()
        conn.cursor.return_value = cursor
        mock_conn.return_value.__enter__.return_value = conn
        # Force cache miss
        cursor.fetchone.return_value = None
        yield conn, cursor

@pytest.mark.asyncio
async def test_scan_area_success(mock_client, mock_db_connection):
    # Mock tile_polygon to return 2 tiles
    with patch("app.services.scan_service.tile_polygon") as mock_tile:
        mock_tile.return_value = [
            {"id": "tile_0", "geometry": TEST_POLYGON},
            {"id": "tile_1", "geometry": TEST_POLYGON}
        ]
        
        # Mock client to return 1 feature per call
        mock_client.run_heatmap.side_effect = [
            {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"value": 1}}]},
            {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"value": 2}}]}
        ]
        
        result = await scan_area(
            polygon=TEST_POLYGON,
            analytic_type="tcm",
            granularity=60,
            start_date="2026-08-20",
            start_time="14:00",
            client=mock_client
        )
        
        # Assertions
        assert mock_client.run_heatmap.call_count == 2
        assert result["summary"]["total_tiles"] == 2
        assert len(result["summary"]["failed_tiles"]) == 0
        assert result["summary"]["total_cells"] == 2
        assert result["data"]["features"][0]["properties"]["tile_id"] == "tile_0"
        assert result["data"]["features"][1]["properties"]["tile_id"] == "tile_1"

@pytest.mark.asyncio
async def test_scan_area_partial_failure(mock_client, mock_db_connection):
    with patch("app.services.scan_service.tile_polygon") as mock_tile:
        mock_tile.return_value = [
            {"id": "tile_0", "geometry": TEST_POLYGON},
            {"id": "tile_1", "geometry": TEST_POLYGON},
            {"id": "tile_2", "geometry": TEST_POLYGON}
        ]
        
        # Mock client: Success, Failure, Success
        mock_client.run_heatmap.side_effect = [
            {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"value": 1}}]},
            Exception("API Error 500"),
            {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"value": 3}}]}
        ]
        
        result = await scan_area(
            polygon=TEST_POLYGON,
            analytic_type="tcm",
            granularity=60,
            start_date="2026-08-20",
            start_time="14:00",
            client=mock_client
        )
        
        assert mock_client.run_heatmap.call_count == 3
        assert result["summary"]["total_tiles"] == 3
        assert len(result["summary"]["failed_tiles"]) == 1
        assert result["summary"]["failed_tiles"][0] == "tile_1"
        assert result["summary"]["total_cells"] == 2
