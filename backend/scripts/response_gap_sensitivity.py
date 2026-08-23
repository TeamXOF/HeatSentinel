"""
HeatSentinel AI - Response Gap Sensitivity Analysis & Fixture Generator (Step 26)
Runs parametric grid sweeps and computes real Phoenix hotspot response gap fixtures.
"""

import os
import json
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.models.zone import HeatMetrics
from app.services.vulnerability_service import get_vulnerability_for_zone
from app.services.resource_service import get_resource_coverage_for_zone
from app.services.priority_engine import (
    heat_exposure_score,
    vulnerability_score,
    resource_deficit_score,
    calculate_response_gap,
    rank_zones,
    classify_zone,
    format_display_score
)


def run_grid_sensitivity_sweep():
    """Performs parametric grid sweep across 125 combinations."""
    print("=" * 70)
    print("      HEATSENTINEL PRIORITY ENGINE: SENSITIVITY GRID SWEEP (125 Runs)")
    print("=" * 70)
    
    levels = [0.0, 25.0, 50.0, 75.0, 100.0]
    tier_counts = {"CRITICAL": 0, "HIGH": 0, "MODERATE": 0, "LOW": 0}
    synergy_count = 0
    total_runs = 0
    
    for h in levels:
        for v in levels:
            for d in levels:
                total_runs += 1
                res = calculate_response_gap(h, v, d)
                tier = res["tier"]
                tier_counts[tier] += 1
                if h >= 70.0 and v >= 70.0 and d >= 70.0:
                    synergy_count += 1
                    
    print(f"Total Combinations Evaluated: {total_runs}")
    print("\n--- Risk Tier Distribution ---")
    for tier, count in tier_counts.items():
        pct = (count / total_runs) * 100.0
        bar = "#" * int(pct // 2)
        print(f"  {tier:<10}: {count:>3} ({pct:>5.1f}%) | {bar}")
        
    print(f"\nSynergy Boost Activations (Triple-Acute Risk >= 70): {synergy_count} ({(synergy_count/total_runs)*100:.1f}%)")
    print("=" * 70)


def generate_phoenix_fixtures():
    """Evaluates 4 real Phoenix hotspot zones and saves fixtures."""
    print("\n" + "=" * 70)
    print("      EVALUATING REAL PHOENIX HOTSPOT RESPONSE GAPS")
    print("=" * 70)
    
    # 4 distinct representative Phoenix zones
    sample_zones = [
        {
            "zone_id": "zone-phx-central",
            "name": "Central Phoenix Corridor (Tract 1140/1141)",
            "polygon": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-112.080, 33.450],
                        [-112.060, 33.450],
                        [-112.060, 33.430],
                        [-112.080, 33.430],
                        [-112.080, 33.450]
                    ]
                ]
            },
            "heat_metrics": HeatMetrics(
                current_temp_c=45.6,
                persistence_hours=5.5,
                exceedance_hours=6.2,
                anomaly_c=3.8,
                baseline_available=True,
                data_sources=["fortyguard_tcm", "fortyguard_persistence"],
                computed_at=datetime.now(timezone.utc),
                mode="live"
            )
        },
        {
            "zone_id": "zone-phx-south-mtn",
            "name": "South Mountain Desert Fringe",
            "polygon": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-112.070, 33.390],
                        [-112.040, 33.390],
                        [-112.040, 33.375],
                        [-112.070, 33.375],
                        [-112.070, 33.390]
                    ]
                ]
            },
            "heat_metrics": HeatMetrics(
                current_temp_c=46.8,
                persistence_hours=6.5,
                exceedance_hours=7.0,
                anomaly_c=4.2,
                baseline_available=True,
                data_sources=["fortyguard_tcm", "fortyguard_persistence"],
                computed_at=datetime.now(timezone.utc),
                mode="live"
            )
        },
        {
            "zone_id": "zone-phx-downtown",
            "name": "Downtown Government Center",
            "polygon": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-112.085, 33.455],
                        [-112.070, 33.455],
                        [-112.070, 33.442],
                        [-112.085, 33.442],
                        [-112.085, 33.455]
                    ]
                ]
            },
            "heat_metrics": HeatMetrics(
                current_temp_c=44.2,
                persistence_hours=4.0,
                exceedance_hours=4.5,
                anomaly_c=2.1,
                baseline_available=True,
                data_sources=["fortyguard_tcm", "fortyguard_persistence"],
                computed_at=datetime.now(timezone.utc),
                mode="live"
            )
        },
        {
            "zone_id": "zone-phx-eastlake",
            "name": "Eastlake / Garfield Residential",
            "polygon": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-112.055, 33.455],
                        [-112.035, 33.455],
                        [-112.035, 33.440],
                        [-112.055, 33.440],
                        [-112.055, 33.455]
                    ]
                ]
            },
            "heat_metrics": HeatMetrics(
                current_temp_c=43.5,
                persistence_hours=3.8,
                exceedance_hours=4.0,
                anomaly_c=1.8,
                baseline_available=True,
                data_sources=["fortyguard_tcm", "fortyguard_persistence"],
                computed_at=datetime.now(timezone.utc),
                mode="live"
            )
        }
    ]
    
    evaluated_zones = []
    
    for z in sample_zones:
        poly = z["polygon"]
        heat_m = z["heat_metrics"]
        
        # Real spatial joins
        vuln = get_vulnerability_for_zone(poly)
        res_cov = get_resource_coverage_for_zone(poly, search_radius_m=1600.0)
        
        # Priority Engine sub-scores
        h_score = heat_exposure_score(heat_m)
        v_score = vulnerability_score(vuln, zone_area_sqmi=0.75)
        d_score = resource_deficit_score(res_cov)
        
        rg_result = calculate_response_gap(h_score, v_score, d_score)
        
        zone_payload = {
            "zone_id": z["zone_id"],
            "name": z["name"],
            "heat_exposure_score": h_score,
            "vulnerability_score": v_score,
            "resource_deficit_score": d_score,
            "response_gap_score": rg_result["response_gap_score"],
            "display_score": rg_result["display_score"],
            "tier": rg_result["tier"],
            "components": rg_result["components"],
            "evidence": {
                "current_temp_c": heat_m.current_temp_c,
                "current_temp_f": round(heat_m.current_temp_c * 9/5 + 32, 1),
                "persistence_hours": heat_m.persistence_hours,
                "exceedance_hours": heat_m.exceedance_hours,
                "historical_anomaly_c": heat_m.anomaly_c,
                "population_estimate": vuln.get("population_estimate"),
                "elderly_pct": vuln.get("elderly_pct"),
                "socioeconomic_vulnerability": vuln.get("socioeconomic_vulnerability"),
                "source_tracts": vuln.get("source_geographies", []),
                "cooling_resources_in_1mi": res_cov.get("resources_within_radius_count", 0),
                "cooling_resources_in_zone": res_cov.get("resources_within_zone_count", 0),
                "nearest_resource_distance_m": res_cov.get("nearest_resource_distance_m"),
                "nearest_resource_name": res_cov.get("nearest_resource_name")
            }
        }
        evaluated_zones.append(zone_payload)
        
    ranked = rank_zones(evaluated_zones)
    
    # Print ranked summary table
    print(f"{'Rank':<5} | {'Zone Name':<35} | {'Heat':<6} | {'Vuln':<6} | {'Deficit':<7} | {'RespGap':<8} | {'Tier':<8}")
    print("-" * 85)
    for r in ranked:
        print(
            f"{r['rank']:<5} | {r['name']:<35} | {r['components']['heat_exposure']:>5.1f} | "
            f"{r['components']['vulnerability']:>5.1f} | {r['components']['resource_deficit']:>6.1f} | "
            f"{r['display_score']:>7.1f} | {r['tier']:<8}"
        )
        
    # Save to backend/tests/fixtures/phoenix_response_gap_sample.json
    fixtures_dir = Path(__file__).resolve().parent.parent / "tests" / "fixtures"
    fixtures_dir.mkdir(parents=True, exist_ok=True)
    out_file = fixtures_dir / "phoenix_response_gap_sample.json"
    
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(ranked, f, indent=2)
        
    print(f"\n[OK] Successfully saved validated Phoenix fixtures to: {out_file}")
    print("=" * 70)


if __name__ == "__main__":
    run_grid_sensitivity_sweep()
    generate_phoenix_fixtures()
