"""
Unit and integration tests for ResourceService (Steps 21 & 23)
"""

import pytest
from app.services.resource_service import load_cooling_resources, get_resource_coverage_for_zone


def test_load_cooling_resources():
    """Verify cooling resource GeoJSON dataset loads with expected properties."""
    data = load_cooling_resources()
    assert data.get("type") == "FeatureCollection"
    features = data.get("features", [])
    assert len(features) >= 5
    
    # Check sample feature properties
    sample = features[0]["properties"]
    assert "name" in sample
    assert "type" in sample
    assert sample["type"] in ["cooling_center", "hydration_station", "respite_center"]
    assert "address" in sample


def test_get_resource_coverage_downtown_corridor():
    """Test resource coverage in dense downtown corridor containing known cooling centers."""
    # Downtown polygon encompassing Burton Barr and City Hall
    downtown_poly = {
        "type": "Polygon",
        "coordinates": [
            [
                [-112.085, 33.465],
                [-112.065, 33.465],
                [-112.065, 33.440],
                [-112.085, 33.440],
                [-112.085, 33.465]
            ]
        ]
    }
    
    coverage = get_resource_coverage_for_zone(downtown_poly, search_radius_m=1600.0)
    assert coverage["resources_within_zone_count"] >= 1
    assert coverage["resources_within_radius_count"] >= 2
    assert coverage["nearest_resource_distance_m"] == 0.0  # Point inside zone
    assert coverage["total_capacity_within_radius"] > 0
    assert coverage["resource_type_breakdown"]["cooling_center"] >= 1


def test_get_resource_coverage_desert_zone():
    """Test resource coverage for a remote/isolated zone with no cooling centers nearby."""
    # Far north-west desert coordinates
    remote_poly = {
        "type": "Polygon",
        "coordinates": [
            [
                [-112.400, 33.700],
                [-112.380, 33.700],
                [-112.380, 33.680],
                [-112.400, 33.680],
                [-112.400, 33.700]
            ]
        ]
    }
    
    coverage = get_resource_coverage_for_zone(remote_poly, search_radius_m=1600.0)
    assert coverage["resources_within_zone_count"] == 0
    assert coverage["resources_within_radius_count"] == 0
    assert coverage["nearest_resource_distance_m"] > 10000.0  # Over 10km away
    assert coverage["total_capacity_within_radius"] == 0
