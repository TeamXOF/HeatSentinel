# Step 16: Hotspot Polygon Refinement

## Overview
Once a hotspot is detected, HeatSentinel must generate a precise bounding polygon suitable for a "deep-dive" focused re-query at FortyGuard's highest granularity (60m). This plan implements `refine_hotspot` to tighten the AOI with a small safety buffer.

## Project Type
**BACKEND / SPATIAL ENGINE**

## Success Criteria
- A `refine_hotspot` function takes a hotspot dictionary (from Step 15) and returns a GeoJSON polygon representing the exact area to re-query.
- The refinement applies a 100m geometric buffer to the original hotspot geometry to ensure edge cells are captured in the subsequent re-query.
- Buffering is performed accurately by projecting the geometry to an equal-area CRS (EPSG:6933) before applying the buffer, then projecting back to WGS84.
- Output includes metadata noting the source `hotspot_id` and the applied buffer distance.
- Includes explicit documentation that refinement improves spatial targeting but *does not* create thermal measurements finer than FortyGuard's 60m physical limit.

## Technical Approach
1. **Geometry Extraction**: Extract the bounding geometry (convex hull or union) from the hotspot dict.
2. **Buffering**: Project the WGS84 geometry to EPSG:6933 using `pyproj`. Apply `geometry.buffer(100)` (since EPSG:6933 is in meters). Project back to WGS84.
3. **Validation**: Validate that the refined polygon area is ≤ 10 mi². If it exceeds (rare at hotspot scale), cap it or log a warning and delegate to `tile_polygon`.
4. **Metadata**: Return a dict containing `type: "Feature"`, `geometry: <Refined Polygon>`, and `properties: { hotspot_id, buffer_meters }`.

## File Structure
- `[MODIFY]` `/backend/app/utils/spatial_engine.py` (Add `refine_hotspot`)
- `[NEW]` `/backend/tests/test_hotspot_refinement.py` (Unit tests)

## Phase X: Verification
- [ ] Test a normal hotspot geometry and ensure the resulting polygon is slightly larger (by exactly ~100m in all directions) and valid.
- [ ] Assert that comments/docstrings explicitly state that this does not increase raw thermal resolution.
- [ ] Run a manual test passing the refined polygon into `FortyGuardClient.run_heatmap` to confirm it is accepted by the API.
