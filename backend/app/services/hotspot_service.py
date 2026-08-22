import numpy as np
from sklearn.cluster import DBSCAN
from shapely.geometry import shape, mapping
from shapely.ops import unary_union, transform
from pyproj import Transformer, CRS
import uuid

WGS84 = CRS("EPSG:4326")
EQUAL_AREA = CRS("EPSG:6933")
project_to_ea = Transformer.from_crs(WGS84, EQUAL_AREA, always_xy=True).transform

def detect_hotspots(
    scan_result: dict, 
    top_n: int = 10, 
    min_cell_temp_percentile: float = 80.0,
    eps_meters: float = 120.0,
    min_samples: int = 3
) -> list[dict]:
    """
    Detects hotspot zones from a FortyGuard heatmap scan result.
    Groups cells above a certain percentile into clusters using DBSCAN.
    """
    features = scan_result.get("features", [])
    if not features:
        return []
        
    # 1. Extract values and compute threshold
    valid_features = []
    values = []
    
    for f in features:
        props = f.get("properties", {})
        val = props.get("value")
        if val is not None:
            valid_features.append(f)
            values.append(val)
            
    if not valid_features:
        return []
        
    threshold = np.percentile(values, min_cell_temp_percentile)
    
    # 2. Filter hot cells
    hot_features = [f for f in valid_features if f["properties"].get("value", 0) >= threshold]
    if not hot_features:
        return []
        
    # 3. Extract centroids and cluster in equal-area projection
    centroids_ea = []
    for f in hot_features:
        geom = shape(f["geometry"])
        c = geom.centroid
        c_ea = transform(project_to_ea, c)
        centroids_ea.append([c_ea.x, c_ea.y])
        
    centroids_ea = np.array(centroids_ea)
    
    # DBSCAN (eps is in meters since EPSG:6933 is in meters)
    clustering = DBSCAN(eps=eps_meters, min_samples=min_samples).fit(centroids_ea)
    labels = clustering.labels_
    
    # 4. Group by cluster and compute hulls
    clusters = {}
    for idx, label in enumerate(labels):
        if label == -1:
            continue # Skip noise points that don't form a cluster
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(hot_features[idx])
        
    hotspots = []
    for label, cluster_features in clusters.items():
        cluster_values = [f["properties"]["value"] for f in cluster_features]
        mean_val = float(np.mean(cluster_values))
        max_val = float(np.max(cluster_values))
        
        # Bounding polygon via convex hull
        geoms = [shape(f["geometry"]) for f in cluster_features]
        union_geom = unary_union(geoms)
        hull = union_geom.convex_hull
        
        # If it's a line/point (rare if min_samples >=3 but possible if collinear), buffer slightly
        if hull.geom_type != "Polygon":
            hull = hull.buffer(0.0001)
            
        hull_geojson = mapping(hull)
        
        # Source tiles
        tile_ids = list(set([f["properties"].get("tile_id") for f in cluster_features if "tile_id" in f["properties"]]))
        
        hotspots.append({
            "hotspot_id": f"hs_{uuid.uuid4().hex[:8]}",
            "geometry": hull_geojson,
            "mean_temp": round(mean_val, 2),
            "max_temp": round(max_val, 2),
            "cell_count": len(cluster_features),
            "tile_ids": tile_ids
        })
        
    # 5. Sort by max_temp descending
    hotspots.sort(key=lambda x: x["max_temp"], reverse=True)
    return hotspots[:top_n]
