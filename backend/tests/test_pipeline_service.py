"""
Integration tests for PipelineService (Step 27 / Vertical Slice Pipeline)
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone

from app.services.pipeline_service import (
    load_default_phoenix_target_area,
    _determine_primary_driver,
    run_basic_pipeline
)
from app.models.zone import HeatMetrics, BasicPipelineResult


def test_load_default_phoenix_target_area():
    """Verify loading default Phoenix target area polygon."""
    aoi = load_default_phoenix_target_area()
    assert "type" in aoi
    assert "coordinates" in aoi
    assert len(aoi["coordinates"][0]) >= 4


def test_determine_primary_driver():
    """Verify dominant driver label deduction."""
    assert _determine_primary_driver(90.0, 50.0, 40.0) == "Severe Thermal Intensity & Persistence"
    assert _determine_primary_driver(50.0, 85.0, 40.0) == "High Socioeconomic & Demographic Sensitivity"
    assert _determine_primary_driver(40.0, 50.0, 85.0) == "Critical Cooling Infrastructure Deficit"


@pytest.mark.asyncio
async def test_run_basic_pipeline_mocked():
    """Test basic pipeline end-to-end orchestration with mocked upstream scan."""
    features = []
    # 1. Hot cluster in downtown Phoenix
    for i in range(5):
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-112.075 + (i * 0.0001), 33.445],
                    [-112.074 + (i * 0.0001), 33.445],
                    [-112.074 + (i * 0.0001), 33.444],
                    [-112.075 + (i * 0.0001), 33.444],
                    [-112.075 + (i * 0.0001), 33.445]
                ]]
            },
            "properties": {"value": 45.0 + i, "tile_id": "tile_0_0"}
        })
        
    # 2. Cooler background cells
    for i in range(10):
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-112.090 + (i * 0.001), 33.430],
                    [-112.089 + (i * 0.001), 33.430],
                    [-112.089 + (i * 0.001), 33.429],
                    [-112.090 + (i * 0.001), 33.429],
                    [-112.090 + (i * 0.001), 33.430]
                ]]
            },
            "properties": {"value": 28.0 + (i * 0.2), "tile_id": "tile_0_1"}
        })
        
    mock_scan_res = {
        "summary": {"total_tiles": 2, "total_cells": len(features), "duration_ms": 150},
        "data": {
            "type": "FeatureCollection",
            "features": features
        }
    }
    
    mock_metrics = HeatMetrics(
        current_temp_c=46.0,
        persistence_hours=5.5,
        exceedance_hours=6.0,
        anomaly_c=3.2,
        baseline_available=True,
        data_sources=["FortyGuard API"],
        computed_at=datetime.now(timezone.utc),
        mode="live"
    )
    
    with patch("app.services.pipeline_service.scan_area", new_callable=AsyncMock) as mock_scan, \
         patch("app.services.pipeline_service.compute_zone_heat_metrics", new_callable=AsyncMock) as mock_metrics_func:
         
        mock_scan.return_value = mock_scan_res
        mock_metrics_func.return_value = mock_metrics
        
        result = await run_basic_pipeline(top_n_hotspots=3)
        
        assert isinstance(result, BasicPipelineResult)
        assert result.status == "ok"
        assert result.city == "Phoenix"
        assert result.total_zones >= 1
        
        zone = result.ranked_zones[0]
        assert zone.rank == 1
        assert zone.priority_level in ["CRITICAL", "HIGH", "MODERATE", "LOW"]
        assert zone.response_gap_score > 0.0
        assert zone.evidence is not None
        assert zone.evidence.population_estimate > 0
        assert len(zone.evidence.source_tracts) >= 1
        assert "US Census ACS 5-Year" in zone.evidence.data_sources
        assert "MAG Heat Relief Network" in zone.evidence.data_sources
        assert zone.disclaimer is not None
