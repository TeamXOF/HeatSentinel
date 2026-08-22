# Step 13: Area Tiling Logic

## Overview
HeatSentinel must tile large target areas (like Phoenix) into manageable Area of Interests (AOIs) that respect FortyGuard's 10 mi² limit. This plan implements a deterministic spatial grid-tiling algorithm using Shapely and pyproj.

## Project Type
**BACKEND / SPATIAL ENGINE**

## Success Criteria
- A `tile_polygon` function takes a GeoJSON polygon and divides it into tiles ≤ 10 mi².
- Tiles are properly bounded and clipped to the original polygon geometry.
- Tiling algorithm projects coordinates to an equal-area CRS (EPSG:6933) before computing the grid to ensure accurate surface area calculations, then projects back to WGS84.
- Output includes summary statistics (tile count, min/max area, total area).
- Failsafe assertion raises `ConfigurationError` if any tile exceeds the 10 mi² cap.

## Technical Approach
1. **Projection**: Project the input WGS84 GeoJSON polygon to EPSG:6933 using `pyproj` and `shapely.ops.transform`.
2. **Grid Generation**: Determine the bounding box. Create a regular grid where each cell is safely under the limit (e.g., 3x3 miles).
3. **Intersection**: Intersect the grid cells with the projected polygon to handle boundaries perfectly.
4. **Validation**: Assert area ≤ 10 mi² for all intersecting cells. Discard micro-slivers.
5. **Reprojection**: Convert back to WGS84 GeoJSON polygons.

## File Structure
- `[MODIFY]` `/backend/app/utils/spatial_engine.py` (Add `tile_polygon` and `describe_tiling`)
- `[NEW]` `/backend/tests/test_spatial_engine_tiling.py` (Unit tests)

## Phase X: Verification
- [ ] Run test on the actual Phoenix downtown polygon (from Step 8) and confirm it yields 3-6 tiles.
- [ ] Run test on a small polygon (1 mi²) and confirm it yields exactly 1 tile.
- [ ] Verify `ConfigurationError` is raised if limit is exceeded.
