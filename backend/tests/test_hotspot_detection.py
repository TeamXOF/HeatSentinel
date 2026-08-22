import pytest
from app.services.hotspot_service import detect_hotspots

def test_detect_hotspots():
    # Create a synthetic scan result
    features = []
    
    # 1. A hot cluster around ( -112.080, 33.440 )
    for i in range(5):
        features.append({
            "type": "Feature",
            "properties": {"value": 45.0 + i, "tile_id": "tile_0"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-112.080 + (i*0.0001), 33.440],
                    [-112.079 + (i*0.0001), 33.440],
                    [-112.079 + (i*0.0001), 33.439],
                    [-112.080 + (i*0.0001), 33.439],
                    [-112.080 + (i*0.0001), 33.440]
                ]]
            }
        })
        
    # 2. Some cold background cells
    for i in range(10):
        features.append({
            "type": "Feature",
            "properties": {"value": 25.0 + (i*0.1), "tile_id": "tile_1"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-112.090 + (i*0.001), 33.450],
                    [-112.089 + (i*0.001), 33.450],
                    [-112.089 + (i*0.001), 33.449],
                    [-112.090 + (i*0.001), 33.449],
                    [-112.090 + (i*0.001), 33.450]
                ]]
            }
        })
        
    scan_result = {"type": "FeatureCollection", "features": features}
    
    # Run detection
    # We have 15 cells. Top 20% (80th percentile) means the top 3 cells (values 47, 48, 49).
    # Since they are closely spaced, they will form 1 cluster.
    hotspots = detect_hotspots(
        scan_result, 
        top_n=2, 
        min_cell_temp_percentile=80.0, 
        eps_meters=200.0,
        min_samples=2 # lowered for test
    )
    
    assert len(hotspots) == 1
    hs = hotspots[0]
    
    assert hs["max_temp"] == 49.0
    assert hs["cell_count"] == 3
    assert hs["mean_temp"] == 48.0
    assert "tile_0" in hs["tile_ids"]
    assert "geometry" in hs
    assert hs["geometry"]["type"] in ["Polygon", "MultiPolygon"]

def test_detect_hotspots_empty():
    hotspots = detect_hotspots({"type": "FeatureCollection", "features": []})
    assert len(hotspots) == 0
