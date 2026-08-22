# Architecture Documentation

## Phoenix Target Area

HeatSentinel AI uses a specific 23.3 sq mi target area covering Downtown and South Phoenix. 

### Rationale
The FortyGuard API `Basic` plan caps heatmap queries at 10 sq miles per request. To scan the Phoenix target area, the Spatial Engine will dynamically tile this master polygon into smaller ~9.9 sq mi Area of Interest (AOI) bounding boxes, dispatch them to FortyGuard concurrently, and stitch the results together.

This specific region was chosen because it represents a high-contrast zone for heat equity: combining the dense, highly-impervious urban core of downtown Phoenix with the historically vulnerable residential communities of South Phoenix.

**Boundary details:**
* North: I-10 (~33.465 N)
* West: I-17 (~112.095 W)
* East: 24th St (~112.030 W)
* South: Baseline Rd (~33.375 N)

The source GeoJSON for this polygon is version-controlled at `/backend/app/data/phoenix_target_area.geojson`.
