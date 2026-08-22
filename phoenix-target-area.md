# Step 8: Phoenix Target Area & Demo Sub-Area Selection

## Overview
This plan outlines the execution of Step 8 from the `heatsentinel_antigravity_roadmap.md`. The goal is to define and lock a 20-40 mi² target polygon in Phoenix (focusing on Downtown and South Phoenix) that will serve as the primary focus area for the live demo. We will use accurate neighborhood/census boundaries and precise geodetic math to compute the area.

## Project Type
**BACKEND / DATA ENGINEERING**

## Success Criteria
- `backend/app/data/phoenix_target_area.geojson` is created with a realistic polygon following census/neighborhood lines.
- A spatial utility is built using `shapely` and `pyproj` to calculate area accurately in square miles (using EPSG:2223 - NAD83 / Arizona Central).
- The calculated area is between 20 and 40 square miles.
- `docs/architecture.md` is updated with a section explaining the target area and tiling implications.

## Tech Stack
- **Python**: Core logic
- **Shapely**: Spatial geometry operations
- **Pyproj**: Coordinate Reference System (CRS) reprojections (specifically EPSG:4326 to EPSG:2223)
- **GeoJSON**: Data storage format

## File Structure
- `[NEW]` `/backend/app/data/phoenix_target_area.geojson`
- `[NEW]` `/backend/app/utils/spatial_engine.py` (or similar utility file)
- `[MODIFY]` `/docs/architecture.md`
- `[MODIFY]` `requirements.txt` / `pyproject.toml` (adding `shapely` and `pyproj`)

## Task Breakdown

### 1. Identify Demo Polygon Boundaries
- **Agent:** `backend-specialist`
- **Skill:** `geo-fundamentals`
- **INPUT:** Coordinates covering Downtown to South Phoenix.
- **OUTPUT:** Exact GeoJSON Polygon coordinates following logical neighborhood/tract boundaries.
- **VERIFY:** Polygon visualizes correctly on a map.

### 2. Implement Spatial Engine Utility
- **Agent:** `backend-specialist`
- **Skill:** `python-patterns`
- **INPUT:** Need for area calculation.
- **OUTPUT:** Python function `calculate_area_sqmi(geojson_polygon)` using `pyproj` transform to `EPSG:2223` and `shapely`.
- **VERIFY:** Function runs without errors and returns accurate square mileage.

### 3. Create Target Area GeoJSON
- **Agent:** `backend-specialist`
- **Skill:** `python-patterns`
- **INPUT:** Polygon coordinates and Spatial Engine.
- **OUTPUT:** `/backend/app/data/phoenix_target_area.geojson` containing the Polygon and properties (`name`, `area_mi2`, `source_note`).
- **VERIFY:** The `area_mi2` is precisely between 20.0 and 40.0.

### 4. Document Architecture
- **Agent:** `backend-specialist`
- **Skill:** `documentation-templates`
- **INPUT:** Decision to use this 20-40 mi² area.
- **OUTPUT:** Updated `/docs/architecture.md`.
- **VERIFY:** Documentation explicitly mentions the FortyGuard 10 mi² cap and how this target area will be tiled.

## Phase X: Verification (Mandatory Checklist)
- [ ] Run spatial utility to confirm area is exactly computed.
- [ ] Ensure `shapely` and `pyproj` are added to dependencies.
- [ ] Lint spatial utilities (`flake8` / `black` if applicable).
- [ ] Socratic Gate was respected (Verified via `/grill-me`).
