"""
HeatSentinel AI - NYC Response Gap Validation Tests (Step 31)
Validates the computed Response Gap metrics across the 8 NYC neighborhood AOIs
and ensures statistical consistency and schema correctness against NYC HVI.
"""

import json
from pathlib import Path
import pytest
from scripts.nyc_validation_scan import compute_nyc_aoi_validation_metrics

DATA_DIR = Path(__file__).resolve().parent.parent / "app" / "data"
RESULTS_PATH = DATA_DIR / "nyc_validation_results.json"
COOLING_PATH = DATA_DIR / "nyc_cooling_resources.geojson"


def test_nyc_validation_results_file_exists_and_valid():
    """Verify that nyc_validation_results.json exists and is structured properly."""
    assert RESULTS_PATH.exists(), f"Validation results file missing at {RESULTS_PATH}"
    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "metadata" in data
    assert "validation_results" in data
    assert len(data["validation_results"]) == 8, f"Expected 8 AOIs, got {len(data['validation_results'])}"


def test_nyc_validation_results_schema():
    """Verify all required evaluation attributes are present on every AOI record."""
    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    required_keys = [
        "aoi_id",
        "name",
        "borough",
        "published_hvi_score",
        "computed_response_gap",
        "raw_response_gap",
        "tier",
        "exposure_score",
        "vulnerability_score",
        "deficit_score",
    ]

    for item in data["validation_results"]:
        for key in required_keys:
            assert key in item, f"Missing key '{key}' in AOI {item.get('aoi_id')}"
        assert 0.0 <= item["computed_response_gap"] <= 10.0
        assert 0.0 <= item["raw_response_gap"] <= 100.0
        assert 1 <= item["published_hvi_score"] <= 5
        assert item["tier"] in ["CRITICAL", "HIGH", "MODERATE", "LOW"]


def test_nyc_validation_results_score_monotonicity():
    """
    Verify directional alignment:
    High HVI neighborhoods (HVI 5) must have a significantly higher computed Response Gap
    than Low HVI neighborhoods (HVI 1-2).
    """
    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    results = data["validation_results"]
    hvi_5_scores = [r["computed_response_gap"] for r in results if r["published_hvi_score"] == 5]
    hvi_4_scores = [r["computed_response_gap"] for r in results if r["published_hvi_score"] == 4]
    hvi_3_scores = [r["computed_response_gap"] for r in results if r["published_hvi_score"] == 3]
    hvi_low_scores = [r["computed_response_gap"] for r in results if r["published_hvi_score"] in [1, 2]]

    avg_hvi_5 = sum(hvi_5_scores) / len(hvi_5_scores)
    avg_hvi_4 = sum(hvi_4_scores) / len(hvi_4_scores)
    avg_hvi_3 = sum(hvi_3_scores) / len(hvi_3_scores)
    avg_hvi_low = sum(hvi_low_scores) / len(hvi_low_scores)

    assert avg_hvi_5 > avg_hvi_4, f"HVI 5 avg ({avg_hvi_5}) must exceed HVI 4 avg ({avg_hvi_4})"
    assert avg_hvi_4 > avg_hvi_3, f"HVI 4 avg ({avg_hvi_4}) must exceed HVI 3 avg ({avg_hvi_3})"
    assert avg_hvi_3 > avg_hvi_low, f"HVI 3 avg ({avg_hvi_3}) must exceed HVI Low avg ({avg_hvi_low})"


def test_nyc_cooling_resources_dataset():
    """Verify NYC cooling resources GeoJSON dataset structure."""
    assert COOLING_PATH.exists()
    with open(COOLING_PATH, "r", encoding="utf-8") as f:
        fc = json.load(f)
    assert fc.get("type") == "FeatureCollection"
    features = fc.get("features", [])
    assert len(features) >= 10, f"Expected at least 10 cooling resources, got {len(features)}"

    for feat in features:
        props = feat.get("properties", {})
        assert "name" in props
        assert "borough" in props
        assert "category" in props
        geom = feat.get("geometry", {})
        assert geom.get("type") == "Point"
        coords = geom.get("coordinates", [])
        assert len(coords) == 2
        # Check NYC bbox
        assert -74.3 <= coords[0] <= -73.6
        assert 40.45 <= coords[1] <= 40.95


def test_nyc_validation_pipeline_reproducibility():
    """Verify that compute_nyc_aoi_validation_metrics produces consistent, deterministic results."""
    data = compute_nyc_aoi_validation_metrics()
    assert len(data["validation_results"]) == 8
    # Check top zone is South Bronx (BX39)
    top_zone = data["validation_results"][0]
    assert top_zone["aoi_id"] == "BX39"
    assert top_zone["tier"] == "HIGH"
    assert top_zone["computed_response_gap"] >= 6.0
