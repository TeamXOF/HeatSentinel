"""
HeatSentinel AI - NYC Validation Benchmark & HVI Ingestion Tests (Step 30)
Validates the official NYC DOHMH Heat Vulnerability Index dataset and spatial services.
"""

import pytest
from app.services.nyc_vulnerability_service import (
    load_nyc_hvi_data,
    fetch_nyc_hvi_data,
    get_hvi_for_nta,
    get_hvi_for_polygon,
)


def test_load_nyc_hvi_dataset():
    """Verify that the official NYC HVI dataset loads successfully."""
    data = load_nyc_hvi_data()
    assert data is not None
    assert data.get("type") == "FeatureCollection"
    features = data.get("features", [])
    assert len(features) >= 10, f"Expected at least 10 NTA features, found {len(features)}"


def test_nyc_hvi_schema_and_properties():
    """Verify all required DOHMH HVI properties exist on all features."""
    data = load_nyc_hvi_data()
    features = data.get("features", [])

    required_keys = [
        "nta_code",
        "nta_name",
        "borough",
        "hvi_score",
        "surface_temp_rank",
        "ac_access_deficit_pct",
        "poverty_rate_pct",
        "green_space_pct",
    ]

    for feat in features:
        props = feat.get("properties", {})
        for key in required_keys:
            assert key in props, f"Missing property '{key}' in feature {props.get('nta_code')}"
            assert props[key] is not None, f"Property '{key}' is None in feature {props.get('nta_code')}"


def test_nyc_hvi_score_bounds():
    """Verify HVI scores and sub-factor ranks are within official DOHMH bounds (1-5)."""
    data = load_nyc_hvi_data()
    features = data.get("features", [])

    for feat in features:
        props = feat.get("properties", {})
        hvi = props["hvi_score"]
        temp_rank = props["surface_temp_rank"]
        ac_deficit = props["ac_access_deficit_pct"]
        poverty = props["poverty_rate_pct"]
        green = props["green_space_pct"]

        assert 1 <= hvi <= 5, f"HVI score {hvi} outside [1, 5] in {props['nta_code']}"
        assert 1 <= temp_rank <= 5, f"Surface temp rank {temp_rank} outside [1, 5] in {props['nta_code']}"
        assert 0.0 <= ac_deficit <= 100.0, f"AC deficit {ac_deficit}% outside [0, 100]"
        assert 0.0 <= poverty <= 100.0, f"Poverty rate {poverty}% outside [0, 100]"
        assert 0.0 <= green <= 100.0, f"Green space {green}% outside [0, 100]"


def test_nyc_hvi_borough_distribution():
    """Verify representation across NYC boroughs."""
    data = load_nyc_hvi_data()
    features = data.get("features", [])

    boroughs = {feat["properties"]["borough"] for feat in features}
    expected_boroughs = {"Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"}
    assert expected_boroughs.issubset(boroughs), f"Missing boroughs: {expected_boroughs - boroughs}"


def test_nyc_hvi_spatial_bounding_box():
    """Verify all coordinates are in WGS84 [lon, lat] and within NYC metropolitan bbox."""
    data = load_nyc_hvi_data()
    features = data.get("features", [])

    # NYC approx bounding box: lon [-74.3, -73.6], lat [40.45, 40.95]
    for feat in features:
        geom = feat.get("geometry", {})
        assert geom.get("type") in ["Polygon", "MultiPolygon"]
        coords = geom.get("coordinates", [])

        rings = coords if geom["type"] == "Polygon" else coords[0]
        for ring in rings:
            for pt in ring:
                lon, lat = pt[0], pt[1]
                assert -74.3 <= lon <= -73.6, f"Longitude {lon} out of NYC bounds in {feat['properties']['nta_code']}"
                assert 40.45 <= lat <= 40.95, f"Latitude {lat} out of NYC bounds in {feat['properties']['nta_code']}"


def test_get_hvi_for_nta_lookup():
    """Verify specific NTA property lookup."""
    mott_haven = get_hvi_for_nta("BX39")
    assert mott_haven is not None
    assert mott_haven["nta_name"] == "Mott Haven-Port Morris"
    assert mott_haven["hvi_score"] == 5

    upper_east = get_hvi_for_nta("MN40")
    assert upper_east is not None
    assert upper_east["nta_name"] == "Upper East Side-Carnegie Hill"
    assert upper_east["hvi_score"] == 1

    unknown = get_hvi_for_nta("NON_EXISTENT")
    assert unknown is None


def test_get_hvi_for_polygon_spatial_join():
    """Verify area-weighted spatial join for an arbitrary NYC polygon."""
    # Test polygon overlapping Mott Haven (BX39) in the South Bronx
    test_poly = {
        "type": "Polygon",
        "coordinates": [
          [
            [-73.9300, 40.8030],
            [-73.9150, 40.8040],
            [-73.9100, 40.8120],
            [-73.9250, 40.8150],
            [-73.9300, 40.8030]
          ]
        ]
    }

    result = get_hvi_for_polygon(test_poly)
    assert result is not None
    assert "weighted_hvi_score" in result
    assert result["weighted_hvi_score"] >= 4.0, f"Expected high HVI in South Bronx, got {result['weighted_hvi_score']}"
    assert len(result["contributing_ntas"]) >= 1
    assert result["coverage_fraction"] > 0.0


def test_fetch_nyc_hvi_data_graceful_fallback():
    """Verify that fetch_nyc_hvi_data successfully returns valid data even if live fetch fails."""
    data = fetch_nyc_hvi_data(force_refresh=False)
    assert data is not None
    assert len(data.get("features", [])) > 0
