import json
from pyproj import CRS, Transformer
from shapely.geometry import shape, Polygon
from shapely.ops import transform

# EPSG:4326 is standard WGS84 (longitude, latitude)
# EPSG:2223 is NAD83 / Arizona Central (State Plane) - uses international feet
# We will use EPSG:2223 to compute accurate planar area for Phoenix
WGS84 = CRS("EPSG:4326")
AZ_CENTRAL = CRS("EPSG:2223")

# Setup transformer once for efficiency
project_to_az = Transformer.from_crs(WGS84, AZ_CENTRAL, always_xy=True).transform

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
