"""
HeatSentinel AI - Pipeline Service (Step 27 / First Working Vertical Slice)
Orchestrates:
Target Area Scan -> Hotspot Detection -> Zone Metrics & Baselines -> Census Demographic Spatial Joins ->
MAG Resource Proximity -> Response Gap & Zone Ranking -> Structured Evidence Output.
"""

import asyncio
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
from shapely.geometry import shape

from app.models.zone import HeatZone, LatLng, ZoneEvidence, BasicPipelineResult
from app.services.fortyguard_client import FortyGuardClient
from app.services.scan_service import scan_area
from app.services.hotspot_service import detect_hotspots
from app.services.analytics_engine import compute_zone_heat_metrics
from app.services.vulnerability_service import get_vulnerability_for_zone
from app.services.resource_service import get_resource_coverage_for_zone
from app.services.priority_engine import (
    heat_exposure_score,
    vulnerability_score,
    resource_deficit_score,
    calculate_response_gap,
    rank_zones,
    DISCLAIMER_TEXT
)
from app.logging_config import logger


CITY_TARGET_BBOXES: Dict[str, List[List[float]]] = {
    "phoenix": [[-112.095, 33.375], [-112.030, 33.375], [-112.030, 33.465], [-112.095, 33.465], [-112.095, 33.375]],
    "las vegas": [[-115.20, 36.10], [-115.10, 36.10], [-115.10, 36.22], [-115.20, 36.22], [-115.20, 36.10]],
    "miami": [[-80.25, 25.72], [-80.15, 25.72], [-80.15, 25.82], [-80.25, 25.82], [-80.25, 25.72]],
    "houston": [[-95.42, 29.70], [-95.32, 29.70], [-95.32, 29.80], [-95.42, 29.80], [-95.42, 29.70]],
    "los angeles": [[-118.30, 34.00], [-118.20, 34.00], [-118.20, 34.10], [-118.30, 34.10], [-118.30, 34.00]],
    "new york": [[-74.02, 40.70], [-73.95, 40.70], [-73.95, 40.78], [-74.02, 40.78], [-74.02, 40.70]],
}


def load_default_city_target_area(city: str = "Phoenix") -> Dict[str, Any]:
    """Loads target study area GeoJSON for any supported US city, falling back to bounding box."""
    city_key = city.lower().strip()
    if city_key == "phoenix":
        data_path = Path(__file__).resolve().parent.parent / "data" / "phoenix_target_area.geojson"
        if data_path.exists():
            with open(data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("type") == "FeatureCollection" and data.get("features"):
                    return data["features"][0]["geometry"]
                elif data.get("type") == "Feature":
                    return data["geometry"]
                return data

    coords = CITY_TARGET_BBOXES.get(city_key, CITY_TARGET_BBOXES["phoenix"])
    return {
        "type": "Polygon",
        "coordinates": [coords]
    }


def load_default_phoenix_target_area() -> Dict[str, Any]:
    return load_default_city_target_area("Phoenix")


def _determine_primary_driver(h_score: float, v_score: float, d_score: float) -> str:
    """Identifies the dominant contributing factor to heat risk for WHY evidence."""
    max_score = max(h_score, v_score, d_score)
    if max_score == h_score:
        return "Severe Thermal Intensity & Persistence"
    elif max_score == v_score:
        return "High Socioeconomic & Demographic Sensitivity"
    else:
        return "Critical Cooling Infrastructure Deficit"


def _generate_zone_name(idx: int, center_lat: float, center_lng: float, city: str = "Phoenix") -> str:
    """Generates human-readable zone name based on geographic position and city."""
    if city.lower() == "phoenix":
        if center_lat >= 33.44:
            sub = "North Corridor"
        elif center_lat <= 33.39:
            sub = "South Corridor"
        else:
            sub = "Central District"
    else:
        sub = f"{city} Sector {idx + 1}"
        
    return f"Zone {idx + 1} — {sub} ({center_lat:.3f}, {center_lng:.3f})"



async def _process_hotspot(
    hotspot: Dict[str, Any],
    idx: int,
    start_date: str,
    start_time: str,
    client: FortyGuardClient,
    semaphore: asyncio.Semaphore,
    city: str = "Phoenix"
) -> Dict[str, Any]:
    """Processes a single hotspot through metrics, vulnerability, resources, and scoring."""
    async with semaphore:
        geom = hotspot["geometry"]
        poly_shape = shape(geom)
        centroid = poly_shape.centroid
        center = LatLng(lat=round(centroid.y, 6), lng=round(centroid.x, 6))
        
        # 1. Concurrently query heat metrics, Census demographics, and MAG cooling resources
        metrics_task = compute_zone_heat_metrics(
            zone_polygon=geom,
            start_date=start_date,
            start_time=start_time,
            client=client
        )
        # Vulnerability and resource coverage are sync spatial queries, ran safely
        vuln_data = get_vulnerability_for_zone(geom)
        res_data = get_resource_coverage_for_zone(geom, search_radius_m=1600.0)
        
        heat_metrics = await metrics_task
        
        # 2. Compute Priority Engine sub-scores
        h_score = heat_exposure_score(heat_metrics)
        v_score = vulnerability_score(vuln_data, zone_area_sqmi=max(0.1, poly_shape.area * 3000))
        d_score = resource_deficit_score(res_data)
        
        # 3. Calculate Response Gap
        rg_result = calculate_response_gap(h_score, v_score, d_score)
        
        primary_driver = _determine_primary_driver(h_score, v_score, d_score)
        temp_c = heat_metrics.current_temp_c
        temp_f = round((temp_c * 9/5) + 32, 1)
        
        # 4. Build Structured Evidence Trail
        evidence = ZoneEvidence(
            zone_id=hotspot.get("hotspot_id", f"zone-{idx+1}"),
            heat_exposure_score=h_score,
            vulnerability_score=v_score,
            resource_deficit_score=d_score,
            response_gap_score=rg_result["response_gap_score"],
            primary_driver=primary_driver,
            heat_score_explanation=(
                f"Peak surface temperature of {temp_c:.1f}°C ({temp_f:.1f}°F) with "
                f"{heat_metrics.persistence_hours:.1f} hrs acute persistence."
            ),
            vulnerability_explanation=(
                f"Estimated population of {vuln_data.get('population_estimate', 0):,} with "
                f"{vuln_data.get('elderly_pct', 0.0)*100:.1f}% seniors (65+) and "
                f"SVI vulnerability index of {vuln_data.get('socioeconomic_vulnerability', 0.0):.2f}."
            ),
            resource_gap_explanation=(
                f"{res_data.get('resources_within_radius_count', 0)} cooling resources within 1 mile. "
                f"Nearest resource: {res_data.get('nearest_resource_name', 'None')} "
                f"({res_data.get('nearest_resource_distance_m', 0):.0f}m away)."
            ),
            current_temp_c=temp_c,
            current_temp_f=temp_f,
            persistence_hours=heat_metrics.persistence_hours,
            exceedance_hours=heat_metrics.exceedance_hours,
            anomaly_c=heat_metrics.anomaly_c,
            baseline_available=heat_metrics.baseline_available,
            population_estimate=vuln_data.get("population_estimate", 0),
            elderly_pct=vuln_data.get("elderly_pct", 0.0),
            socioeconomic_vulnerability=vuln_data.get("socioeconomic_vulnerability", 0.0),
            source_tracts=vuln_data.get("source_geographies", []),
            cooling_resources_in_1mi=res_data.get("resources_within_radius_count", 0),
            cooling_resources_in_zone=res_data.get("resources_within_zone_count", 0),
            nearest_resource_distance_m=res_data.get("nearest_resource_distance_m"),
            nearest_resource_name=res_data.get("nearest_resource_name"),
            nearest_resource_type=res_data.get("nearest_resource_type"),
            total_cooling_capacity=res_data.get("total_capacity_within_radius", 0),
            data_sources=heat_metrics.data_sources + ["US Census ACS 5-Year", "MAG Heat Relief Network"],
            sources={
                "fortyguard_tiles": hotspot.get("tile_ids", []),
                "census_vintage": vuln_data.get("vintage", "2022 ACS 5-Year"),
                "mag_network": "Maricopa Association of Governments 2024",
                "computed_at": datetime.now(timezone.utc).isoformat()
            }
        )

        
        # Coordinates in [lng, lat] format
        raw_coords = geom.get("coordinates", [[]])[0]
        
        zone_dict = {
            "zone_id": hotspot.get("hotspot_id", f"zone-{idx+1}"),
            "name": _generate_zone_name(idx, centroid.y, centroid.x, city=city),
            "city": city,
            "coordinates": raw_coords,
            "center": center,
            "mean_temp_c": temp_c,
            "mean_temp_f": temp_f,
            "persistence_hours": heat_metrics.persistence_hours,
            "exceedance_hours": heat_metrics.exceedance_hours,
            "heat_exposure_score": h_score,
            "vulnerability_score": v_score,
            "resource_deficit_score": d_score,
            "response_gap_score": rg_result["response_gap_score"],
            "display_score": rg_result["display_score"],
            "priority_level": rg_result["tier"],
            "evidence": evidence,
            "disclaimer": DISCLAIMER_TEXT
        }
        return zone_dict


async def run_basic_pipeline(
    target_area: Optional[Dict[str, Any]] = None,
    city: str = "Phoenix",
    start_date: str = "2024-08-01",
    start_time: str = "14:00",
    top_n_hotspots: int = 5,
    client: Optional[FortyGuardClient] = None
) -> BasicPipelineResult:
    """
    Executes the end-to-end basic pipeline for any monitored city:
    1. Scan area with FortyGuard
    2. Detect thermal hotspot clusters
    3. Concurrently enrich with metrics, Census demographics, and cooling resources
    4. Calculate Response Gap and rank zones
    5. Return unified BasicPipelineResult
    """
    start_ts = time.time()
    if client is None:
        client = FortyGuardClient()
        
    # 1. Target Polygon
    aoi_polygon = target_area or load_default_city_target_area(city)
    logger.info(f"PipelineService: Starting basic pipeline scan for {city} with {top_n_hotspots} max hotspots.")
    
    # 2. Run FortyGuard Heatmap Scan
    scan_res = await scan_area(
        polygon=aoi_polygon,
        analytic_type="tcm",
        granularity=60,
        start_date=start_date,
        start_time=start_time,
        client=client
    )
    
    # 3. Detect Hotspot Clusters
    hotspots = detect_hotspots(
        scan_result=scan_res.get("data", {}),
        top_n=top_n_hotspots
    )
    logger.info(f"PipelineService: Detected {len(hotspots)} hotspot clusters for {city}.")
    
    # 4. Concurrently process detected hotspots with bounded semaphore
    semaphore = asyncio.Semaphore(3)
    tasks = [
        _process_hotspot(
            hotspot=hs,
            idx=i,
            start_date=start_date,
            start_time=start_time,
            client=client,
            semaphore=semaphore,
            city=city
        )
        for i, hs in enumerate(hotspots)
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    raw_zones: List[Dict[str, Any]] = []
    excluded_zones: List[Dict[str, Any]] = []
    
    for idx, res in enumerate(results):
        if isinstance(res, Exception):
            logger.error(f"PipelineService: Zone {idx} failed during processing: {res}")
            excluded_zones.append({
                "hotspot_index": idx,
                "error": str(res)
            })
        else:
            raw_zones.append(res)
            
    # 5. Rank Zones
    ranked_dicts = rank_zones(raw_zones)
    
    # 6. Convert to HeatZone models
    ranked_models: List[HeatZone] = []
    for r in ranked_dicts:
        ranked_models.append(HeatZone(**r))
        
    duration_ms = int((time.time() - start_ts) * 1000)
    
    summary = {
        "total_tiles": scan_res.get("summary", {}).get("total_tiles", 0),
        "total_cells": scan_res.get("summary", {}).get("total_cells", 0),
        "hotspots_detected": len(hotspots),
        "zones_ranked": len(ranked_models),
        "excluded_count": len(excluded_zones),
        "duration_ms": duration_ms
    }
    
    return BasicPipelineResult(
        status="ok",
        city="Phoenix",
        timestamp=datetime.now(timezone.utc),
        scan_summary=summary,
        ranked_zones=ranked_models,
        total_zones=len(ranked_models),
        excluded_zones=excluded_zones,
        disclaimer=DISCLAIMER_TEXT
    )
