"""
Integration tests for AnalysisRouter (Step 28 / POST /api/analysis/basic-scan)
"""

import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.models.zone import HeatZone, LatLng, ZoneEvidence, BasicPipelineResult
from app.routers.analysis import compute_basic_scan_cache_key
from app.services.priority_engine import DISCLAIMER_TEXT


def test_compute_basic_scan_cache_key():
    """Verify deterministic hash key generation."""
    poly = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}
    k1 = compute_basic_scan_cache_key(poly, "Phoenix", "2024-08-01", "14:00", 5)
    k2 = compute_basic_scan_cache_key(poly, "Phoenix", "2024-08-01", "14:00", 5)
    assert k1 == k2
    assert len(k1) == 64


def test_basic_scan_endpoint_integration():
    """Test POST /api/analysis/basic-scan with mocked pipeline."""
    sample_evidence = ZoneEvidence(
        primary_driver="Severe Thermal Intensity & Persistence",
        current_temp_c=46.2,
        current_temp_f=115.2,
        persistence_hours=6.0,
        exceedance_hours=5.5,
        population_estimate=5200,
        elderly_pct=0.25,
        socioeconomic_vulnerability=0.75,
        source_tracts=["04013114000"],
        cooling_resources_in_1mi=3,
        cooling_resources_in_zone=1,
        nearest_resource_distance_m=0.0,
        nearest_resource_name="Burton Barr Library",
        nearest_resource_type="Cooling Center",
        total_cooling_capacity=450,
        data_sources=["FortyGuard API", "US Census ACS 5-Year", "MAG Heat Relief Network"]
    )
    
    sample_zone = HeatZone(
        zone_id="zone-test-1",
        name="Zone 1 — Central Corridor",
        city="Phoenix",
        coordinates=[[-112.075, 33.445], [-112.070, 33.445], [-112.070, 33.440], [-112.075, 33.440], [-112.075, 33.445]],
        center=LatLng(lat=33.4425, lng=-112.0725),
        mean_temp_c=46.2,
        mean_temp_f=115.2,
        persistence_hours=6.0,
        exceedance_hours=5.5,
        heat_exposure_score=85.0,
        vulnerability_score=75.0,
        resource_deficit_score=20.0,
        response_gap_score=65.25,
        display_score=6.5,
        priority_level="HIGH",
        rank=1,
        evidence=sample_evidence,
        disclaimer=DISCLAIMER_TEXT
    )
    
    mock_pipeline_res = BasicPipelineResult(
        status="ok",
        city="Phoenix",
        timestamp=datetime.now(timezone.utc),
        scan_summary={"total_tiles": 4, "total_cells": 16000, "hotspots_detected": 1, "zones_ranked": 1, "duration_ms": 1200},
        ranked_zones=[sample_zone],
        total_zones=1,
        excluded_zones=[],
        disclaimer=DISCLAIMER_TEXT
    )
    
    with patch("app.routers.analysis.run_basic_pipeline", new_callable=AsyncMock) as mock_run:
        mock_run.return_value = mock_pipeline_res
        
        with TestClient(app) as client:
            # 1. First call - live execution & cache write
            res1 = client.post("/api/analysis/basic-scan?force_refresh=true", json={"top_n_hotspots": 3})
            assert res1.status_code == 200
            data1 = res1.json()
            assert data1["mode"] == "live"
            assert data1["city"] == "Phoenix"
            assert len(data1["ranked_zones"]) == 1
            assert data1["ranked_zones"][0]["name"] == "Zone 1 — Central Corridor"
            assert data1["ranked_zones"][0]["evidence"]["cooling_resources_in_1mi"] == 3
            
            # 2. Second call - SQLite cache hit
            res2 = client.post("/api/analysis/basic-scan", json={"top_n_hotspots": 3})
            assert res2.status_code == 200
            data2 = res2.json()
            assert data2["mode"] == "cached"
            assert len(data2["ranked_zones"]) == 1
