# Step 14: Multi-AOI Scan Orchestration

## Overview
HeatSentinel needs to scan the entire Phoenix area by calling FortyGuard on multiple tiles simultaneously. This plan outlines an orchestration service that handles concurrency, merges the responses, and deals with partial failures gracefully.

## Project Type
**BACKEND / SERVICE ORCHESTRATION**

## Success Criteria
- A `scan_area` function accepts a master polygon, tiles it (via Step 13), and issues `FortyGuardClient.run_heatmap` calls concurrently.
- Concurrency is strictly bounded using `asyncio.Semaphore` (e.g. max 3 concurrent requests).
- Responses are merged into a unified dataset where each cell is tagged with its origin `tile_id`.
- Partial failures are logged, but the scan still succeeds, returning the successful tiles along with a `failed_tiles` stat in the summary.
- The orchestrated calls utilize the SQLite cache from Step 11.

## Technical Approach
1. **Tiling**: Call `tile_polygon(master_polygon)` to get `N` sub-polygons.
2. **Concurrency**: Use `asyncio.gather` bounded by an `asyncio.Semaphore(3)` to map `FortyGuardClient.run_heatmap` over the sub-polygons.
3. **Failure Handling**: Wrap the API call in a `try...except` block returning `None` or an Error object on failure, rather than bubbling up and crashing `gather`.
4. **Merge**: Flatten the successfully returned `features` from the GeoJSON `FeatureCollection`s into a single master `FeatureCollection`.

## File Structure
- `[NEW]` `/backend/app/services/scan_service.py` (Contains `scan_area`)
- `[NEW]` `/backend/tests/test_scan_service.py` (Unit tests)

## Phase X: Verification
- [ ] Test full success using mocked client across 4 tiles.
- [ ] Test partial failure (mock one tile failing, ensure the other 3 are merged and `failed_tiles` is reported).
- [ ] Verify caching integration (re-running the scan shouldn't hit live API if tiles haven't changed).
