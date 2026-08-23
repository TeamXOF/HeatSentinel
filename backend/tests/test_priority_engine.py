"""
Unit tests for PriorityEngine sub-scores, Response Gap, and Zone Ranking (Steps 24, 25, & 26)
"""

import pytest
import math
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


def test_calculate_response_gap_standard():
    """Verify Response Gap combination formula and output payload."""
    res = calculate_response_gap(heat_score=80.0, vulnerability_score=60.0, resource_deficit_score=40.0)
    # Expected: 80*0.4 + 60*0.35 + 40*0.25 = 32 + 21 + 10 = 63.0
    assert res["response_gap_score"] == 63.0
    assert res["display_score"] == 6.3
    assert res["tier"] == "HIGH"
    assert "disclaimer" in res
    assert res["disclaimer"] == DISCLAIMER_TEXT


def test_calculate_response_gap_edge_cases():
    """Step 26: Test extreme edge cases (all zeros, all max, single-pillar dominance)."""
    # All zeros
    res_zero = calculate_response_gap(0.0, 0.0, 0.0)
    assert res_zero["response_gap_score"] == 0.0
    assert res_zero["display_score"] == 0.0
    assert res_zero["tier"] == "LOW"
    
    # All maximum (100, 100, 100) -> synergy boosts to 110, clamped to 100.0
    res_max = calculate_response_gap(100.0, 100.0, 100.0)
    assert res_max["response_gap_score"] == 100.0
    assert res_max["display_score"] == 10.0
    assert res_max["tier"] == "CRITICAL"
    
    # Single pillar dominance
    res_heat_only = calculate_response_gap(100.0, 0.0, 0.0)
    assert res_heat_only["response_gap_score"] == 40.0  # 40% weight
    assert res_heat_only["tier"] == "MODERATE"
    
    res_vuln_only = calculate_response_gap(0.0, 100.0, 0.0)
    assert res_vuln_only["response_gap_score"] == 35.0  # 35% weight
    assert res_vuln_only["tier"] == "MODERATE"
    
    res_res_only = calculate_response_gap(0.0, 0.0, 100.0)
    assert res_res_only["response_gap_score"] == 25.0  # 25% weight
    assert res_res_only["tier"] == "MODERATE"


def test_calculate_response_gap_invalid_inputs():
    """Step 26: Verify strict input validation throws appropriate errors."""
    # None input
    with pytest.raises(ValueError, match="cannot be None"):
        calculate_response_gap(None, 50.0, 50.0) # type: ignore
        
    with pytest.raises(ValueError, match="cannot be None"):
        calculate_response_gap(50.0, None, 50.0) # type: ignore
        
    # NaN input
    with pytest.raises(ValueError, match="cannot be NaN"):
        calculate_response_gap(math.nan, 50.0, 50.0)
        
    # String input
    with pytest.raises(TypeError, match="must be a float or int"):
        calculate_response_gap("80", 50.0, 50.0) # type: ignore
        
    # Boolean input (bool is subclass of int in Python, but should be rejected)
    with pytest.raises(TypeError, match="must be a float or int"):
        calculate_response_gap(True, 50.0, 50.0) # type: ignore
        
    # Negative input
    with pytest.raises(ValueError, match="cannot be negative"):
        calculate_response_gap(-10.0, 50.0, 50.0)


def test_response_gap_synergy_boundary():
    """Step 26: Verify synergy compounding activation boundary."""
    # Just below threshold (69.9, 70.0, 70.0) -> No synergy
    # Base: 69.9*0.4 + 70*0.35 + 70*0.25 = 27.96 + 24.5 + 17.5 = 69.96
    res_below = calculate_response_gap(69.9, 70.0, 70.0)
    assert res_below["response_gap_score"] == 69.96
    
    # Exactly at threshold (70.0, 70.0, 70.0) -> Synergy active (+10%)
    # Base: 70.0. With synergy: 70.0 * 1.10 = 77.0
    res_at = calculate_response_gap(70.0, 70.0, 70.0)
    assert res_at["response_gap_score"] == 77.0
    assert res_at["tier"] == "CRITICAL"


def test_response_gap_monotonicity():
    """Step 26: Verify monotonic behavior across test points."""
    # Increasing heat increases score
    assert calculate_response_gap(80.0, 50.0, 50.0)["response_gap_score"] > calculate_response_gap(60.0, 50.0, 50.0)["response_gap_score"]
    # Increasing vulnerability increases score
    assert calculate_response_gap(50.0, 80.0, 50.0)["response_gap_score"] > calculate_response_gap(50.0, 60.0, 50.0)["response_gap_score"]
    # Increasing deficit increases score
    assert calculate_response_gap(50.0, 50.0, 80.0)["response_gap_score"] > calculate_response_gap(50.0, 50.0, 60.0)["response_gap_score"]


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
