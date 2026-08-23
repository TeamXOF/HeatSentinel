"""
HeatSentinel AI - Validation Benchmark Service Tests (Step 32)
Tests the statistical correlation engine, non-causal language compliance,
and output summaries for the NYC HVI validation benchmark.
"""

import json
from pathlib import Path
import pytest
from app.services.validation_service import compute_hvi_correlation_analysis

DATA_DIR = Path(__file__).resolve().parent.parent / "app" / "data"
SUMMARY_PATH = DATA_DIR / "nyc_validation_summary.json"


def test_compute_hvi_correlation_analysis_success():
    """Verify that correlation analysis executes and returns expected keys."""
    summary = compute_hvi_correlation_analysis()
    assert summary is not None
    assert "metadata" in summary
    assert "statistical_metrics" in summary
    assert "evaluation_cohort" in summary
    assert "narrative_interpretation" in summary
    assert "limitations_disclosure" in summary
    assert "demo_narration_script" in summary
    assert "disclaimer" in summary
    assert summary["metadata"]["sample_size_n"] == 8


def test_statistical_metric_ranges():
    """Verify statistical correlation coefficients and p-values."""
    summary = compute_hvi_correlation_analysis()
    metrics = summary["statistical_metrics"]

    rs = metrics["spearman_rank_correlation_rs"]
    r = metrics["pearson_correlation_r"]
    p_rs = metrics["spearman_p_value"]
    p_r = metrics["pearson_p_value"]
    rank_err = metrics["mean_rank_difference"]

    assert 0.85 <= rs <= 1.0, f"Expected high Spearman rank correlation, got {rs}"
    assert 0.85 <= r <= 1.0, f"Expected high Pearson linear correlation, got {r}"
    assert p_rs < 0.01, f"Expected statistically significant Spearman p-value, got {p_rs}"
    assert p_r < 0.01, f"Expected statistically significant Pearson p-value, got {p_r}"
    assert 0.0 <= rank_err <= 1.0, f"Expected low mean rank error (<= 1.0 position), got {rank_err}"
    assert metrics["correlation_strength"] == "Very Strong Positive Alignment"


def test_non_causal_language_compliance():
    """
    CRITICAL QUALITY GATE:
    Verify that output narratives strictly adhere to non-causal associative language
    and do not contain prohibited overreaching or clinical claims.
    """
    summary = compute_hvi_correlation_analysis()
    all_text = " ".join([
        summary["narrative_interpretation"],
        summary["limitations_disclosure"],
        summary["demo_narration_script"]
    ]).lower()

    prohibited_terms = [
        "causes",
        "caused by",
        "is a cause of",
        "clinically validated",
        "clinical validation",
        "proves",
        "proven",
    ]

    for term in prohibited_terms:
        assert term not in all_text, f"Prohibited term '{term}' found in validation text output!"

    # Ensure required associative phrases are present
    assert "aligns with" in all_text or "alignment" in all_text
    assert "spearman" in all_text


def test_sample_size_limitation_disclosure():
    """Verify sample size and limitation transparency."""
    summary = compute_hvi_correlation_analysis()
    limitations = summary["limitations_disclosure"]
    assert "n = 8" in limitations.lower() or "8" in limitations
    assert "limitation" in limitations.lower() or "sample size" in limitations.lower()


def test_summary_file_export():
    """Verify that nyc_validation_summary.json is written properly to disk."""
    assert SUMMARY_PATH.exists()
    with open(SUMMARY_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["metadata"]["sample_size_n"] == 8
    assert "statistical_metrics" in data
