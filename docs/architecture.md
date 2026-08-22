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

## Hotspot Detection & Thresholds

HeatSentinel employs a dynamic, relative threshold for identifying hotspots within a given scan area. Rather than using an absolute temperature threshold (which may fluctuate seasonally or daily), the system isolates cells in the top 20th percentile (i.e. >= 80th percentile) of temperature/exceedance for the specific scan being analyzed.

**Important Note:** This 80th percentile threshold is a *project-derived analytical heuristic* designed to guide the AI agent toward the most anomalously hot areas within the current target zone. It is **not** an official public health, meteorological, or municipal standard for heat stress.

## Heat Analytics (Persistence & Exceedance)

HeatSentinel utilizes FortyGuard's native analytics to calculate heat **persistence** (duration above a threshold) and **exceedance** (total degree-hours above a threshold). 

Instead of hardcoding a static global threshold like 35°C, the system uses a **dynamic, climate-aware threshold** for these metrics. The threshold is calculated relative to the local historical baseline for that specific location and time (e.g., `Historical 7-Day Average + 2°C`). This ensures that exceedance and persistence always represent deviations from local, seasonal norms rather than arbitrary static numbers. This dynamic threshold is a project-derived analytical choice designed to make HeatSentinel adaptable to any global city.
