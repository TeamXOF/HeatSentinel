# Step 9: FortyGuard Request/Response Data Models

## Overview
To win the hackathon, our application must be bulletproof. Instead of guessing FortyGuard's exact heatmap response schema from the documentation, we will first execute a real API call to capture an authentic fixture. Then, we will build highly strict Pydantic models around it with rigorous US-bounding-box coordinate validation to ensure the rest of the application never fails due to malformed data.

## Project Type
**BACKEND / DATA ENGINEERING**

## Success Criteria
- A real FortyGuard `/v1/heatmap` response is captured and saved as a fixture.
- Strict Pydantic models (`HeatmapRequest`, `HeatmapSubmitResponse`, `StatusResponse`) are created.
- A custom coordinate validator strictly enforces US bounding box limits (Longitude: -125 to -65, Latitude: 24 to 49) to prevent lat/lon swapping.
- `pytest` passes with 100% success on the new models.

## Tech Stack
- **FastAPI / Pydantic V2**: For strictly typed data models.
- **pytest**: For testing model validation logic.
- **httpx**: To fetch the real fixture.

## File Structure
- `[NEW]` `/backend/scripts/generate_fortyguard_fixture.py`
- `[NEW]` `/backend/tests/fixtures/fortyguard_heatmap_sample.json`
- `[MODIFY]` `/backend/app/models/fortyguard.py`
- `[NEW]` `/backend/tests/test_fortyguard_models.py`

## Task Breakdown

### 1. Generate Authentic Fixture
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **INPUT:** Phoenix Target Area GeoJSON.
- **OUTPUT:** A script that submits a `tcm` heatmap request for a tiny piece of the Phoenix polygon and polls until complete, saving the result to `fortyguard_heatmap_sample.json`.
- **VERIFY:** Fixture file exists and contains a `"status": "succeeded"` payload.

### 2. Define Strict Pydantic Models
- **Agent:** `backend-specialist`
- **Skill:** `python-patterns`
- **INPUT:** The generated authentic fixture.
- **OUTPUT:** `models/fortyguard.py` with `HeatmapRequest`, `HeatmapSubmitResponse`, and `StatusResponse`.
- **VERIFY:** Models precisely match the types in the fixture without relying on `Any`.

### 3. Implement Coordinate Validator
- **Agent:** `backend-specialist`
- **Skill:** `python-patterns`
- **INPUT:** `HeatmapRequest` model.
- **OUTPUT:** A `@field_validator` on `polygon_aoi` that raises a `ValueError` if coordinates fall outside the strict US bounding box (Lon: -125 to -65, Lat: 24 to 49).
- **VERIFY:** Passing swapped `[latitude, longitude]` coordinates immediately raises a validation error.

### 4. Write Unit Tests
- **Agent:** `test-engineer`
- **Skill:** `testing-patterns`
- **INPUT:** The models and fixture.
- **OUTPUT:** `/backend/tests/test_fortyguard_models.py`.
- **VERIFY:** `pytest` confirms the models successfully parse the fixture and correctly reject invalid geometries and missing thresholds.

## Phase X: Verification (Mandatory Checklist)
- [ ] Ensure the fixture is a real API response, not mocked.
- [ ] Run `pytest backend/tests/test_fortyguard_models.py`.
- [ ] Confirm strict coordinate validation works.
- [ ] Socratic Gate was respected (Verified).
