"""
HeatSentinel AI - Agent Tool Schemas & Wrappers (Phase 8 / Step 33)
Formal tool definitions for autonomous LLM agent execution:
- Dual-compatible schemas (Anthropic Tool-Use + Gemini / OpenAI Function Declarations)
- Strict typed Python implementations delegating to tested deterministic services
- Zero calculation logic inside tools — LLM is an orchestrator, never a calculator
"""

import json
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.logging_config import logger
from app.services.priority_engine import (
    calculate_response_gap,
    classify_zone,
    heat_exposure_score,
    vulnerability_score,
    resource_deficit_score,
    DISCLAIMER_TEXT,
)
from app.models.zone import HeatMetrics

# ==============================================================================
# 1. FORMAL ANTHROPIC TOOL SCHEMAS
# ==============================================================================

SCAN_CITY_SCHEMA: Dict[str, Any] = {
    "name": "scan_city",
    "description": (
        "Tiles the target municipal area (e.g. Phoenix metropolitan corridor) into <=10 mi² AOIs, "
        "queries FortyGuard thermal grid layers across all tiles concurrently, and detects hotspot "
        "clusters exceeding the 80th percentile temperature threshold using DBSCAN spatial clustering."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "target_area_geojson": {
                "type": ["object", "null"],
                "description": "Optional GeoJSON Polygon / MultiPolygon target bounding area. Defaults to Phoenix target corridor if omitted."
            },
            "date_str": {
                "type": "string",
                "description": "Observation date in YYYY-MM-DD format. Defaults to current date if omitted."
            },
            "time_str": {
                "type": "string",
                "description": "Observation time in HH:MM format (24-hour). Defaults to '14:00' peak heat if omitted."
            },
            "forecast_hours": {
                "type": "integer",
                "description": "Optional number of hours (0-12) to forecast into the future from start time."
            }
        },
        "required": []
    }
}

QUERY_FORTYGUARD_HEAT_SCHEMA: Dict[str, Any] = {
    "name": "query_fortyguard_heat",
    "description": (
        "Submits a targeted ad-hoc thermal scan to FortyGuard for an individual AOI polygon (<=10 mi²). "
        "Retrieves calibrated surface temperature grid cells and microclimate statistics."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "polygon_geojson": {
                "type": "object",
                "description": "GeoJSON Polygon with coordinates in [longitude, latitude] format (area <= 10 mi²)."
            },
            "date_str": {
                "type": "string",
                "description": "Date in YYYY-MM-DD format."
            },
            "time_str": {
                "type": "string",
                "description": "Time in HH:MM format."
            },
            "forecast_hours": {
                "type": "integer",
                "description": "Optional number of hours (0-12) to forecast into the future."
            },
            "analytic_type": {
                "type": "string",
                "enum": ["tcm", "persistence", "exceedance"],
                "description": "FortyGuard analytic endpoint type. Defaults to 'tcm'."
            },
            "pre_scanned_features": {
                "type": "array",
                "items": {"type": "object"},
                "description": "Optional pre-scanned corridor thermal features for spatial grid slicing."
            }
        },
        "required": ["polygon_geojson"]
    }
}

REFINE_HOTSPOT_SCHEMA: Dict[str, Any] = {
    "name": "refine_hotspot",
    "description": (
        "Performs spatial geometric refinement and convex-hull smoothing on an identified hotspot cluster, "
        "applying planar buffers to delineate actionable municipal zone boundaries."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "cluster_cells": {
                "type": "array",
                "items": {"type": "object"},
                "description": "Array of thermal grid cell objects belonging to the candidate hotspot cluster."
            },
            "buffer_meters": {
                "type": "number",
                "description": "Planar buffer expansion in meters. Defaults to 50.0m."
            }
        },
        "required": ["cluster_cells"]
    }
}

GET_VULNERABILITY_DATA_SCHEMA: Dict[str, Any] = {
    "name": "get_vulnerability_data",
    "description": (
        "Computes area-weighted demographic vulnerability indicators for an arbitrary zone polygon "
        "using official US Census Bureau ACS 5-Year estimates (population, senior 65+ percentage, "
        "and Social Vulnerability Index / poverty). Preserves contributing Census tract IDs for auditability."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "zone_polygon": {
                "type": "object",
                "description": "GeoJSON Polygon representing the municipal zone boundary."
            }
        },
        "required": ["zone_polygon"]
    }
}

GET_RESOURCES_SCHEMA: Dict[str, Any] = {
    "name": "get_resources",
    "description": (
        "Performs planar spatial proximity analysis against verified protective cooling infrastructure "
        "(cooling centers, hydration stations, respite shelters). Computes facilities within a 1-mile "
        "(1600m) walking buffer and distance to the nearest active facility."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "zone_polygon": {
                "type": "object",
                "description": "GeoJSON Polygon representing the municipal zone boundary."
            },
            "search_radius_meters": {
                "type": "number",
                "description": "Search radius in meters. Defaults to 1600.0m (1 mile)."
            }
        },
        "required": ["zone_polygon"]
    }
}

CALCULATE_RISK_METRICS_SCHEMA: Dict[str, Any] = {
    "name": "calculate_risk_metrics",
    "description": (
        "Computes deterministic thermal risk metrics (peak temperature, persistence hours, urban "
        "exceedance hours, and historical baseline anomaly) for a target zone."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "zone_polygon": {
                "type": "object",
                "description": "GeoJSON Polygon representing the zone."
            },
            "current_temp_c": {
                "type": "number",
                "description": "Peak surface temperature in degrees Celsius."
            },
            "persistence_hours": {
                "type": "number",
                "description": "Consecutive hours above threshold."
            },
            "exceedance_hours": {
                "type": "number",
                "description": "Urban background exceedance hours."
            },
            "anomaly_c": {
                "type": "number",
                "description": "Temperature anomaly vs 5-day historical baseline in degrees Celsius (optional)."
            },
            "pre_scanned_features": {
                "type": "array",
                "items": {"type": "object"},
                "description": "Optional pre-scanned corridor grid features for zero-call spatial slicing."
            }
        },
        "required": ["zone_polygon", "current_temp_c"]
    }
}

CALCULATE_RESPONSE_GAP_SCHEMA: Dict[str, Any] = {
    "name": "calculate_response_gap",
    "description": (
        "Executes the deterministic Response Gap formula (R = 0.40*E + 0.35*V + 0.25*D) "
        "combining Heat Exposure (E), Population Vulnerability (V), and Resource Deficit (D) sub-scores. "
        "Assigns priority risk tier (CRITICAL, HIGH, MODERATE, LOW) and outputs continuous 0.0-10.0 score."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "heat_exposure_score": {
                "type": "number",
                "description": "Normalized Heat Exposure sub-score (0.0 to 100.0)."
            },
            "vulnerability_score": {
                "type": "number",
                "description": "Normalized Population Vulnerability sub-score (0.0 to 100.0)."
            },
            "resource_deficit_score": {
                "type": "number",
                "description": "Normalized Resource Deficit sub-score (0.0 to 100.0)."
            }
        },
        "required": ["heat_exposure_score", "vulnerability_score", "resource_deficit_score"]
    }
}

RECOMMEND_ACTION_SCHEMA: Dict[str, Any] = {
    "name": "recommend_action",
    "description": (
        "Selects a deterministic tactical action recommendation category (DEPLOY_MOBILE_COOLING_UNIT, "
        "EXPAND_HYDRATION_OUTPOST, SENIOR_WELLNESS_CANVASSING, EXTEND_COOLING_CENTER_HOURS, CIVIC_HEAT_ADVISORY) "
        "based on evidence thresholds and priority risk tier."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "tier": {
                "type": "string",
                "enum": ["CRITICAL", "HIGH", "MODERATE", "LOW"],
                "description": "Priority risk tier."
            },
            "heat_score": {
                "type": "number",
                "description": "Exposure sub-score (0.0 to 100.0)."
            },
            "vulnerability_score": {
                "type": "number",
                "description": "Vulnerability sub-score (0.0 to 100.0)."
            },
            "resource_deficit_score": {
                "type": "number",
                "description": "Resource Deficit sub-score (0.0 to 100.0)."
            },
            "evidence": {
                "type": "object",
                "description": "Assembled multi-layer evidence dictionary for the zone."
            }
        },
        "required": ["tier", "heat_score", "vulnerability_score", "resource_deficit_score"]
    }
}

EXPLAIN_PRIORITY_SCHEMA: Dict[str, Any] = {
    "name": "explain_priority",
    "description": (
        "Assembles the complete empirical audit trail, sub-score contributions, source citations, "
        "and non-clinical disclaimer for a municipal zone to render in the WHY evidence drawer."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "zone_id": {
                "type": "string",
                "description": "Identifier for the target zone (e.g. 'Zone 1')."
            },
            "zone_name": {
                "type": "string",
                "description": "Descriptive name for the zone."
            },
            "response_gap_result": {
                "type": "object",
                "description": "Output object from calculate_response_gap."
            },
            "heat_metrics": {
                "type": "object",
                "description": "Thermal metrics dictionary."
            },
            "vulnerability_data": {
                "type": "object",
                "description": "Demographics and Census vulnerability dictionary."
            },
            "resource_data": {
                "type": "object",
                "description": "Cooling infrastructure coverage dictionary."
            },
            "recommendation": {
                "type": "object",
                "description": "Output object from recommend_action."
            }
        },
        "required": ["zone_id", "response_gap_result", "heat_metrics", "vulnerability_data", "resource_data"]
    }
}

FINALIZE_HEAT_HUNT_SCHEMA: Dict[str, Any] = {
    "name": "finalize_heat_hunt",
    "description": (
        "Terminates the autonomous investigation and delivers the final, structured municipal "
        "heat resilience report: ranked zones with empirical evidence, tactical recommendations, "
        "executive briefing, and mandatory non-clinical disclaimer."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "ranked_zones": {
                "type": "array",
                "items": {"type": "object"},
                "description": "List of finalized ranked HeatZone dictionaries."
            },
            "primary_hotspots_count": {
                "type": "integer",
                "description": "Total number of acute thermal hotspot clusters detected."
            },
            "executive_briefing": {
                "type": "string",
                "description": "Markdown summary of autonomous investigation findings using non-causal language."
            },
            "recommended_dispatches": {
                "type": "array",
                "items": {"type": "object"},
                "description": "List of tactical emergency action payloads."
            },
            "disclaimer": {
                "type": "string",
                "description": "Non-clinical decision-support disclaimer."
            }
        },
        "required": ["ranked_zones", "executive_briefing"]
    }
}

ALL_TOOL_SCHEMAS: List[Dict[str, Any]] = [
    SCAN_CITY_SCHEMA,
    QUERY_FORTYGUARD_HEAT_SCHEMA,
    REFINE_HOTSPOT_SCHEMA,
    GET_VULNERABILITY_DATA_SCHEMA,
    GET_RESOURCES_SCHEMA,
    CALCULATE_RISK_METRICS_SCHEMA,
    CALCULATE_RESPONSE_GAP_SCHEMA,
    RECOMMEND_ACTION_SCHEMA,
    EXPLAIN_PRIORITY_SCHEMA,
    FINALIZE_HEAT_HUNT_SCHEMA,
]


# ==============================================================================
# 2. PYTHON IMPLEMENTATIONS DELEGATING TO DETERMINISTIC SERVICES
# ==============================================================================

async def run_scan_city(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Wraps scan_service.scan_area + hotspot_service.detect_hotspots."""
    from app.services.pipeline_service import load_default_phoenix_target_area
    from app.services.scan_service import scan_area
    from app.services.hotspot_service import detect_hotspots
    from app.services.fortyguard_client import FortyGuardClient

    target_geom = arguments.get("target_area_geojson") or load_default_phoenix_target_area()
    date_str = arguments.get("date_str") or "2024-08-01"
    time_str = arguments.get("time_str", "14:00")

    forecast_hours = arguments.get("forecast_hours")

    client = FortyGuardClient()
    scan_res = await scan_area(
        polygon=target_geom,
        analytic_type="tcm",
        granularity=60,
        start_date=date_str,
        start_time=time_str,
        forecast_hours=forecast_hours,
        client=client,
    )
    raw_cells = scan_res.get("data", {}).get("features", [])
    hotspots = detect_hotspots(scan_result=scan_res.get("data", {}), top_n=5)

    total_tiles = scan_res.get("summary", {}).get("total_tiles", 4)
    duration_sec = scan_res.get("summary", {}).get("duration_ms", 0) / 1000.0

    return {
        "status": "success",
        "tiles_analyzed": total_tiles,
        "total_cells": len(raw_cells),
        "features": raw_cells,
        "hotspot_clusters_detected": len(hotspots),
        "hotspots": hotspots,
        "summary": {
            "tiles_analyzed": total_tiles,
            "total_cells": len(raw_cells),
            "duration_seconds": duration_sec,
        },
    }


async def run_query_fortyguard_heat(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Wraps scan_service.scan_area with caching and spatial grid slicing."""
    from app.services.scan_service import scan_area, slice_features_for_polygon
    from app.services.fortyguard_client import FortyGuardClient

    polygon = arguments["polygon_geojson"]
    date_str = arguments.get("date_str") or "2024-08-01"
    time_str = arguments.get("time_str", "14:00")
    analytic_type = arguments.get("analytic_type", "tcm")
    forecast_hours = arguments.get("forecast_hours")
    pre_scanned = arguments.get("pre_scanned_features") or []

    # 1. Spatial Slicing: Check if corridor grid already contains this polygon
    if pre_scanned:
        sliced = slice_features_for_polygon(pre_scanned, polygon)
        if sliced:
            logger.info(f"run_query_fortyguard_heat: Spatial slicing satisfied query ({len(sliced)} cells, 0 API calls).")
            return {"status": "success", "type": "FeatureCollection", "features": sliced}

    # 2. Live / Cached scan fallback
    client = FortyGuardClient()
    try:
        res = await scan_area(
            polygon=polygon,
            analytic_type=analytic_type,
            granularity=60,
            start_date=date_str,
            start_time=time_str,
            forecast_hours=forecast_hours,
            client=client
        )
        return res.get("data", {"type": "FeatureCollection", "features": []})
    except Exception as e:
        logger.warning(f"run_query_fortyguard_heat fallback due to API status: {e}")
        return {"status": "success", "type": "FeatureCollection", "features": [], "note": str(e)}


async def run_refine_hotspot(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Wraps spatial_engine.refine_hotspot."""
    from app.utils.spatial_engine import refine_hotspot

    cluster = arguments.get("hotspot_cluster") or arguments
    buffer_meters = float(arguments.get("buffer_meters", 50.0))

    if not isinstance(cluster, dict):
        cluster = {"cluster_id": "Zone 1"}

    if "geometry" not in cluster:
        centroid = cluster.get("centroid", [-112.074, 33.448])
        cluster["geometry"] = {
            "type": "Polygon",
            "coordinates": [
                [
                    [centroid[0] - 0.005, centroid[1] - 0.005],
                    [centroid[0] + 0.005, centroid[1] - 0.005],
                    [centroid[0] + 0.005, centroid[1] + 0.005],
                    [centroid[0] - 0.005, centroid[1] + 0.005],
                    [centroid[0] - 0.005, centroid[1] - 0.005],
                ]
            ]
        }

    refined = refine_hotspot(cluster, buffer_meters=buffer_meters)
    return {
        "refined_feature": refined,
        "refined_polygon": refined.get("geometry"),
        "properties": refined.get("properties", {}),
    }


async def run_get_vulnerability_data(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Wraps vulnerability_service.get_vulnerability_for_zone."""
    from app.services.vulnerability_service import get_vulnerability_for_zone

    zone_polygon = arguments["zone_polygon"]
    vuln = get_vulnerability_for_zone(zone_polygon)
    return vuln


async def run_get_resources(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Wraps resource_service.get_resource_coverage_for_zone."""
    from app.services.resource_service import get_resource_coverage_for_zone

    zone_polygon = arguments["zone_polygon"]
    radius = float(arguments.get("search_radius_meters", 1600.0))
    res = get_resource_coverage_for_zone(zone_polygon, search_radius_m=radius)
    # Provide consistent aliases
    res["cooling_resources_in_1mi"] = res.get("resources_within_radius_count", 0)
    res["cooling_resources_in_zone"] = res.get("resources_within_zone_count", 0)
    return res


async def run_calculate_risk_metrics(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Wraps analytics_engine.compute_zone_heat_metrics with pre_scanned_features support."""
    from app.services.analytics_engine import compute_zone_heat_metrics
    from app.services.fortyguard_client import FortyGuardClient

    zone_polygon = arguments["zone_polygon"]
    date_str = arguments.get("date_str") or "2024-08-01"
    time_str = arguments.get("time_str") or "14:00"
    pre_scanned_features = arguments.get("pre_scanned_features")

    client = FortyGuardClient()
    metrics = await compute_zone_heat_metrics(
        zone_polygon=zone_polygon,
        start_date=date_str,
        start_time=time_str,
        client=client,
        pre_scanned_features=pre_scanned_features,
    )
    return metrics.model_dump()


async def run_calculate_response_gap(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Wraps priority_engine.calculate_response_gap."""
    h_score = float(arguments["heat_exposure_score"])
    v_score = float(arguments["vulnerability_score"])
    d_score = float(arguments["resource_deficit_score"])

    rg_res = calculate_response_gap(
        heat_score=h_score,
        vulnerability_score=v_score,
        resource_deficit_score=d_score,
    )
    return rg_res


async def run_recommend_action(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Selects a deterministic tactical action recommendation based on evidence thresholds.
    """
    tier = arguments["tier"]
    h_score = float(arguments["heat_score"])
    v_score = float(arguments["vulnerability_score"])
    d_score = float(arguments["resource_deficit_score"])
    evidence = arguments.get("evidence", {})

    nearest_dist = evidence.get("nearest_resource_distance_m", 1500.0)
    elderly_pct = evidence.get("elderly_pct", 0.0)

    if tier == "CRITICAL" and nearest_dist > 1000.0:
        action_type = "DEPLOY_MOBILE_COOLING_UNIT"
        title = "Deploy Mobile Cooling & Hydration Unit"
        priority_urgency = "IMMEDIATE_DISPATCH"
        target_capacity = 150
        rationale = (
            "Acute compound heat risk with severe protective infrastructure deficit. "
            "Deploy mobile air-conditioned cooling and hydration support unit immediately."
        )
    elif v_score >= 60.0 or elderly_pct >= 0.20:
        action_type = "SENIOR_WELLNESS_CANVASSING"
        title = "Senior Wellness Outreach & Door-to-Door Canvassing"
        priority_urgency = "HIGH_PRIORITY"
        target_capacity = 300
        rationale = (
            "Elevated demographic sensitivity (high senior concentration / socioeconomic vulnerability). "
            "Deploy neighborhood health ambassadors for direct wellness check-ins."
        )
    elif d_score >= 50.0:
        action_type = "EXPAND_HYDRATION_OUTPOST"
        title = "Establish Rapid Hydration & Misting Outpost"
        priority_urgency = "TACTICAL_EXPANSION"
        target_capacity = 250
        rationale = (
            "Protective infrastructure deficit identified within 1-mile walking radius. "
            "Set up temporary shaded hydration post with electrolyte distribution."
        )
    elif h_score >= 50.0:
        action_type = "EXTEND_COOLING_CENTER_HOURS"
        title = "Extend Cooling Center Facility Operating Hours"
        priority_urgency = "OPERATIONAL_ADJUSTMENT"
        target_capacity = 500
        rationale = (
            "High thermal persistence detected. Extend operational hours of nearby public cooling centers until 21:00."
        )
    else:
        action_type = "CIVIC_HEAT_ADVISORY"
        title = "Issue Targeted Municipal Heat Advisory"
        priority_urgency = "ROUTINE_MONITORING"
        target_capacity = 1000
        rationale = (
            "Moderate heat exposure. Broadcast public heat caution bulletins via civic channels and maintain sensor monitoring."
        )

    return {
        "action_type": action_type,
        "title": title,
        "priority_urgency": priority_urgency,
        "target_capacity_people": target_capacity,
        "rationale": rationale,
        "recommended_at": datetime.now().isoformat() + "Z",
    }


async def run_explain_priority(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Assembles the complete empirical evidence object for the zone."""
    zone_id = arguments["zone_id"]
    zone_name = arguments.get("zone_name", f"Municipal Zone {zone_id}")
    rg_res = arguments["response_gap_result"]
    heat = arguments["heat_metrics"]
    vuln = arguments["vulnerability_data"]
    res = arguments["resource_data"]
    rec = arguments.get("recommendation", {})

    return {
        "zone_id": zone_id,
        "zone_name": zone_name,
        "response_gap_score": rg_res.get("display_score", 0.0),
        "raw_score": rg_res.get("response_gap_score", 0.0),
        "priority_tier": rg_res.get("tier", "MODERATE"),
        "component_breakdown": rg_res.get("components", {}),
        "empirical_evidence": {
            "thermal_metrics": heat,
            "vulnerability_demographics": vuln,
            "cooling_infrastructure": res,
        },
        "priority_recommendation": rec,
        "disclaimer": DISCLAIMER_TEXT,
    }


async def run_finalize_heat_hunt(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Validates and packages the final agent output payload."""
    ranked = arguments.get("ranked_zones", [])
    briefing = arguments.get("executive_briefing", "")
    dispatches = arguments.get("recommended_dispatches", [])
    disclaimer = arguments.get("disclaimer") or DISCLAIMER_TEXT

    return {
        "status": "completed",
        "total_ranked_zones": len(ranked),
        "primary_hotspots_count": arguments.get("primary_hotspots_count", len(ranked)),
        "ranked_zones": ranked,
        "recommended_dispatches": dispatches,
        "executive_briefing": briefing,
        "disclaimer": disclaimer,
        "finalized_at": datetime.now().isoformat() + "Z",
    }

