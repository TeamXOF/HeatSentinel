import json
from pyproj import CRS, Transformer
from shapely.geometry import shape, Polygon, box, mapping
from shapely.ops import transform
from app.errors import ConfigurationError

# EPSG:4326 is standard WGS84 (longitude, latitude)
# EPSG:2223 is NAD83 / Arizona Central (State Plane) - uses international feet
# We will use EPSG:2223 to compute accurate planar area for Phoenix
WGS84 = CRS("EPSG:4326")
AZ_CENTRAL = CRS("EPSG:2223")

# Setup transformer once for efficiency
project_to_az = Transformer.from_crs(WGS84, AZ_CENTRAL, always_xy=True).transform

# EPSG:6933 is a global equal-area projection in meters, great for grid generation
EQUAL_AREA = CRS("EPSG:6933")
project_to_ea = Transformer.from_crs(WGS84, EQUAL_AREA, always_xy=True).transform
project_to_wgs84 = Transformer.from_crs(EQUAL_AREA, WGS84, always_xy=True).transform

def calculate_area_sqmi(geojson_polygon: dict) -> float:
    """
    Computes the area of a GeoJSON Polygon in square miles.
    Input must be a valid GeoJSON Polygon dictionary (WGS84 coordinates).
    """
    geom = shape(geojson_polygon)
    
    # Project to Arizona Central (planar) to compute area
    projected_geom = transform(project_to_az, geom)
    
    # Area is in square feet (international feet for EPSG:2223)
    area_sqft = projected_geom.area
    
    # Convert square feet to square miles (1 sq mile = 27,878,400 sq ft)
    area_sqmi = area_sqft / 27878400.0
    
    return area_sqmi

def create_phoenix_target_area(coordinates: list) -> dict:
    """
    Utility to create the formatted GeoJSON Feature for the target area.
    """
    polygon = {
        "type": "Polygon",
        "coordinates": [coordinates]
    }
    
    area_sqmi = calculate_area_sqmi(polygon)
    
    return {
        "type": "Feature",
        "properties": {
            "name": "Phoenix Demo Target Area (Downtown + South)",
            "city": "Phoenix",
            "state": "AZ",
            "area_mi2": round(area_sqmi, 2),
            "source_note": "Custom bounding polygon roughly following I-10, I-17, and South Mountain boundaries."
        },
        "geometry": polygon
    }

def tile_polygon(geojson_polygon: dict, max_area_mi2: float = 10.0) -> list[dict]:
    """
    Deterministically grids a WGS84 GeoJSON polygon into tiles <= max_area_mi2.
    Returns a list of dicts with keys: id, geometry, area_mi2.
    """
    geom = shape(geojson_polygon)
    
    # Project to Equal Area (meters) to generate an evenly spaced grid
    ea_geom = transform(project_to_ea, geom)
    
    # 3x3 miles = 9 sq mi. 1 mile = 1609.34 meters
    # A 3x3 mile grid cell guarantees the area is <= 9 sq mi (safely under 10)
    # We use 3.1 miles (4988.95 meters) to get ~9.6 sq miles.
    GRID_SIZE_M = 4988.95
    
    minx, miny, maxx, maxy = ea_geom.bounds
    tiles = []
    
    x = minx
    tile_idx = 0
    while x < maxx:
        y = miny
        while y < maxy:
            cell = box(x, y, x + GRID_SIZE_M, y + GRID_SIZE_M)
            intersection = cell.intersection(ea_geom)
            
            # Keep valid geometries (Polygon or MultiPolygon)
            if not intersection.is_empty and intersection.geom_type in ['Polygon', 'MultiPolygon']:
                # Discard micro-slivers (< 0.05 sq miles = ~129,500 sq meters)
                if intersection.area > 129500:
                    wgs84_intersection = transform(project_to_wgs84, intersection)
                    wgs84_geojson = mapping(wgs84_intersection)
                    
                    actual_area = calculate_area_sqmi(wgs84_geojson)
                    
                    if actual_area > max_area_mi2 + 0.1:
                        raise ConfigurationError(f"Tile {tile_idx} exceeds max area: {actual_area} mi2")
                        
                    tiles.append({
                        "id": f"tile_{tile_idx}",
                        "geometry": wgs84_geojson,
                        "area_mi2": actual_area
                    })
                    tile_idx += 1
            y += GRID_SIZE_M
        x += GRID_SIZE_M
        
    return tiles

def describe_tiling(tiles: list[dict]) -> dict:
    """
    Returns summary statistics for a set of generated tiles.
    """
    if not tiles:
        return {"count": 0, "total_area_mi2": 0.0}
        
    areas = [t["area_mi2"] for t in tiles]
    return {
        "count": len(tiles),
        "total_area_mi2": round(sum(areas), 2),
        "min_area_mi2": round(min(areas), 2),
        "max_area_mi2": round(max(areas), 2),
        "avg_area_mi2": round(sum(areas) / len(areas), 2)
    }

def refine_hotspot(hotspot: dict, buffer_meters: float = 100.0) -> dict:
    """
    Refines a hotspot polygon by applying a small geometric buffer.
    Returns a GeoJSON Feature suitable for a focused re-query.
    
    IMPORTANT: Refinement improves spatial targeting but DOES NOT 
    create thermal measurement resolution finer than FortyGuard's 60m physical limit.
    """
    geom = shape(hotspot["geometry"])
    
    # Project to Equal Area (meters) to apply accurate buffer
    ea_geom = transform(project_to_ea, geom)
    
    # Apply buffer in meters
    buffered_ea = ea_geom.buffer(buffer_meters)
    
    # Project back to WGS84
    wgs84_buffered = transform(project_to_wgs84, buffered_ea)
    
    wgs84_geojson = mapping(wgs84_buffered)
    actual_area = calculate_area_sqmi(wgs84_geojson)
    
    if actual_area > 10.0:
        import logging
        logger = logging.getLogger("heatsentinel")
        logger.warning(f"Refined hotspot {hotspot.get('hotspot_id')} exceeds 10 mi2 cap ({actual_area} mi2). Capping may be required.")
        
    return {
        "type": "Feature",
        "properties": {
            "hotspot_id": hotspot.get("hotspot_id"),
            "buffer_meters": buffer_meters,
            "area_mi2": round(actual_area, 2),
            "resolution_note": "Refinement improves bounding target area. Raw thermal resolution remains bound by FortyGuard's 60m limit."
        },
        "geometry": wgs84_geojson
    }
