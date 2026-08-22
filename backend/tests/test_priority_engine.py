"""
Unit tests for PriorityEngine sub-scores (Step 24)
"""

import pytest
from datetime import datetime
from app.models.zone import HeatMetrics
from app.services.priority_engine import (
    normalize,
    format_display_score,
    heat_exposure_score,
    vulnerability_score,
    resource_deficit_score
)


def test_normalize():
    """Verify normalization bounds and clamping."""
    assert normalize(20.0, 30.0, 50.0) == 0.0
    assert normalize(60.0, 30.0, 50.0) == 100.0
    assert normalize(40.0, 30.0, 50.0) == 50.0
    assert normalize(10.0, 10.0, 10.0) == 0.0


def test_format_display_score():
    """Verify 0-100 to 0.0-10.0 display formatting."""
    assert format_display_score(87.2) == 8.7
    assert format_display_score(100.0) == 10.0
    assert format_display_score(0.0) == 0.0
    assert format_display_score(94.5) == 9.5


def test_heat_exposure_score():
    """Verify heat exposure score calculation and missing anomaly handling."""
    # High thermal stress scenario
    high_heat = HeatMetrics(
        current_temp_c=46.0,
        persistence_hours=6.0,
        exceedance_hours=5.0,
        anomaly_c=3.5,
        baseline_available=True,
        data_sources=["fortyguard_tcm", "fortyguard_persistence"],
        computed_at=datetime.utcnow(),
        mode="live"
    )
    score_high = heat_exposure_score(high_heat)
    assert 65.0 <= score_high <= 95.0
    
    # Low thermal stress scenario
    low_heat = HeatMetrics(
        current_temp_c=32.0,
        persistence_hours=0.0,
        exceedance_hours=0.0,
        anomaly_c=None,
        baseline_available=False,
        data_sources=["fortyguard_tcm"],
        computed_at=datetime.utcnow(),
        mode="live"
    )
    score_low = heat_exposure_score(low_heat)
    assert 0.0 <= score_low <= 15.0
    
    # Test missing anomaly weight redistribution
    heat_no_anomaly = HeatMetrics(
        current_temp_c=46.0,
        persistence_hours=6.0,
        exceedance_hours=5.0,
        anomaly_c=None,
        baseline_available=False,
        data_sources=["fortyguard_tcm"],
        computed_at=datetime.utcnow(),
        mode="live"
    )
    score_no_anomaly = heat_exposure_score(heat_no_anomaly)
    assert 70.0 <= score_no_anomaly <= 95.0


def test_vulnerability_score():
    """Verify demographic vulnerability score behavior."""
    high_vuln = {
        "population_estimate": 4500,
        "elderly_pct": 0.28,
        "socioeconomic_vulnerability": 0.85
    }
    score_high = vulnerability_score(high_vuln, zone_area_sqmi=0.8)
    assert 70.0 <= score_high <= 95.0
    
    low_vuln = {
        "population_estimate": 800,
        "elderly_pct": 0.06,
        "socioeconomic_vulnerability": 0.15
    }
    score_low = vulnerability_score(low_vuln, zone_area_sqmi=1.5)
    assert 0.0 <= score_low <= 30.0
    
    # Monotonicity test: higher poverty -> higher score
    mid_vuln_1 = {"population_estimate": 2000, "elderly_pct": 0.15, "socioeconomic_vulnerability": 0.3}
    mid_vuln_2 = {"population_estimate": 2000, "elderly_pct": 0.15, "socioeconomic_vulnerability": 0.7}
    assert vulnerability_score(mid_vuln_2) > vulnerability_score(mid_vuln_1)


def test_resource_deficit_score():
    """Verify resource deficit score behavior."""
    # Desert zone: no resources nearby
    desert_data = {
        "resources_within_zone_count": 0,
        "resources_within_radius_count": 0,
        "nearest_resource_distance_m": 3500.0
    }
    score_desert = resource_deficit_score(desert_data)
    assert score_desert == 100.0  # Max deficit
    
    # Resource-rich zone with facility inside
    rich_data = {
        "resources_within_zone_count": 2,
        "resources_within_radius_count": 5,
        "nearest_resource_distance_m": 0.0
    }
    score_rich = resource_deficit_score(rich_data)
    assert score_rich <= 10.0  # Minimal deficit
    
    # Monotonicity test: adding resources reduces deficit
    res_few = {"resources_within_zone_count": 0, "resources_within_radius_count": 1, "nearest_resource_distance_m": 1200.0}
    res_many = {"resources_within_zone_count": 1, "resources_within_radius_count": 3, "nearest_resource_distance_m": 200.0}
    assert resource_deficit_score(res_few) > resource_deficit_score(res_many)
