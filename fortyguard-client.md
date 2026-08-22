# Step 10: FortyGuard Client (Submit + Async Polling)

## Overview
This plan implements the single, centralized FortyGuard client service. Since FortyGuard analysis is asynchronous (Submit -> Wait -> Poll -> Result), this client will encapsulate all of that logic, providing a clean `run_heatmap` convenience method for the rest of the application. It will use a shared `httpx.AsyncClient` for optimal connection pooling and output a standardized GeoJSON `FeatureCollection` for frontend rendering.

## Project Type
**BACKEND / API INTEGRATION**

## Success Criteria
- `FortyGuardClient` is implemented in `backend/app/services/fortyguard_client.py`.
- It supports `submit_heatmap`, `get_status`, and `poll_until_complete` using the Pydantic models from Step 9.
- A `normalize_heatmap_result` method standardizes the FortyGuard output into a pure GeoJSON `FeatureCollection`.
- The client uses a single, injected `httpx.AsyncClient` for connection pooling.
- Comprehensive structured logging is added (without leaking API keys).

## Tech Stack
- **FastAPI**: App lifecycle (for the injected `httpx.AsyncClient`).
- **httpx**: Async HTTP requests.
- **asyncio**: For polling delays (`asyncio.sleep`).
- **structlog**: For structured logging (already configured in Phase 1).

## File Structure
- `[NEW]` `/backend/app/services/fortyguard_client.py`
- `[MODIFY]` `/backend/app/main.py` (to initialize and inject the `httpx.AsyncClient` on startup/shutdown).
- `[NEW]` `/backend/tests/test_fortyguard_client.py`

## Task Breakdown

### 1. Configure Global AsyncClient in FastAPI
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **INPUT:** Need for connection pooling.
- **OUTPUT:** Modify `main.py` to open an `httpx.AsyncClient` on `@asynccontextmanager` lifespan startup, and close it on shutdown. Attach it to `app.state.http_client`.

### 2. Implement FortyGuardClient Core Methods
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **INPUT:** Pydantic models from Step 9.
- **OUTPUT:** `FortyGuardClient` class with `submit_heatmap` and `get_status`. These methods will strictly use `HeatmapRequest` and `StatusResponse` for types.
- **VERIFY:** Headers correctly include `api-key` without logging it.

### 3. Implement Async Polling & Normalization
- **Agent:** `backend-specialist`
- **Skill:** `python-patterns`
- **INPUT:** Core methods.
- **OUTPUT:** `poll_until_complete` (with backoff/timeout) and `normalize_heatmap_result` (ensuring the output is always a valid GeoJSON FeatureCollection). `run_heatmap` glues them together.
- **VERIFY:** Normalizer safely extracts `map_data`.

### 4. Write Unit Tests
- **Agent:** `test-engineer`
- **Skill:** `testing-patterns`
- **INPUT:** `FortyGuardClient`.
- **OUTPUT:** `test_fortyguard_client.py` using `pytest-asyncio` and a mock/respx to simulate FortyGuard API responses.
- **VERIFY:** Tests cover successful polling, timeouts, and API errors.

## Phase X: Verification (Mandatory Checklist)
- [ ] Ensure `httpx.AsyncClient` is properly closed on shutdown to prevent resource leaks.
- [ ] Verify logs do not contain the API key.
- [ ] Run `pytest backend/tests/test_fortyguard_client.py`.
- [ ] Socratic Gate was respected (Verified via `/grill-me`).
