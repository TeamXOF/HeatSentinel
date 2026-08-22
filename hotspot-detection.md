# Step 15: Hotspot Detection Logic

## Overview
HeatSentinel needs to isolate regions of elevated thermal stress from the master scan results to allow the Agent to focus on actionable areas. This plan implements a spatial clustering algorithm (DBSCAN) to group hot cells into contiguous "hotspot zones."

## Project Type
**BACKEND / ANALYTICS ENGINE**

## Success Criteria
- A `detect_hotspots` function accepts a merged scan result and returns a list of candidate hotspot zones (up to `top_n`).
- The function filters cells above a dynamically computed threshold (e.g., top 20th percentile of temperature) and clusters them.
- Clustering uses DBSCAN on cell centroids to group adjacent/nearby cells.
- Bounding geometry for each cluster is computed as a Convex Hull over the cells in the cluster.
- Each hotspot includes metadata: `hotspot_id`, bounding polygon, mean temperature, max temperature, cell count, and source `tile_ids`.

## Technical Approach
1. **Filtering**: Extract properties from the FeatureCollection. Compute the 80th percentile temperature across the scan using `numpy` or standard python `statistics`. Filter out cells below this threshold.
2. **Clustering**: Extract centroids of the hot cells. Use `scikit-learn`'s `DBSCAN` (with a suitable `eps` distance based on the ~60m cell size) to cluster them.
3. **Geometry**: For each cluster, union the geometries of the constituent cells or compute their convex hull using `shapely` to form the hotspot boundary.
4. **Ranking**: Sort the resulting clusters by max temperature (or mean temperature) descending. Return top `N`.

## File Structure
- `[NEW]` `/backend/app/services/hotspot_service.py` (Contains `detect_hotspots`)
- `[NEW]` `/backend/tests/test_hotspot_detection.py` (Unit tests)
- `[MODIFY]` `/backend/requirements.txt` (Add `scikit-learn`, `numpy`)
- `[MODIFY]` `/docs/architecture.md` (Document the 80th percentile threshold as a project-specific analytical choice).

## Phase X: Verification
- [ ] Test with a synthetic fixture containing an obvious hot cluster; ensure it is detected and ranked first.
- [ ] Ensure hotspot geometries never extend beyond the bounds of the original tiles.
- [ ] Verify that the percentile choice is documented as a heuristic, not a public-health standard.
