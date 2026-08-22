# Phase 2: FortyGuard API Integration

## Overview
This plan governs Phase 2 of HeatSentinel AI, focusing strictly on integrating the FortyGuard API. We will adhere strictly to the `heatsentinel_antigravity_roadmap.md` (Steps 7 through 12) sequentially to minimize risk.

## Project Type
**BACKEND**

## Success Criteria
- FortyGuard API key is verified successfully.
- Pydantic models for FortyGuard requests/responses are implemented correctly.
- A robust, asynchronous-polling Python client for FortyGuard is established.
- The `/api/fortyguard/test-scan` endpoint is wired up to the frontend UI for the first real data visualization.

## Tech Stack
- **FastAPI / Python**: Backend framework.
- **Pydantic**: Data validation and modeling.
- **httpx**: Async HTTP client for FortyGuard communication.
- **SQLite**: Caching layer to prevent redundant API calls.

## File Structure
Changes will primarily occur in:
- `/backend/app/models/fortyguard.py`
- `/backend/app/services/fortyguard_client.py`
- `/backend/app/routers/fortyguard.py`
- `/backend/scripts/` (for verification scripts)

## Task Breakdown

### 1. API Access Verification (Step 7)
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **INPUT:** `FORTYGUARD_API_KEY` from environment.
- **OUTPUT:** A temporary script `scripts/verify_fortyguard_api.py`.
- **VERIFY:** Run script and receive a `200 OK` from `/v1/system/fetch-api-key-custom-usage`.

### 2. Response/Request Data Models (Step 8)
- **Agent:** `backend-specialist`
- **Skill:** `python-patterns`
- **INPUT:** FortyGuard API spec context.
- **OUTPUT:** Pydantic models in `models/fortyguard.py` (`HeatmapRequest`, `HeatmapResponse`, etc.).
- **VERIFY:** `pytest` passes with no validation errors for dummy data.

### 3. Pydantic Type Strictness (Step 9)
- **Agent:** `backend-specialist`
- **Skill:** `python-patterns`
- **INPUT:** Models from Step 8.
- **OUTPUT:** Added validation (e.g., longitude/latitude ordering, max area checks).
- **VERIFY:** Models correctly reject invalid bounding boxes.

### 4. Async Polling Client (Step 10)
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **INPUT:** Pydantic models.
- **OUTPUT:** `FortyGuardClient` class in `services/fortyguard_client.py` implementing `submit -> poll -> retrieve` loop.
- **VERIFY:** Unit tests pass; client handles `status === processing` vs `completed`.

### 5. Caching Layer (Step 11)
- **Agent:** `database-architect`
- **Skill:** `database-design`
- **INPUT:** `FortyGuardClient`.
- **OUTPUT:** Integration with SQLite to cache `activity_id` and final results by geometry hash.
- **VERIFY:** Duplicate identical requests return instantly from cache without an HTTP call.

### 6. First Real Data API & Frontend Wiring (Step 12)
- **Agent:** `backend-specialist` / `frontend-specialist`
- **Skill:** `api-patterns`
- **INPUT:** Cached FortyGuard client.
- **OUTPUT:** `/api/fortyguard/test-scan` endpoint; frontend `HeatMap` rendering real data.
- **VERIFY:** Clicking "Load Heat Data" in UI renders real FortyGuard cells on the Phoenix map.

## Phase X: Verification (Mandatory Checklist)
- [ ] Run backend tests (`pytest`).
- [ ] Run security scan (`python .agents/skills/vulnerability-scanner/scripts/security_scan.py .`).
- [ ] Ensure no API keys are logged or returned to the client.
- [ ] Socratic Gate was respected (Verified).
