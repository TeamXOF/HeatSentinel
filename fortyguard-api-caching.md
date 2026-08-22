# Step 11: Real API Route & SQLite Caching Layer

## Overview
This plan outlines the integration of the `FortyGuardClient` into a real backend endpoint (`POST /api/fortyguard/test-scan`). To avoid spamming the FortyGuard API with identical requests during development and demo (and to ensure lightning-fast responses on subsequent loads), we will introduce a SQLite-based caching layer. The cache will use a deterministic SHA-256 hash of the request parameters as the key. If no date is explicitly provided, the system will default to yesterday at 14:00.

## Project Type
**BACKEND / API & DATABASE**

## Success Criteria
- SQLite table `fortyguard_cache` is created and managed by SQLAlchemy.
- A deterministic hashing function safely encodes the `HeatmapRequest`.
- `POST /api/fortyguard/test-scan` is exposed.
- Caching logic transparently wraps the `run_heatmap` client call.
- The `force_refresh=true` query parameter bypasses the cache.

## Tech Stack
- **FastAPI**: Endpoint routing.
- **SQLAlchemy (SQLite)**: To store the cache.
- **hashlib (SHA-256)**: For deterministic cache key generation.

## File Structure
- `[MODIFY]` `/backend/app/db.py` (Add the cache table/model)
- `[NEW]` `/backend/app/routers/fortyguard.py`
- `[MODIFY]` `/backend/app/main.py` (Include new router)
- `[NEW]` `/backend/tests/test_fortyguard_api.py`

## Task Breakdown

### 1. Implement SQLite Cache Model
- **Agent:** `database-architect`
- **Skill:** `database-design`
- **INPUT:** Need to cache API responses.
- **OUTPUT:** Define `FortyGuardCache` SQLAlchemy model in `app/db.py` with columns `request_hash` (Primary Key), `response_json` (TEXT), and `created_at` (DateTime).
- **VERIFY:** Model initializes in SQLite without errors.

### 2. Create the Test-Scan Endpoint
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **INPUT:** `FortyGuardClient` and `FortyGuardCache`.
- **OUTPUT:** Implement `/api/fortyguard/test-scan` in `routers/fortyguard.py`. 
- **LOGIC:** 
  1. Default datetime to "yesterday at 14:00".
  2. Compute SHA-256 hash of the `HeatmapRequest`.
  3. Check cache. If hit (and `force_refresh=false`), return cached JSON.
  4. If miss, run `app.state.http_client` through `FortyGuardClient.run_heatmap()`.
  5. Save result to cache.
  6. Return payload including metadata (`mode: cached|live`, `duration_ms`).
- **VERIFY:** Router is registered in `main.py`.

### 3. Write Integration Tests
- **Agent:** `test-engineer`
- **Skill:** `testing-patterns`
- **INPUT:** The new router.
- **OUTPUT:** `test_fortyguard_api.py`.
- **VERIFY:** Tests verify that the first call is `mode: live` and the identical second call is `mode: cached`.

## Phase X: Verification (Mandatory Checklist)
- [ ] Ensure deterministic JSON serialization is used before hashing (sort_keys=True).
- [ ] Run `pytest backend/tests/test_fortyguard_api.py`.
- [ ] Verify `force_refresh` properly bypasses the cache.
- [ ] Socratic Gate was respected (Verified via `/grill-me`).
