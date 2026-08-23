"""
Unit tests for PriorityEngine sub-scores, Response Gap, and Zone Ranking (Steps 24 & 25)
"""

import pytest
from datetime import datetime, timezone
from app.models.zone import HeatMetrics
from app.services.priority_engine import (
    normalize,
    format_display_score,
    heat_exposure_score,
    vulnerability_score,
    resource_deficit_score,
    calculate_response_gap,
    classify_zone,
    rank_zones,
    DISCLAIMER_TEXT
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
        computed_at=datetime.now(timezone.utc),
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
        computed_at=datetime.now(timezone.utc),
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
        computed_at=datetime.now(timezone.utc),
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


def test_calculate_response_gap():
    """Verify Response Gap combination formula and synergy compounding."""
    # Scenario 1: Standard combination
    res_1 = calculate_response_gap(heat_score=80.0, vulnerability_score=60.0, resource_deficit_score=40.0)
    # Expected: 80*0.4 + 60*0.35 + 40*0.25 = 32 + 21 + 10 = 63.0
    assert res_1["response_gap_score"] == 63.0
    assert res_1["display_score"] == 6.3
    assert res_1["tier"] == "HIGH"
    assert "disclaimer" in res_1
    assert res_1["disclaimer"] == DISCLAIMER_TEXT
    
    # Scenario 2: Acute triple-pillar synergy compounding (all >= 70.0)
    # Base: 80*0.4 + 80*0.35 + 80*0.25 = 80.0. Compounded: 80.0 * 1.10 = 88.0
    res_synergy = calculate_response_gap(heat_score=80.0, vulnerability_score=80.0, resource_deficit_score=80.0)
    assert res_synergy["response_gap_score"] == 88.0
    assert res_synergy["display_score"] == 8.8
    assert res_synergy["tier"] == "CRITICAL"
    
    # Scenario 3: Low risk
    res_low = calculate_response_gap(heat_score=20.0, vulnerability_score=15.0, resource_deficit_score=10.0)
    assert res_low["response_gap_score"] < 25.0
    assert res_low["tier"] == "LOW"


def test_classify_zone():
    """Verify threshold classification into risk tiers."""
    assert classify_zone(90.0) == "CRITICAL"
    assert classify_zone(75.0) == "CRITICAL"
    assert classify_zone(74.9) == "HIGH"
    assert classify_zone(50.0) == "HIGH"
    assert classify_zone(49.9) == "MODERATE"
    assert classify_zone(25.0) == "MODERATE"
    assert classify_zone(24.9) == "LOW"
    assert classify_zone(0.0) == "LOW"


def test_rank_zones():
    """Verify multi-zone ranking order and deterministic tie-breaking."""
    zones = [
        {
            "zone_id": "zone-b",
            "name": "Zone B",
            "response_gap_score": 62.0,
            "heat_exposure_score": 60.0,
            "vulnerability_score": 60.0,
            "resource_deficit_score": 60.0
        },
        {
            "zone_id": "zone-a",
            "name": "Zone A",
            "response_gap_score": 85.0,
            "heat_exposure_score": 90.0,
            "vulnerability_score": 85.0,
            "resource_deficit_score": 80.0
        },
        {
            "zone_id": "zone-c-1",
            "name": "Zone C1",
            "response_gap_score": 40.0,
            "heat_exposure_score": 50.0,
            "vulnerability_score": 30.0,
            "resource_deficit_score": 40.0
        },
        {
            "zone_id": "zone-c-2",
            "name": "Zone C2",
            "response_gap_score": 40.0,
            "heat_exposure_score": 45.0,
            "vulnerability_score": 35.0,
            "resource_deficit_score": 40.0
        }
    ]
    
    ranked = rank_zones(zones)
    
    assert len(ranked) == 4
    # Highest response gap is Rank 1
    assert ranked[0]["zone_id"] == "zone-a"
    assert ranked[0]["rank"] == 1
    assert ranked[0]["tier"] == "CRITICAL"
    
    # Rank 2
    assert ranked[1]["zone_id"] == "zone-b"
    assert ranked[1]["rank"] == 2
    assert ranked[1]["tier"] == "HIGH"
    
    # Ties on response_gap (40.0): zone-c-1 has higher heat_exposure (50.0 vs 45.0) -> Rank 3
    assert ranked[2]["zone_id"] == "zone-c-1"
    assert ranked[2]["rank"] == 3
    assert ranked[2]["tier"] == "MODERATE"
    
    assert ranked[3]["zone_id"] == "zone-c-2"
    assert ranked[3]["rank"] == 4
    assert ranked[3]["tier"] == "MODERATE"
