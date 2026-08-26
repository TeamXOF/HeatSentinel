import pytest
from app.models.zone import LatLng

def test_latlng_geojson_conversion():
    """Ensure LatLng converts to and from GeoJSON correctly, handling the [lng, lat] swap."""
    
    # 1. Asymmetric test coordinate (Phoenix)
    lat = 33.45
    lng = -112.07
    
    model = LatLng(lat=lat, lng=lng)
    
    # Assert conversion to geojson gives [lng, lat]
    geojson_coords = model.to_geojson_coords()
    assert geojson_coords == [lng, lat], "GeoJSON coordinates must strictly be in [lng, lat] order"
    
    # 2. Round-trip test
    input_coords = [lng, lat]
    parsed_model = LatLng.from_geojson_coords(input_coords)
    assert parsed_model.lat == lat
    assert parsed_model.lng == lng
    
    round_trip_coords = parsed_model.to_geojson_coords()
    assert round_trip_coords == input_coords, "Round-trip parsing must produce the exact original coordinate array"
