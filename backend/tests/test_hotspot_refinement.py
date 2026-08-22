import pytest
from app.utils.spatial_engine import refine_hotspot, calculate_area_sqmi

def test_refine_hotspot():
    # A small mock hotspot
    mock_hotspot = {
        "hotspot_id": "hs_12345678",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [-112.080, 33.440],
                [-112.078, 33.440],
                [-112.078, 33.438],
                [-112.080, 33.438],
                [-112.080, 33.440]
            ]]
        },
        "mean_temp": 45.0,
        "max_temp": 48.0,
        "cell_count": 5,
        "tile_ids": ["tile_0"]
    }
    
    refined_feature = refine_hotspot(mock_hotspot, buffer_meters=100.0)
    
    assert refined_feature["type"] == "Feature"
    assert refined_feature["properties"]["hotspot_id"] == "hs_12345678"
    assert refined_feature["properties"]["buffer_meters"] == 100.0
    assert "resolution_note" in refined_feature["properties"]
    assert "Raw thermal resolution remains bound by FortyGuard's 60m limit" in refined_feature["properties"]["resolution_note"]
    
    original_area = calculate_area_sqmi(mock_hotspot["geometry"])
    refined_area = refined_feature["properties"]["area_mi2"]
    
    # The buffered area must be strictly larger than the original area
    assert refined_area > original_area
    assert refined_area < 10.0
    
    # Verify geometry is valid
    assert "geometry" in refined_feature
    assert refined_feature["geometry"]["type"] in ["Polygon", "MultiPolygon"]
