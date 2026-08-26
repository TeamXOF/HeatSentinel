import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from app.services.scan_service import scan_area

@pytest.mark.asyncio
async def test_scan_area_deduplication():
    # Two identical features, but one has a slightly different temperature (simulating timestamp drift)
    feature1 = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-112.123456, 33.123456], [-112.123456, 33.123457], [-112.123455, 33.123457], [-112.123456, 33.123456]]]
        },
        "properties": {
            "temperature": 45.0,
            "tile_id": "tile_0"
        }
    }
    feature2 = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-112.1234561, 33.1234562], [-112.123456, 33.123457], [-112.123455, 33.123457], [-112.123456, 33.123456]]]
        },
        "properties": {
            "temperature": 45.1,
            "tile_id": "tile_1"
        }
    }
    
    # A third distinct feature to ensure we don't deduplicate everything
    feature3 = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-112.999999, 33.999999], [-112.999999, 33.999998], [-112.999998, 33.999998], [-112.999999, 33.999999]]]
        },
        "properties": {
            "temperature": 42.0,
            "tile_id": "tile_1"
        }
    }

    mock_results = [
        {"features": [feature1], "tile_id": "tile_0"},
        {"features": [feature2, feature3], "tile_id": "tile_1"}
    ]
    
    client = MagicMock()
    
    with patch("app.services.scan_service.tile_polygon") as mock_tile_polygon, \
         patch("app.services.scan_service.asyncio.gather", new_callable=AsyncMock) as mock_gather:
        
        mock_tile_polygon.return_value = [{"id": "tile_0", "geometry": {}}, {"id": "tile_1", "geometry": {}}]
        mock_gather.return_value = mock_results
        
        result = await scan_area(
            polygon={},
            analytic_type="tcm",
            granularity=60,
            start_date="2026-08-22",
            start_time="12:00",
            client=client
        )
        
        # We expect exactly 2 features. feature1 and feature2 deduplicated into 1, plus feature3.
        assert result["summary"]["total_cells"] == 2
        assert len(result["data"]["features"]) == 2
        
        # Because we keep the first-seen, it should keep feature1's temperature of 45.0
        assert result["data"]["features"][0]["properties"]["temperature"] == 45.0
