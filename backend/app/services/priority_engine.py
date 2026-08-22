"""
HeatSentinel AI - Priority Engine (Phase 6 / Step 24)
Provides transparent, deterministic sub-scores for Response Gap calculation:
1. Heat Exposure Score (0–100)
2. Population Vulnerability Score (0–100)
3. Resource Deficit Score (0–100)

All weights, thresholds, and normalization ranges are named constants.
"""

from typing import Dict, Any, Optional
from app.models.zone import HeatMetrics
from app.logging_config import logger

# ==========================================
# 1. NORMALIZATION THRESHOLDS & BOUNDS
# ==========================================

# Heat Exposure Thresholds
HEAT_TEMP_MIN_C = 30.0    # 86°F (baseline warm day)
HEAT_TEMP_MAX_C = 50.0    # 122°F (extreme heat wave peak)
HEAT_PERSISTENCE_MAX_HRS = 8.0  # Max persistence hours above threshold
HEAT_EXCEEDANCE_MAX_HRS = 8.0   # Max urban heat exceedance hours
HEAT_ANOMALY_MAX_C = 6.0        # Max anomaly vs historical baseline (+6°C ~ +10.8°F)

# Heat Exposure Base Weights (Sum = 1.0)
WEIGHT_HEAT_TEMP = 0.30
WEIGHT_HEAT_PERSISTENCE = 0.30
WEIGHT_HEAT_EXCEEDANCE = 0.25
WEIGHT_HEAT_ANOMALY = 0.15

# Population Vulnerability Thresholds
VULN_ELDERLY_MIN_PCT = 0.05    # 5% elderly (typical baseline)
VULN_ELDERLY_MAX_PCT = 0.35    # 35% elderly (high senior concentration)
VULN_SVI_MIN = 0.0             # Minimum socioeconomic vulnerability
VULN_SVI_MAX = 1.0             # Maximum socioeconomic vulnerability
VULN_DENSITY_MIN = 500.0       # 500 people / sq mi (low density / suburban)
VULN_DENSITY_MAX = 10000.0     # 10,000 people / sq mi (dense urban core)

# Population Vulnerability Base Weights (Sum = 1.0)
WEIGHT_VULN_ELDERLY = 0.40
WEIGHT_VULN_SVI = 0.40
WEIGHT_VULN_DENSITY = 0.20

# Resource Deficit Thresholds
RES_SAFE_WALKING_DISTANCE_M = 1600.0  # 1.0 mile (~1600m) safe walking limit
WEIGHT_RES_DISTANCE = 0.50
WEIGHT_RES_SCARCITY = 0.50


# ==========================================
# 2. NORMALIZATION HELPER
# ==========================================

def normalize(value: float, min_val: float, max_val: float) -> float:
    """
    Normalizes a numerical value to a deterministic 0.0 to 100.0 scale,
    clamped at both boundaries.
    """
    if min_val >= max_val:
        return 0.0
    if value <= min_val:
        return 0.0
    if value >= max_val:
        return 100.0
    return round(((value - min_val) / (max_val - min_val)) * 100.0, 2)


def format_display_score(score_0_to_100: float) -> float:
    """
    Converts an internal 0–100 score to the 0.0–10.0 scale used by the UI and API.
    """
    clamped = max(0.0, min(100.0, score_0_to_100))
    return round((clamped / 10.0) + 1e-9, 1)


# ==========================================
# 3. COMPONENT SUB-SCORE FUNCTIONS
# ==========================================

def heat_exposure_score(heat_metrics: HeatMetrics) -> float:
    """
    Calculates the normalized Heat Exposure Score (0–100) for a zone.
    Combines peak temperature, persistence, exceedance, and historical anomaly.
    If historical baseline anomaly is unavailable, dynamically redistributes
    its weight proportionally across the other 3 factors.
    """
    temp_score = normalize(heat_metrics.current_temp_c, HEAT_TEMP_MIN_C, HEAT_TEMP_MAX_C)
    persistence_score = normalize(heat_metrics.persistence_hours, 0.0, HEAT_PERSISTENCE_MAX_HRS)
    exceedance_score = normalize(heat_metrics.exceedance_hours, 0.0, HEAT_EXCEEDANCE_MAX_HRS)
    
    if heat_metrics.anomaly_c is not None:
        anomaly_score = normalize(heat_metrics.anomaly_c, 0.0, HEAT_ANOMALY_MAX_C)
        final_score = (
            temp_score * WEIGHT_HEAT_TEMP +
            persistence_score * WEIGHT_HEAT_PERSISTENCE +
            exceedance_score * WEIGHT_HEAT_EXCEEDANCE +
            anomaly_score * WEIGHT_HEAT_ANOMALY
        )
    else:
        # Redistribute anomaly weight proportionally among the other 3 components
        active_weight_sum = WEIGHT_HEAT_TEMP + WEIGHT_HEAT_PERSISTENCE + WEIGHT_HEAT_EXCEEDANCE
        w_temp = WEIGHT_HEAT_TEMP / active_weight_sum
        w_pers = WEIGHT_HEAT_PERSISTENCE / active_weight_sum
        w_exc = WEIGHT_HEAT_EXCEEDANCE / active_weight_sum
        
        final_score = (
            temp_score * w_temp +
            persistence_score * w_pers +
            exceedance_score * w_exc
        )
        
    return round(max(0.0, min(100.0, final_score)), 2)


def vulnerability_score(vuln_data: Dict[str, Any], zone_area_sqmi: float = 1.0) -> float:
    """
    Calculates the normalized Population Vulnerability Score (0–100) for a zone.
    Combines elderly (65+) concentration, socioeconomic vulnerability (poverty/SVI),
    and population density.
    """
    elderly_pct = vuln_data.get("elderly_pct", 0.0)
    svi_score = vuln_data.get("socioeconomic_vulnerability", 0.0)
    pop_est = vuln_data.get("population_estimate", 0)
    
    # Calculate population density (people / sq mi)
    area = max(0.01, zone_area_sqmi)
    density = pop_est / area
    
    elderly_score = normalize(elderly_pct, VULN_ELDERLY_MIN_PCT, VULN_ELDERLY_MAX_PCT)
    svi_norm_score = normalize(svi_score, VULN_SVI_MIN, VULN_SVI_MAX)
    density_score = normalize(density, VULN_DENSITY_MIN, VULN_DENSITY_MAX)
    
    final_score = (
        elderly_score * WEIGHT_VULN_ELDERLY +
        svi_norm_score * WEIGHT_VULN_SVI +
        density_score * WEIGHT_VULN_DENSITY
    )
    
    return round(max(0.0, min(100.0, final_score)), 2)


def resource_deficit_score(resource_data: Dict[str, Any]) -> float:
    """
    Calculates the normalized Protective Resource Deficit Score (0–100) for a zone.
    Produces a HIGH score (100) when resources are scarce or distant, and
    drops toward 0 as nearby accessible cooling infrastructure increases.
    """
    nearest_distance_m = resource_data.get("nearest_resource_distance_m")
    if nearest_distance_m is None:
        distance_factor = 100.0
    else:
        distance_factor = normalize(nearest_distance_m, 0.0, RES_SAFE_WALKING_DISTANCE_M)
        
    within_radius_count = resource_data.get("resources_within_radius_count", 0)
    within_zone_count = resource_data.get("resources_within_zone_count", 0)
    
    # Scarcity factor starts at 100 and decays with available facilities
    # Facilities strictly inside the zone provide extra direct relief
    scarcity_relief = (within_radius_count * 20.0) + (within_zone_count * 25.0)
    scarcity_factor = max(0.0, 100.0 - scarcity_relief)
    
    final_score = (
        distance_factor * WEIGHT_RES_DISTANCE +
        scarcity_factor * WEIGHT_RES_SCARCITY
    )
    
    return round(max(0.0, min(100.0, final_score)), 2)
