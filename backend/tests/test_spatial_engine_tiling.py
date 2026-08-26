import pytest
from app.utils.spatial_engine import tile_polygon, describe_tiling, calculate_area_sqmi, create_phoenix_target_area
from app.errors import ConfigurationError

# Create a master Phoenix target area to test tiling on
PHOENIX_TARGET_COORDS = [
    [-112.11211, 33.45601],
    [-112.06211, 33.45601],
    [-112.06211, 33.41601],
    [-112.11211, 33.41601],
    [-112.11211, 33.45601]
]

def test_tiling_phoenix_target():
    phoenix_feature = create_phoenix_target_area(PHOENIX_TARGET_COORDS)
    # The master polygon is roughly 7-10 sq mi (just as an example, actual size depends on coordinates)
    master_polygon = phoenix_feature["geometry"]
    master_area = calculate_area_sqmi(master_polygon)
    
    # Tile it with max 10 mi2
    # Our grid generator uses 9.6 mi2 cells, so it might chop a larger area up
    tiles = tile_polygon(master_polygon, max_area_mi2=10.0)
    
    assert len(tiles) >= 1
    
    stats = describe_tiling(tiles)
    assert stats["count"] == len(tiles)
    assert stats["max_area_mi2"] < 10.0
    
    # Check that each tile is a valid GeoJSON
    for t in tiles:
        assert t["area_mi2"] < 10.0
        assert "geometry" in t
        assert t["geometry"]["type"] in ["Polygon", "MultiPolygon"]
        assert "id" in t

def test_tiling_small_polygon():
    # A very small polygon (under 1 sq mile)
    small_coords = [
        [-112.08, 33.44],
        [-112.07, 33.44],
        [-112.07, 33.43],
        [-112.08, 33.43],
        [-112.08, 33.44]
    ]
    small_polygon = {
        "type": "Polygon",
        "coordinates": [small_coords]
    }
    
    tiles = tile_polygon(small_polygon, max_area_mi2=10.0)
    
    # It should result in exactly 1 tile because the whole thing fits in a grid cell
    assert len(tiles) == 1
    assert tiles[0]["area_mi2"] < 1.0

def test_describe_tiling_empty():
    stats = describe_tiling([])
    assert stats["count"] == 0
    assert stats["total_area_mi2"] == 0.0

def test_configuration_error_guard():
    # We can force a ConfigurationError by setting an artificially low max_area_mi2
    small_coords = [
        [-112.08, 33.44],
        [-112.07, 33.44],
        [-112.07, 33.43],
        [-112.08, 33.43],
        [-112.08, 33.44]
    ]
    small_polygon = {
        "type": "Polygon",
        "coordinates": [small_coords]
    }
    
    # small_polygon is roughly 0.4 sq miles. 
    # If we pass max_area_mi2 = 0.1, but the cell generator defaults to ~9.6 mi2,
    # the guard in tile_polygon will trip.
    with pytest.raises(ConfigurationError) as exc:
        tile_polygon(small_polygon, max_area_mi2=0.1)
    
    assert "exceeds max area" in str(exc.value)

def test_strict_area_limit(monkeypatch):
    """
    Deliberately construct a tile at exactly 10.0 mi2 and 9.999 mi2 using real
    Phoenix boundary coordinates to ensure strict < 10.0 enforcement.
    """
    small_coords = [
        [-112.08, 33.44],
        [-112.07, 33.44],
        [-112.07, 33.43],
        [-112.08, 33.43],
        [-112.08, 33.44]
    ]
    small_polygon = {
        "type": "Polygon",
        "coordinates": [small_coords]
    }
    
    import app.utils.spatial_engine
    
    # 1. Test exactly 10.0 mi2 - should fail
    monkeypatch.setattr(app.utils.spatial_engine, "calculate_area_sqmi", lambda x: 10.0)
    with pytest.raises(ConfigurationError) as exc:
        tile_polygon(small_polygon, max_area_mi2=10.0)
    assert "exceeds max area: 10.0 mi2" in str(exc.value)

    # 2. Test 9.999 mi2 - should pass
    monkeypatch.setattr(app.utils.spatial_engine, "calculate_area_sqmi", lambda x: 9.999)
    tiles = tile_polygon(small_polygon, max_area_mi2=10.0)
    assert len(tiles) == 1
    assert tiles[0]["area_mi2"] == 9.999
