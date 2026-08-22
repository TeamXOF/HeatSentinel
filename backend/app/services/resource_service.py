"""
HeatSentinel AI - Resource Service (Phase 5)
Manages municipal cooling infrastructure and protective resource coverage:
- Loads Maricopa Association of Governments (MAG) Heat Relief Network data
- Computes planar distance calculations and buffer coverage for zones/hotspots
- Evaluates cooling center, hydration station, and respite facility deficits
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from shapely.geometry import shape, Point
from shapely.ops import transform
from pyproj import CRS, Transformer

from app.logging_config import logger

# Paths
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
RESOURCES_GEOJSON_PATH = DATA_DIR / "phoenix_cooling_resources.geojson"

# Coordinate Reference Systems
WGS84 = CRS("EPSG:4326")
AZ_CENTRAL = CRS("EPSG:2223") # NAD83 / Arizona Central State Plane (planar international feet)
project_to_az = Transformer.from_crs(WGS84, AZ_CENTRAL, always_xy=True).transform

FEET_PER_METER = 3.28084


def load_cooling_resources() -> Dict[str, Any]:
    """Loads the static MAG Heat Relief Network GeoJSON FeatureCollection."""
    if not RESOURCES_GEOJSON_PATH.exists():
        logger.error(f"Cooling resources file not found at: {RESOURCES_GEOJSON_PATH}")
        return {"type": "FeatureCollection", "features": []}
    
    with open(RESOURCES_GEOJSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_resource_coverage_for_zone(
    zone_polygon: Dict[str, Any], search_radius_m: float = 1600.0
) -> Dict[str, Any]:
    """
    Computes protective cooling infrastructure coverage and proximity metrics for a zone.
    
    Args:
        zone_polygon: GeoJSON Polygon or Feature geometry dictionary in WGS84 [lon, lat].
        search_radius_m: Search buffer radius in meters (default 1600m ~ 1 mile).
        
    Returns:
        Dictionary containing:
        - resources_within_zone_count: Number of cooling resources inside the zone
        - resources_within_radius_count: Number of cooling resources within search radius
        - nearest_resource_distance_m: Distance in meters to closest resource (0.0 if inside)
        - nearest_resource_name: Name of closest resource
        - total_capacity_within_radius: Estimated cooling/hydration capacity within radius
        - resource_type_breakdown: Counts of cooling_center, hydration_station, respite_center
        - resources: Detailed list of nearby resource items
    """
    geom_dict = zone_polygon.get("geometry", zone_polygon) if isinstance(zone_polygon, dict) else zone_polygon
    zone_geom_wgs = shape(geom_dict)
    zone_geom_az = transform(project_to_az, zone_geom_wgs)
    
    search_radius_ft = search_radius_m * FEET_PER_METER
    
    resources_data = load_cooling_resources()
    features = resources_data.get("features", [])
    
    resources_within_zone: List[Dict[str, Any]] = []
    resources_within_radius: List[Dict[str, Any]] = []
    
    min_distance_ft = float("inf")
    nearest_resource_name: Optional[str] = None
    
    type_counts = {
        "cooling_center": 0,
        "hydration_station": 0,
        "respite_center": 0
    }
    
    total_capacity = 0
    
    for feat in features:
        props = feat.get("properties", {})
        coords = feat.get("geometry", {}).get("coordinates", [])
        if len(coords) < 2:
            continue
            
        pt_wgs = Point(coords[0], coords[1])
        pt_az = transform(project_to_az, pt_wgs)
        
        distance_ft = zone_geom_az.distance(pt_az)
        distance_m = distance_ft / FEET_PER_METER
        
        if distance_ft < min_distance_ft:
            min_distance_ft = distance_ft
            nearest_resource_name = props.get("name")
            
        res_item = {
            "id": props.get("id"),
            "name": props.get("name"),
            "type": props.get("type"),
            "address": props.get("address"),
            "capacity": props.get("capacity", 0),
            "distance_m": round(distance_m, 1)
        }
        
        # Check if strictly inside
        if zone_geom_az.contains(pt_az) or distance_ft == 0:
            resources_within_zone.append(res_item)
            
        # Check if within search radius
        if distance_ft <= search_radius_ft:
            resources_within_radius.append(res_item)
            r_type = props.get("type", "cooling_center")
            if r_type in type_counts:
                type_counts[r_type] += 1
            else:
                type_counts[r_type] = 1
            total_capacity += props.get("capacity", 0)
            
    nearest_dist_m = round(min_distance_ft / FEET_PER_METER, 1) if min_distance_ft != float("inf") else None
    
    return {
        "resources_within_zone_count": len(resources_within_zone),
        "resources_within_radius_count": len(resources_within_radius),
        "nearest_resource_distance_m": nearest_dist_m,
        "nearest_resource_name": nearest_resource_name,
        "total_capacity_within_radius": total_capacity,
        "resource_type_breakdown": type_counts,
        "resources_within_radius": resources_within_radius
    }
