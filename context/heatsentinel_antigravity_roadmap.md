# HEATSENTINEL AI — ANTIGRAVITY IMPLEMENTATION ROADMAP

**Role recap:** This document is the architect/prompt-engineering deliverable for HeatSentinel AI (FortyGuard Hackathon'26). It does not build the app — it gives you 67 sequential, copy-paste-ready prompts to run inside Antigravity, plus the architecture, stack rationale, critical path, optional-feature list, day-by-day mapping, and final acceptance checklist.

---

# PART 1 — ARCHITECTURE

```
Frontend (React + MapLibre)
   ↓ REST/JSON (+ polling)
Backend API (FastAPI)
   ↓
HeatSentinel Agent (LLM orchestrator, tool-calling)
   ↓
Tool Layer
   ├── FortyGuard Client        (heatmap, env_params, status polling)
   ├── Spatial Engine           (AOI tiling, 10 mi² cap, refinement)
   ├── Vulnerability Service    (Census/ACS joins)
   ├── Resource Service         (MAG Heat Relief Network, coverage/distance)
   ├── Analytics Engine         (tcm/persistence/exceedance/anomaly — deterministic)
   └── Recommendation Composer  (evidence → phrased action, no invented facts)
   ↓
Structured Metrics (per-zone JSON: heat + vulnerability + resources)
   ↓
Priority Engine (deterministic Response Gap formula + ranking)
   ↓
Command Center UI (map, priority panel, WHY panel, agent activity feed)
```

**Design principles enforced throughout the roadmap:**

1. **LLM = orchestrator, never calculator.** All heat math, vulnerability scoring, resource-gap math, and Response Gap math live in deterministic Python functions with unit tests. The agent calls tools and composes language from tool outputs; it never fabricates a number.
2. **FortyGuard client is a single service.** All async submit→poll→retrieve→normalize logic lives in one client module. No scattered polling.
3. **Area-limit-aware from day one.** The spatial engine tiles Phoenix into ≤10 mi² AOIs before any FortyGuard call is designed — this is not a retrofit.
4. **Evidence-first data model.** Every zone object carries a `sources` and `evidence` block from the moment it's created, so the WHY panel is never a UI afterthought.
5. **Fallback is a first-class mode, not a hack.** `mode: "live" | "cached" | "demo"` is threaded through the API response schema starting in Phase 1, so Phase 16 (Demo Mode) is wiring, not invention.
6. **Phoenix is the only fully-built city.** NYC gets a narrow, clearly-scoped validation module (Phase 7) — never a parallel app.

---

# PART 2 — TECHNOLOGY STACK

| Layer | Choice | Why (6-day MVP rationale) |
|---|---|---|
| Backend | **Python + FastAPI** | Async-native (matches FortyGuard's async workflow), fast to scaffold, automatic OpenAPI docs speed up frontend integration, strong geospatial ecosystem. |
| Geospatial | **Shapely + GeoPandas (or plain GeoJSON + Shapely if geopandas install risk is high)** | Polygon tiling, area calculation (mi²), centroid/refinement math — all needed for the 10 mi² constraint and AOI subdivision. |
| Numerical | **NumPy / pandas / SciPy** | Deterministic metric calculation, Pearson/Spearman correlation for NYC validation, normalization. |
| Async jobs | **Native `asyncio` + in-process job store (dict/SQLite), Redis only if time allows** | FortyGuard polling and Heat Hunt runs are naturally async; avoid standing up Redis/Celery infra unless Day 5-6 stability requires it. |
| Storage | **SQLite (file-based)** | Zero-ops persistence for cached FortyGuard responses, Census data, resource points, and Heat Hunt run history. PostgreSQL is explicitly NOT justified for a 6-day single-demo MVP. |
| Agent / LLM orchestration | **Anthropic API with tool use (function calling)** | Matches the "LLM = orchestrator" mandate; structured tool schemas keep the model from inventing measurements. |
| Frontend | **React + Vite + MapLibre GL JS** | MapLibre is open-source (no Mapbox token risk), performant for polygon/heat layers, well-documented for choropleth + marker overlays. |
| Frontend state | **React Query (server state) + lightweight context (UI state)** | Handles Heat Hunt job polling cleanly without a heavy Redux setup. |
| Styling | **Tailwind CSS** | Fast to build a "command center" dark UI without custom CSS overhead. |
| Testing | **pytest (backend), Vitest/RTL (frontend)** | Standard, fast, no exotic tooling needed for a hackathon timeline. |
| Deployment | **Single VM/container or Render/Railway-style PaaS for backend; Vercel/Netlify for frontend** | Minimize DevOps surface area; no Kubernetes, no microservices. |

No ML training, no vector DB, no message queue, no microservices — all excluded deliberately per project constraints.

---

# PART 3 — DEVELOPMENT ROADMAP

Every prompt below follows the mandated structure. Two standing instructions are embedded in **every** prompt automatically (restated per prompt per the rules):

> **Before editing:** Inspect the existing repository and understand the current implementation. Do not overwrite working code unnecessarily. Reuse existing architecture where appropriate.
> **After editing:** Run the relevant tests and verify the implementation. Fix errors before reporting completion.

FortyGuard-touching prompts additionally carry the FortyGuard special rule.

---

## [x] PHASE 0 — REPOSITORY DISCOVERY

### [x] STEP 1 — Repository & Environment Discovery

**PURPOSE:** Establish ground truth on repo state, stack, and environment before any implementation begins.

**DEPENDENCIES:** None.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel AI is an agentic hyperlocal heat-response intelligence system for the FortyGuard Hackathon'26. It uses FortyGuard's heat API plus Census/ACS vulnerability data and cooling-resource data to detect, investigate, correlate, prioritize, explain, and recommend heat-response action for Phoenix, AZ (primary) with NYC used only as a methodological validation check (not a second app). This is the very first setup step.

CURRENT STATE
Unknown. This may be an empty repository or a partially started project. Do not assume anything.

OBJECTIVE
Produce a factual discovery report of the current repository, toolchain, and environment so all future prompts can build on accurate ground truth.

TASKS
1. Inspect the repository root: list all files/directories, identify any existing README, package manifests, or config files.
2. Run `git status` and `git log --oneline -20` (if a git repo exists); report if it does not.
3. Detect installed toolchain versions: Python, pip, Node, npm, git.
4. Check for any existing backend or frontend code and summarize its structure/purpose in plain language — do not modify anything yet.
5. Check for a `.env` or `.env.example` file and report (without printing secret values) which variables are already defined.
6. Check whether any FortyGuard API key or Anthropic API key environment variables already exist (report only variable names present, never values).
7. Note available disk space and confirm outbound network access is available for package installation.

TECHNICAL CONSTRAINTS
- Do not create, delete, or modify any files in this step. This is read-only discovery.
- Never print or log secret values, only variable names.

FILES
None created or modified — discovery only.

VALIDATION
Confirm the discovery report is complete and covers: repo state, git state, toolchain versions, existing code structure (if any), and environment variable presence.

COMPLETION REPORT
Report: (1) full discovery findings as listed above, (2) whether this is a greenfield or existing project, (3) any risks or blockers identified, (4) recommended next step (should be Phase 1 foundation setup).
```

---

## [ ] PHASE 1 — FOUNDATION

### [ ] STEP 2 — Monorepo Structure & Tooling Baseline

**PURPOSE:** Create the backend/frontend skeleton and dependency baseline.

**DEPENDENCIES:** Step 1.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel AI: agentic hyperlocal heat-response intelligence for Phoenix, AZ, powered by FortyGuard's heat API, Census/ACS vulnerability data, and cooling-resource data, orchestrated by an LLM tool-calling agent. This step establishes the base repository structure.

CURRENT STATE
Repository discovery has been completed (previous step). No application code exists yet, or only minimal scaffolding exists — confirm actual current state by inspecting the repo before proceeding.

OBJECTIVE
Create a clean monorepo skeleton with a Python/FastAPI backend and a React/Vite frontend, ready for feature development.

TASKS
1. Inspect the existing repository structure first; reuse anything usable.
2. Create top-level structure:
   - `/backend` (FastAPI app, Python)
   - `/frontend` (React + Vite + TypeScript)
   - `/docs` (architecture and methodology notes)
   - top-level `README.md` describing HeatSentinel AI's purpose and structure
3. In `/backend`: initialize a Python virtual environment, create `requirements.txt` with: fastapi, uvicorn, pydantic, shapely, numpy, pandas, scipy, httpx, python-dotenv, pytest, pytest-asyncio.
4. In `/backend`, create a minimal FastAPI app (`app/main.py`) with a `/health` endpoint returning `{"status": "ok"}`.
5. In `/frontend`: scaffold a Vite + React + TypeScript app; install Tailwind CSS and MapLibre GL JS; install React Query.
6. Create a minimal home page in the frontend that fetches `/health` from the backend and displays the result, to prove end-to-end wiring.
7. Add a root `.gitignore` covering Python venvs, node_modules, `.env` files, and build artifacts.

TECHNICAL CONSTRAINTS
- Do not install any geospatial-heavy dependency beyond Shapely at this stage (defer GeoPandas decision to Phase 3 if genuinely needed).
- Do not add authentication, databases, or agent code yet — this step is structural only.
- Keep the backend and frontend independently runnable.

FILES
Create: `/backend/app/main.py`, `/backend/requirements.txt`, `/frontend/*` (Vite scaffold), `/README.md`, `/.gitignore`, `/docs/architecture.md` (brief placeholder).

VALIDATION
- Run the backend (`uvicorn app.main:app --reload`) and confirm `/health` returns 200.
- Run the frontend dev server and confirm the health check renders in the browser/dev console.
- Run `pytest` (even with zero tests) to confirm the test runner is wired correctly.

COMPLETION REPORT
Report: files changed, commands run, whether backend/frontend both start cleanly, whether the frontend successfully calls `/health`, any dependency install issues, and confirm next step (env/secrets configuration) is unblocked.
```

### [ ] STEP 3 — Environment Configuration & Secrets Handling

**PURPOSE:** Set up `.env`-based configuration for FortyGuard and Anthropic keys, safely.

**DEPENDENCIES:** Step 2.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel AI requires a FortyGuard API key and an Anthropic API key. These must never be committed to the repository or logged in plaintext.

CURRENT STATE
Backend/frontend skeleton exists from the previous step. No environment/config module exists yet.

OBJECTIVE
Create a centralized, typed configuration module for the backend that loads secrets from environment variables, plus a documented `.env.example`.

TASKS
1. Inspect the existing backend structure before adding anything.
2. Create `/backend/app/config.py` using Pydantic Settings (or a lightweight equivalent) exposing: `FORTYGUARD_API_KEY`, `FORTYGUARD_BASE_URL` (default `https://api.fortyguard.com`), `ANTHROPIC_API_KEY`, `ENVIRONMENT` (dev/prod), `APP_MODE` (live/demo — default live), and a `DATABASE_URL` for SQLite (e.g. `sqlite:///./heatsentinel.db`).
3. Create `/backend/.env.example` listing all required variable names with placeholder (non-real) values and comments explaining each.
4. Ensure `.env` is gitignored (confirm from Step 2) and that `.env.example` is NOT gitignored.
5. Wire `config.py` into `main.py` so the app fails fast with a clear error message if `FORTYGUARD_API_KEY` or `ANTHROPIC_API_KEY` is missing at startup in non-demo mode, but does NOT crash in `APP_MODE=demo`.
6. Add a `/config/status` debug endpoint (dev-only) that reports which config variables are SET or MISSING — booleans only, never values.

TECHNICAL CONSTRAINTS
- Never print, log, or return actual secret values anywhere in the codebase.
- Do not hardcode any API key anywhere.
- Keep this module dependency-free of the FortyGuard client itself (config should not import the client, only the reverse).

FILES
Create: `/backend/app/config.py`, `/backend/.env.example`. Modify: `/backend/app/main.py`.

VALIDATION
- Start the backend without a `.env` file present in demo mode — confirm it starts.
- Start the backend with a fake `.env` containing dummy keys in live mode — confirm config loads without error.
- Hit `/config/status` and confirm only booleans are returned, never actual values.

COMPLETION REPORT
Report: files changed, exact env var names defined, test/validation results, confirmation that no secret leakage exists in logs or responses, and next dependency (logging setup).
```

### [ ] STEP 4 — Structured Logging & Error Handling Baseline

**PURPOSE:** Establish consistent logging/error conventions used by every later service.

**DEPENDENCIES:** Step 3.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel AI will make many external calls (FortyGuard, Census, Anthropic) and run multi-step agent workflows. Consistent structured logging and error handling are required from the start so later debugging (especially FortyGuard's async polling) is tractable.

CURRENT STATE
Config module exists from the previous step. No logging or error-handling conventions exist yet.

OBJECTIVE
Add a structured logging setup and a small set of shared exception classes used across the backend.

TASKS
1. Inspect current backend structure before adding code.
2. Create `/backend/app/logging_config.py` configuring Python's `logging` module with a consistent format (timestamp, level, module, message), writing to stdout, with level controlled by `ENVIRONMENT` (DEBUG in dev, INFO in prod).
3. Ensure the logging setup NEVER logs raw request/response bodies that could contain API keys; add a redaction helper for headers.
4. Create `/backend/app/errors.py` defining: `HeatSentinelError` (base), `ExternalAPIError` (for FortyGuard/Census failures), `DataUnavailableError`, and `ConfigurationError`. Each should carry a machine-readable `code` and human-readable `message`.
5. Add a FastAPI exception handler in `main.py` that catches `HeatSentinelError` subclasses and returns a consistent JSON error shape: `{"error": {"code": ..., "message": ...}}`.
6. Wire logging initialization into app startup.

TECHNICAL CONSTRAINTS
- No third-party logging services (no Sentry/Datadog) — stdout structured logs only, per 6-day scope.
- Error responses must never leak stack traces or secret values to the client in non-dev environments.

FILES
Create: `/backend/app/logging_config.py`, `/backend/app/errors.py`. Modify: `/backend/app/main.py`.

VALIDATION
- Trigger a manual `HeatSentinelError` from a temporary test route and confirm the JSON error shape and log output are correct, then remove the temporary route.
- Run `pytest` to confirm nothing is broken.

COMPLETION REPORT
Report: files changed, sample of log output format, confirmation error responses don't leak secrets/stack traces, and next dependency (backend app skeleton / router structure).
```

### [ ] STEP 5 — Backend Application Structure (Routers, Services, Models)

**PURPOSE:** Establish the modular backend package layout the rest of the roadmap will fill in.

**DEPENDENCIES:** Step 4.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel AI's backend architecture is: API routers → services (FortyGuard, Spatial, Vulnerability, Resources, Analytics, Priority, Agent) → shared Pydantic models. This step creates the empty but correctly organized package structure so every later phase has an obvious home.

CURRENT STATE
Config, logging, and error handling exist. No routers or service layer exist yet.

OBJECTIVE
Create the full backend package skeleton with empty-but-importable modules, wired into `main.py`, with no business logic yet.

TASKS
1. Inspect current backend structure before adding anything; do not duplicate existing modules.
2. Create package structure:
   - `/backend/app/models/` (Pydantic models: `zone.py`, `aoi.py`, `fortyguard.py`, `vulnerability.py`, `resources.py`, `response_gap.py` — each with placeholder/minimal models to be filled later)
   - `/backend/app/services/` (`fortyguard_client.py`, `spatial_engine.py`, `vulnerability_service.py`, `resource_service.py`, `analytics_engine.py`, `priority_engine.py`, `recommendation_service.py` — each with a docstring describing its future responsibility and no logic yet)
   - `/backend/app/agent/` (`tools.py`, `orchestrator.py` — stubs with docstrings)
   - `/backend/app/routers/` (`health.py` — move existing health check here, `heat_hunt.py` — stub router with no routes yet)
   - `/backend/app/db.py` (SQLite connection helper using `sqlite3` or SQLAlchemy — your choice, document which and why)
3. Wire the health router into `main.py` via `APIRouter` include, removing the inline health route.
4. Add a `/backend/tests/` directory mirroring the service structure with one placeholder test per service module confirming it imports without error.

TECHNICAL CONSTRAINTS
- No business logic in this step — structure only, each new module should be import-safe and mostly docstrings/pass statements.
- Do not choose GeoPandas yet — defer to Phase 3 where AOI math actually needs it.

FILES
Create the full structure above.

VALIDATION
- Run `pytest` and confirm all placeholder import tests pass.
- Start the backend and confirm `/health` still works via the new router.

COMPLETION REPORT
Report: full file tree created, test results, confirmation `/health` still works, and next dependency (frontend app shell / command center layout skeleton).
```

### [x] STEP 6 — Frontend Application Shell (Command Center Layout Skeleton)

**PURPOSE:** Lay out the five UI regions (header, map, priority panel, WHY panel, agent activity panel) as empty containers.

**DEPENDENCIES:** Step 2.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel AI's UI concept is a "City Heat Command Center" with five regions: header (zone counts + Heat Hunt status), main map, priority panel, WHY panel, and agent activity panel. This step creates the layout shell with no real data yet.

CURRENT STATE
Frontend Vite/React/Tailwind/MapLibre scaffold exists from Step 2. No command-center layout exists yet.

OBJECTIVE
Build the static layout shell for the Command Center with placeholder content in each region, using a dark, high-density "command center" visual direction.

TASKS
1. Inspect the current frontend structure before adding anything.
2. Create a `CommandCenter` layout component composed of five subcomponents: `Header`, `HeatMap`, `PriorityPanel`, `WhyPanel`, `AgentActivityPanel` — each in its own file under `/frontend/src/components/`.
3. `Header`: static placeholders for Critical/High/Moderate/Low zone counts and a "RUN HEAT HUNT" button (non-functional for now).
4. `HeatMap`: render a MapLibre map centered on Phoenix, AZ (approx. lat 33.4484, lon -112.0740), zoom ~10, using a free/open basemap style (e.g., OpenStreetMap raster or MapLibre demo style) — no data layers yet.
5. `PriorityPanel`, `WhyPanel`, `AgentActivityPanel`: static placeholder cards with representative mock content matching the format shown in the HeatSentinel spec (zone id, temp, persistence, anomaly, elderly %, tree cover %, cooling resources, Response Gap score, recommended action).
6. Apply Tailwind for a dark command-center aesthetic (dark background, high-contrast accent colors for CRITICAL/HIGH/MODERATE/LOW).
7. Make the layout responsive at a basic level (usable at typical laptop widths; mobile polish deferred to Phase 17).

TECHNICAL CONSTRAINTS
- No backend calls yet — this is a static shell with mock/placeholder data only.
- Do not wire the "RUN HEAT HUNT" button to any logic yet.
- Do not use any paid map tile provider requiring a token.

FILES
Create: `/frontend/src/components/CommandCenter.tsx`, `Header.tsx`, `HeatMap.tsx`, `PriorityPanel.tsx`, `WhyPanel.tsx`, `AgentActivityPanel.tsx`.

VALIDATION
Run the frontend dev server, confirm all five regions render with placeholder content and the Phoenix map loads visually.

COMPLETION REPORT
Report: files created, screenshot description of the resulting layout, confirmation the map renders centered on Phoenix, and next dependency (FortyGuard client — the first real data integration).
```

---

## [ ] PHASE 2 — FORTYGUARD INTEGRATION

### [ ] STEP 7 — FortyGuard API Access Verification

**PURPOSE:** Confirm the hackathon API key actually works before building the client.

**DEPENDENCIES:** Step 3.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel AI depends entirely on the FortyGuard API (base URL https://api.fortyguard.com). Use the verified FortyGuard API specification in the project context. Do not invent endpoints, parameters, response fields, or capabilities. Verified endpoints are: POST /v1/system/fetch-api-key-custom-usage, POST /v1/heatmap, POST /v1/env_params, POST /v1/satellite, POST /v1/streetview, POST /v1/heat_intelligence, GET /v1/status/{activity_id}. This is a U.S.-only, Phoenix-primary, NYC-secondary project with no forecast capability, a 10 mi² Basic-tier area cap per heatmap call, 60/80/100m granularity, and an async activity_id submit→poll→retrieve workflow.

CURRENT STATE
Config module exists and can load `FORTYGUARD_API_KEY` and `FORTYGUARD_BASE_URL`. No FortyGuard calls have been made yet.

OBJECTIVE
Make one real, minimal call to FortyGuard to confirm the API key works and understand actual response shape, without yet building the full client abstraction.

TASKS
1. Inspect the existing config and service skeleton before adding code.
2. Write a small standalone script `/backend/scripts/verify_fortyguard.py` that: calls `POST /v1/system/fetch-api-key-custom-usage` to confirm the key is valid and report usage/quota if returned.
3. In the same script, submit one minimal `POST /v1/heatmap` request for a small (~1 mi²) test polygon over central Phoenix (approx bounding box around 33.44–33.46 lat, -112.09 to -112.06 lon — confirm coordinates are [longitude, latitude] order), with `analytic_type=tcm`, a recent `start_date`/`start_time`, `granularity=60m`, `filter_type` set to the simplest valid documented value.
4. Poll `GET /v1/status/{activity_id}` until the job completes or a reasonable timeout (e.g., 2 minutes) is reached, printing status transitions.
5. On completion, print (not commit) a small sample of the raw response structure so we can see actual field names.
6. Save the raw sample response (with any sensitive fields stripped) into `/backend/tests/fixtures/fortyguard_heatmap_sample.json` for later use as a test fixture.

TECHNICAL CONSTRAINTS
- Do not invent request/response fields — use only what the API specification and actual live response confirm.
- Do not hardcode the API key; load it from config.
- If the call fails, report the exact error/status code rather than guessing at a fix.
- Coordinates must be validated as [longitude, latitude].

FILES
Create: `/backend/scripts/verify_fortyguard.py`, `/backend/tests/fixtures/fortyguard_heatmap_sample.json`.

VALIDATION
Run the script against the live API and report: whether the key is valid, whether the heatmap submission succeeded, the activity_id, how long polling took, and the actual response field names observed.

COMPLETION REPORT
Report exactly what worked, what didn't, the real response schema observed (field names/types), any discrepancies from the assumed spec, and confirm whether Phoenix is confirmed to have usable data coverage at this location. Flag any blockers before proceeding to client abstraction.
```

### [ ] STEP 8 — Phoenix Target Area & Demo Sub-Area Selection

**PURPOSE:** Lock the exact Phoenix polygon(s) used for the live demo.

**DEPENDENCIES:** Step 7.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Phoenix, AZ is the primary implementation and live-demo city for HeatSentinel AI. FortyGuard's Basic tier caps heatmap requests at 10 mi² per call, so the full metro area cannot be queried at once. We need a documented, defensible target area for the demo.

CURRENT STATE
FortyGuard access has been verified against a small test polygon (previous step) with confirmed data coverage.

OBJECTIVE
Define and document the official Phoenix "target area" polygon (a demo-appropriate district, e.g. central/downtown/south Phoenix — a real neighborhood known for heat vulnerability) that will be used throughout the rest of the project, sized to be tileable into multiple ≤10 mi² AOIs.

TASKS
1. Inspect any existing spatial config or data already in the repo.
2. Research (using publicly available boundary references) a Phoenix sub-area of roughly 20–40 mi² that is demo-appropriate: dense urban core with known heat/vulnerability contrast (e.g., a downtown + south Phoenix corridor). Do not fabricate boundary coordinates — derive them from a real, describable bounding region and document the source/reasoning.
3. Create `/backend/app/data/phoenix_target_area.geojson` containing the target area as a single Polygon/MultiPolygon feature in [longitude, latitude] order, with properties: `name`, `city`, `state`, `area_mi2` (approximate, computed), `source_note` (how this boundary was chosen).
4. Write a small utility (can live in `spatial_engine.py`) to compute polygon area in square miles from GeoJSON using Shapely with an appropriate projection (do not use naive lat/lon degree math for area).
5. Confirm the target area's computed area is realistic and documented.
6. Update `/docs/architecture.md` with a short "Phoenix Target Area" section explaining the choice and the 10 mi² tiling implication.

TECHNICAL CONSTRAINTS
- Coordinates must be [longitude, latitude].
- Do not claim FortyGuard coverage for this area beyond what was actually verified in Step 7 — note in docs that full-area coverage will be confirmed empirically once tiled scanning is built (Phase 3).
- Do not select the entire Phoenix metro area as the "target area" — must be demo-scale.

FILES
Create: `/backend/app/data/phoenix_target_area.geojson`. Modify: `/backend/app/services/spatial_engine.py`, `/docs/architecture.md`.

VALIDATION
Run a script/test that loads the GeoJSON, computes its area in mi², and confirms it falls in the intended ~20–40 mi² range.

COMPLETION REPORT
Report: chosen area name/boundary reasoning, computed area in mi², confirmation it's tileable into multiple ≤10 mi² AOIs, files created, and next dependency (FortyGuard request/response models).
```

### [ ] STEP 9 — FortyGuard Request/Response Pydantic Models

**PURPOSE:** Formalize typed models based on the real observed schema from Step 7.

**DEPENDENCIES:** Step 7.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Use the verified FortyGuard API specification in the project context. Do not invent endpoints, parameters, response fields, or capabilities. This step formalizes typed models for `/v1/heatmap` requests and responses, and `/v1/status/{activity_id}` polling, based on the real response sample captured in Step 7.

CURRENT STATE
A real sample FortyGuard heatmap response exists at `/backend/tests/fixtures/fortyguard_heatmap_sample.json`. The `models/fortyguard.py` module exists as a stub.

OBJECTIVE
Define Pydantic request/response models matching FortyGuard's actual heatmap and status endpoints.

TASKS
1. Inspect the fixture file and the stub model file before writing anything.
2. In `/backend/app/models/fortyguard.py`, define:
   - `HeatmapRequest`: `polygon_aoi` (GeoJSON geometry, [lon, lat]), `start_date`, `start_time`, optional `end_date`, `filter_type`, `granularity` (enum: 60m/80m/100m), `analytic_type` (enum: tcm/time_of_measure/exceedance/persistence), optional `threshold`, optional `direction` (required together when analytic_type is exceedance/persistence).
   - `HeatmapSubmitResponse`: whatever field actually carries the `activity_id` per the real observed response (name it exactly as observed, not guessed).
   - `StatusResponse`: status enum/string (e.g., pending/processing/completed/failed — using actual observed values), and the completed-result payload field(s), matching the fixture exactly.
   - Add a validator on `HeatmapRequest` that raises `ConfigurationError` if `analytic_type` is `exceedance` or `persistence` and `threshold`/`direction` are missing.
   - Add a validator confirming polygon coordinates are plausibly [longitude, latitude] for a U.S. location (longitude should be strongly negative for CONUS; raise a clear validation error otherwise) to catch accidental lat/lon swaps.
3. Write unit tests in `/backend/tests/test_fortyguard_models.py` that load the fixture and confirm it parses into `StatusResponse` (or equivalent) without error, and that the coordinate-order validator correctly rejects a swapped-order example.

TECHNICAL CONSTRAINTS
- Every field name must be traceable to either the official spec in project context or the real fixture — do not invent fields.
- Do not implement the actual HTTP client in this step — models only.

FILES
Modify: `/backend/app/models/fortyguard.py`. Create: `/backend/tests/test_fortyguard_models.py`.

VALIDATION
Run `pytest` and confirm all new tests pass, including the coordinate-order validator test (both a valid and an intentionally-swapped example).

COMPLETION REPORT
Report: models defined, field names and their source (spec vs. observed fixture), test results, and next dependency (FortyGuard client with async polling).
```

### [ ] STEP 10 — FortyGuard Client: Submit + Async Polling

**PURPOSE:** Build the single, centralized FortyGuard client service.

**DEPENDENCIES:** Step 9.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Use the verified FortyGuard API specification in the project context. Do not invent endpoints, parameters, response fields, or capabilities. FortyGuard analysis is asynchronous: submit → activity_id → poll GET /v1/status/{activity_id} → completed → structured result → normalize. All of this logic must live in one dedicated client module — never scattered across the app.

CURRENT STATE
Typed request/response models exist (`models/fortyguard.py`). The `services/fortyguard_client.py` module exists as a stub with config access available.

OBJECTIVE
Implement a complete, reusable async FortyGuard client with submit, poll-until-complete, and normalize responsibilities.

TASKS
1. Inspect the existing stub and models before writing implementation.
2. In `fortyguard_client.py`, implement an `httpx.AsyncClient`-based `FortyGuardClient` class with methods:
   - `async def submit_heatmap(request: HeatmapRequest) -> str` (returns activity_id), calling `POST /v1/heatmap` with the API key attached per the spec's authentication method.
   - `async def get_status(activity_id: str) -> StatusResponse`, calling `GET /v1/status/{activity_id}`.
   - `async def poll_until_complete(activity_id: str, timeout_seconds: int = 120, interval_seconds: float = 2.0) -> StatusResponse`, polling with backoff, raising `ExternalAPIError` on timeout or failed status.
   - `async def run_heatmap(request: HeatmapRequest) -> dict` — convenience method combining submit + poll + returning the normalized completed result.
3. Add a `normalize_heatmap_result(raw: StatusResponse) -> dict` function producing a stable internal shape (e.g., list of tile/cell readings with lon/lat/temperature/analytic values) independent of FortyGuard's exact field names, so the rest of the app never touches raw FortyGuard fields directly.
4. Add structured logging (using the Phase 1 logging setup) at each stage: submit, each poll attempt (debug level), completion, failure — never logging the API key.
5. Add retry logic (e.g., up to 2 retries with backoff) for transient network errors on submit and status calls, but not for confirmed `failed` job statuses.
6. Write integration tests using the real fixture (mocked HTTP layer, not live calls) confirming submit→poll→normalize works end-to-end, plus a timeout-path test and a failed-status-path test.

TECHNICAL CONSTRAINTS
- All FortyGuard HTTP calls must live only in this module.
- Never call FortyGuard endpoints directly from routers or the agent layer — always through this client.
- Respect the 10 mi² area cap by validating polygon area (mi²) before submission and raising `ConfigurationError` if exceeded — do not silently truncate the polygon.

FILES
Modify: `/backend/app/services/fortyguard_client.py`. Create: `/backend/tests/test_fortyguard_client.py`.

VALIDATION
Run `pytest` for the new client tests (mocked). Then re-run `/backend/scripts/verify_fortyguard.py` (Step 7) but refactored to use this new client, confirming it still works against the live API end-to-end.

COMPLETION REPORT
Report: methods implemented, test results (mocked and live), confirmation the 10 mi² validation works, confirmation no scattered FortyGuard calls exist elsewhere in the codebase, and next dependency (heatmap visualization on the map).
```

### [ ] STEP 11 — First Real FortyGuard Call Wired to Backend API

**PURPOSE:** Expose a real backend endpoint that triggers a FortyGuard call for one AOI.

**DEPENDENCIES:** Step 10, Step 8.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Use the verified FortyGuard API specification in the project context. This step exposes the FortyGuard client through a real backend API endpoint using the confirmed Phoenix target area, so the frontend can eventually display real heat data.

CURRENT STATE
`FortyGuardClient` is implemented and tested (mocked + live script). The Phoenix target area GeoJSON exists (Step 8). No backend API route calls FortyGuard yet.

OBJECTIVE
Add a `POST /api/fortyguard/test-scan` endpoint that runs one real FortyGuard heatmap request against a single AOI derived from the Phoenix target area, returning the normalized result.

TASKS
1. Inspect existing routers and the client before adding code.
2. In `/backend/app/routers/`, create `fortyguard.py` with `POST /api/fortyguard/test-scan` accepting an optional AOI override (default: a single sub-polygon within the Phoenix target area that is confirmed ≤10 mi²), analytic_type (default `tcm`), granularity (default `60m`).
3. Wire the route to call `FortyGuardClient.run_heatmap(...)` and return the normalized result plus metadata: `mode: "live"`, `activity_id`, `duration_ms`, `cell_count`.
4. Cache the normalized result in SQLite (table `fortyguard_cache`, keyed by request hash) so repeated identical requests during development/demo don't re-hit the API unnecessarily. Add a `force_refresh` query param to bypass cache.
5. Register the router in `main.py`.
6. Write an integration test that mocks the client and confirms the endpoint returns the expected shape and caching behavior.

TECHNICAL CONSTRAINTS
- This endpoint is for internal/dev verification, not the final Heat Hunt endpoint (that comes in Phase 10) — keep it simple.
- Must reuse `FortyGuardClient`, not reimplement any HTTP logic.
- Cache must be clearly distinguishable from live results (`mode` field, `cached_at` timestamp when served from cache).

FILES
Create: `/backend/app/routers/fortyguard.py`. Modify: `/backend/app/main.py`, `/backend/app/db.py` (cache table). Create: `/backend/tests/test_fortyguard_router.py`.

VALIDATION
- Run backend, call the endpoint via curl/HTTPie against the live API once, confirm a real result with `mode: "live"`.
- Call again and confirm the second call returns from cache with `mode` reflecting cache origin.
- Run `pytest`.

COMPLETION REPORT
Report: endpoint behavior confirmed live, caching confirmed working, response shape, test results, and next dependency (map visualization of this data on the frontend).
```

### [ ] STEP 12 — Heat Layer Visualization on the Map

**PURPOSE:** Render real FortyGuard heat data on the Command Center map.

**DEPENDENCIES:** Step 11, Step 6.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel's Command Center map must show a real FortyGuard temperature layer over Phoenix. This is the first point where real backend data reaches the frontend.

CURRENT STATE
The `HeatMap` component renders a static Phoenix-centered MapLibre map (Step 6). The backend `/api/fortyguard/test-scan` endpoint returns real normalized heat data (Step 11).

OBJECTIVE
Fetch the test-scan result from the frontend and render it as a heat layer (choropleth grid or heatmap layer) on the map.

TASKS
1. Inspect the existing `HeatMap` component and backend response shape before writing code.
2. Add a typed API client function in `/frontend/src/api/fortyguard.ts` calling `POST /api/fortyguard/test-scan` via React Query.
3. Extend `HeatMap` to render the returned cells as a MapLibre GeoJSON source + layer, colored by temperature using a clear, accessible color ramp (cool blue → hot red), with a legend.
4. Add a small loading state while the request is in flight and an error state if it fails (do not silently swallow errors).
5. Add a `mode` badge on the map (e.g., small pill reading "LIVE DATA" or "CACHED") sourced from the backend response's `mode` field.
6. Add a temporary "Load Heat Data" button in the header to trigger the fetch (this will later be replaced by the real Heat Hunt flow in Phase 9).

TECHNICAL CONSTRAINTS
- Do not fabricate any color/value if data is missing for a cell — leave it visually absent rather than inventing a value.
- Coordinate order must be respected exactly as returned by the backend (already normalized to [lon, lat] internally).

FILES
Create: `/frontend/src/api/fortyguard.ts`. Modify: `/frontend/src/components/HeatMap.tsx`, `Header.tsx`.

VALIDATION
Run both servers, click "Load Heat Data," and visually confirm a heat layer renders over the correct Phoenix location with a legend and a mode badge.

COMPLETION REPORT
Report: files changed, confirmation of visual rendering (describe what you see), confirmation the mode badge reflects live vs cached correctly, and next dependency (spatial engine / AOI tiling for the full target area).
```

---

## [ ] PHASE 3 — SPATIAL ENGINE

### [ ] STEP 13 — AOI Tiling Engine (10 mi² Constraint)

**PURPOSE:** Build the core tiling algorithm that divides the Phoenix target area into ≤10 mi² AOIs.

**DEPENDENCIES:** Step 8, Step 10.

**ANTIGRAVITY PROMPT**
```
CONTEXT
FortyGuard's Basic tier caps heatmap requests at 10 mi² per call. HeatSentinel must tile the Phoenix target area into multiple manageable AOIs rather than sending one massive request. This is a foundational spatial capability used by every later phase (scanning, hotspot detection, refinement).

CURRENT STATE
The Phoenix target area GeoJSON exists (Step 8) with a computed area utility in `spatial_engine.py`. No tiling logic exists yet.

OBJECTIVE
Implement a deterministic grid-tiling function that divides any input polygon into a set of sub-polygons each guaranteed to be at or below 10 mi², with reasonable overlap/boundary handling.

TASKS
1. Inspect the existing `spatial_engine.py` and area-calculation utility before adding code.
2. Implement `tile_polygon(polygon: GeoJSON, max_area_mi2: float = 10.0, target_tile_count_hint: int | None = None) -> list[GeoJSON]` using a regular grid approach (e.g., project to an equal-area CRS, compute grid cell size that keeps each cell safely under the cap with margin, clip grid cells to the input polygon boundary, discard slivers below a minimum area threshold).
3. Ensure every output tile's computed area is verified ≤10 mi² (add an assertion/guard that raises `ConfigurationError` if any tile exceeds the cap — this must never silently pass).
4. Add a `tile_id` to each output tile (deterministic, e.g., row/col index) and preserve traceability back to the parent target area.
5. Add a `describe_tiling(tiles) -> dict` helper returning summary stats: tile count, min/max/avg area, total area covered.
6. Write unit tests covering: the real Phoenix target area (expect a reasonable tile count, e.g., 3–6 tiles for a 20–40 mi² area), a small polygon that shouldn't need tiling (single tile returned), and a guard test confirming no tile ever exceeds 10 mi².

TECHNICAL CONSTRAINTS
- Must use a proper equal-area projection for area math, not naive degree-based bounding boxes.
- Do not silently drop coverage — document any uncovered sliver area in the summary stats.
- Coordinates in/out must remain [longitude, latitude].

FILES
Modify: `/backend/app/services/spatial_engine.py`. Create: `/backend/tests/test_spatial_engine_tiling.py`.

VALIDATION
Run `pytest`, and additionally run a small script that tiles the real Phoenix target area and prints tile count + area stats to sanity-check against the ~20–40 mi² total.

COMPLETION REPORT
Report: tiling algorithm summary, real tile count/stats for Phoenix target area, test results, and next dependency (multi-AOI scan orchestration).
```

### [ ] STEP 14 — Multi-AOI Scan Orchestration

**PURPOSE:** Run FortyGuard across all tiles of the target area and combine results.

**DEPENDENCIES:** Step 13, Step 10.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Use the verified FortyGuard API specification in the project context. With AOI tiling available, HeatSentinel must now run FortyGuard heatmap requests across all tiles of the Phoenix target area and combine them into one unified dataset, respecting the async submit/poll workflow for each tile.

CURRENT STATE
`tile_polygon` exists and is tested (Step 13). `FortyGuardClient.run_heatmap` exists and is tested (Step 10).

OBJECTIVE
Implement a scan orchestration function that tiles the target area, submits FortyGuard requests concurrently (respecting reasonable concurrency limits), and merges results into one combined dataset with per-tile provenance.

TASKS
1. Inspect existing spatial engine and FortyGuard client before writing code.
2. In a new `services/scan_service.py`, implement `async def scan_area(polygon: GeoJSON, analytic_type: str, granularity: str, start_date, start_time, threshold=None, direction=None, max_concurrency: int = 3) -> dict` that: tiles the polygon via `tile_polygon`, submits FortyGuard requests for each tile using `asyncio.Semaphore`-bounded concurrency, polls each to completion, merges normalized cell results into one combined list tagged with `tile_id`, and returns summary stats (tile count, total cells, duration, any tile-level failures).
3. Handle partial failure gracefully: if one tile's FortyGuard call fails, log it, mark it in the summary as `failed_tiles`, and continue combining the successful tiles rather than failing the entire scan.
4. Add caching per-tile (reuse the Step 11 cache table, keyed by tile polygon + params) so re-running a scan during development doesn't always hit live API.
5. Write tests (mocked FortyGuard client) covering: full success across multiple tiles, one tile failing while others succeed, and cache hit behavior.

TECHNICAL CONSTRAINTS
- Concurrency must be bounded (do not fire unlimited simultaneous requests).
- Must reuse `FortyGuardClient` and `tile_polygon` — no duplicated logic.
- Never present a partially-failed scan as fully successful; the returned summary must make partial coverage explicit.

FILES
Create: `/backend/app/services/scan_service.py`, `/backend/tests/test_scan_service.py`.

VALIDATION
Run `pytest` (mocked). Then run a real scan against the Phoenix target area via a temporary script/endpoint and confirm multi-tile live results merge correctly, reporting actual duration.

COMPLETION REPORT
Report: scan orchestration behavior, real Phoenix scan results (tile count, cell count, duration, any failures), test results, and next dependency (hotspot detection).
```

### [ ] STEP 15 — Hotspot Detection

**PURPOSE:** Identify candidate high-interest zones from the combined scan.

**DEPENDENCIES:** Step 14.

**ANTIGRAVITY PROMPT**
```
CONTEXT
After a multi-AOI FortyGuard scan, HeatSentinel must identify hotspots — areas of elevated temperature/exceedance worth deeper investigation — before the agent selects targets for refinement.

CURRENT STATE
`scan_area` produces a combined dataset of cell-level readings across the Phoenix target area (Step 14). No hotspot detection exists yet.

OBJECTIVE
Implement a deterministic hotspot detection function that clusters/ranks scanned cells into candidate hotspot zones.

TASKS
1. Inspect the scan output structure before writing code.
2. In `spatial_engine.py` (or a new `hotspot_service.py` if cleaner), implement `detect_hotspots(scan_result: dict, top_n: int = 10, min_cell_temp_percentile: float = 0.8) -> list[dict]` that: filters cells above a statistically-derived threshold (e.g., top 20th percentile of temperature/exceedance within this scan — document this as a project analytical choice, not an official standard), spatially clusters adjacent/nearby hot cells into candidate hotspot polygons (simple approach: grid-adjacency clustering or DBSCAN using cell centroids is acceptable), and returns up to `top_n` hotspot candidates each with: `hotspot_id`, bounding polygon, mean/max temperature, cell count, source tile_ids.
3. Ensure hotspot polygons stay within tile boundaries already covered by the scan (no fabricated coverage).
4. Add unit tests using a synthetic scan_result fixture with a clear injected hot cluster, confirming it's correctly detected and ranked first.

TECHNICAL CONSTRAINTS
- The percentile/threshold approach must be documented in `/docs/architecture.md` as a project-derived analytical choice, not a public-health standard.
- Do not detect hotspots from data that wasn't actually returned by FortyGuard (no interpolation across scan gaps at this stage).

FILES
Modify or create `spatial_engine.py`/`hotspot_service.py`. Create: `/backend/tests/test_hotspot_detection.py`. Modify: `/docs/architecture.md`.

VALIDATION
Run `pytest` with the synthetic fixture, then run hotspot detection against the real Phoenix scan result from Step 14 and report actual detected hotspots.

COMPLETION REPORT
Report: detection algorithm summary, threshold/clustering choices and rationale, real Phoenix hotspot results, test results, and next dependency (polygon refinement for selected hotspots).
```

### [ ] STEP 16 — Hotspot Polygon Refinement

**PURPOSE:** Allow the agent to "zoom in" on a selected hotspot with a smaller, more precise AOI.

**DEPENDENCIES:** Step 15, Step 13.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Use the verified FortyGuard API specification in the project context. FortyGuard's finest native granularity is 60m — refinement must never claim to generate thermal measurements finer than that. Refinement means: take a selected hotspot's bounding polygon, tighten it (e.g., shrink to the actual hot-cell extent plus a small buffer), and prepare it for a focused re-query at the finest available granularity, respecting the 10 mi² cap (which will not be a concern at hotspot scale, but must still be validated).

CURRENT STATE
`detect_hotspots` returns candidate hotspot polygons (Step 15). No refinement logic exists yet.

OBJECTIVE
Implement `refine_hotspot(hotspot: dict, buffer_meters: float = 100.0) -> GeoJSON` that produces a tightened polygon suitable for a focused, high-granularity FortyGuard re-query.

TASKS
1. Inspect the hotspot detection output before writing code.
2. In `spatial_engine.py`, implement `refine_hotspot(hotspot: dict, buffer_meters: float = 100.0) -> dict` that: computes the minimal bounding polygon (e.g., convex hull or tight bounding box) around the hotspot's actual hot cells, applies a small buffer in meters (projected correctly, not naive degrees) for context margin, validates the refined area is ≤10 mi² (log a warning and cap via `tile_polygon` if somehow not, though this should be rare at hotspot scale), and returns the refined polygon plus metadata noting the source hotspot_id and applied buffer.
3. Add an explicit code comment and docstring clarifying that refinement improves polygon targeting/aggregation but does NOT create thermal resolution finer than FortyGuard's 60m tile floor — this should also be reflected in any user-facing text this function's metadata might later feed.
4. Write unit tests: a normal hotspot refines to a smaller polygon fully contained within (or minimally exceeding via buffer) the original; an edge-case hotspot near the 10 mi² boundary is correctly capped.

TECHNICAL CONSTRAINTS
- Never claim or imply sub-60m thermal measurement in code comments, docstrings, or metadata fields.
- Refined polygon must remain within/near the original target area — no drift to unrelated locations.

FILES
Modify: `/backend/app/services/spatial_engine.py`. Create/modify: `/backend/tests/test_hotspot_refinement.py`.

VALIDATION
Run `pytest`. Run refinement against a real detected hotspot from Step 15's Phoenix results and report the resulting refined polygon's area and shape.

COMPLETION REPORT
Report: refinement logic summary, real refined-polygon result, test results, explicit confirmation that no false resolution claims exist in code/docs, and next dependency (re-querying FortyGuard at refined scale — this will be exercised again in Phase 9, but confirm the plumbing works now via a quick manual re-query test).
```

---

## [ ] PHASE 4 — HEAT ANALYTICS

### [ ] STEP 17 — Native Persistence & Exceedance Analytics

**PURPOSE:** Use FortyGuard's native persistence/exceedance analytic types rather than recreating them.

**DEPENDENCIES:** Step 10, Step 14.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Use the verified FortyGuard API specification in the project context. FortyGuard can natively calculate `persistence` and `exceedance` analytics given a `threshold` and `direction`. HeatSentinel must use these native analytics rather than recreating them from raw tcm data. The threshold chosen (e.g., 35°C, direction=above) is a documented project analytical choice, not an official public-health threshold, unless a verified external source is cited.

CURRENT STATE
`scan_area` currently supports arbitrary `analytic_type` but has primarily been exercised with `tcm` (Steps 11–14). No dedicated persistence/exceedance workflow or documented threshold exists yet.

OBJECTIVE
Formalize a documented threshold configuration and a clean service function for retrieving native persistence and exceedance analytics for a given AOI.

TASKS
1. Inspect existing scan/client code before writing anything.
2. In `config.py` or a new `analytics_config.py`, define `HEAT_THRESHOLD_C = 35.0` and `HEAT_THRESHOLD_DIRECTION = "above"` as named, documented constants (not magic numbers scattered in code), with a comment explaining this is a project-derived analytical choice.
3. In `services/analytics_engine.py`, implement `async def get_persistence(polygon, start_date, start_time, granularity="60m") -> dict` and `async def get_exceedance(polygon, start_date, start_time, granularity="60m") -> dict`, both calling `scan_service.scan_area` (or `FortyGuardClient` directly for a single AOI) with `analytic_type="persistence"`/`"exceedance"` and the documented threshold/direction.
4. Normalize both outputs into a per-cell/zone shape consistent with the tcm output shape from earlier steps, so downstream code can treat all analytic types uniformly (e.g., a shared `HeatReading` model with optional fields for tcm value, persistence hours, exceedance hours).
5. Write tests (mocked) confirming correct threshold/direction are always sent, and confirming a missing-threshold configuration error is impossible (since threshold is now a hardcoded documented constant, not user input, for MVP scope).
6. Add a short section to `/docs/architecture.md` documenting the chosen threshold and explicitly stating it is a project analytical choice.

TECHNICAL CONSTRAINTS
- Do not recreate persistence/exceedance from raw tcm data — always use FortyGuard's native analytic types.
- Threshold/direction must never be silently omitted from a persistence/exceedance request.

FILES
Modify/create: `/backend/app/services/analytics_engine.py`, `/backend/app/config.py` or `analytics_config.py`, `/backend/app/models/fortyguard.py` (shared `HeatReading` model if needed). Create: `/backend/tests/test_analytics_engine.py`. Modify: `/docs/architecture.md`.

VALIDATION
Run `pytest`. Run a real live call for persistence and exceedance against one Phoenix AOI and report actual returned values (hours of persistence, hours of exceedance) to confirm the workflow produces sensible real numbers.

COMPLETION REPORT
Report: documented threshold and rationale, real Phoenix persistence/exceedance sample results, test results, and next dependency (historical baseline / heat anomaly calculation).
```

### [ ] STEP 18 — Historical Baseline & Heat Anomaly

**PURPOSE:** Build a documented, non-fabricated historical baseline and anomaly calculation.

**DEPENDENCIES:** Step 17.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Use the verified FortyGuard API specification in the project context. FortyGuard does NOT provide forecast capability — never use language like "forecast" or "prediction." Heat anomaly must be calculated as (current/recent temperature − historical reference), where the historical baseline is location- and time-aware and explicitly documented, never fabricated.

CURRENT STATE
`get_persistence`/`get_exceedance` exist; tcm scanning exists. No historical baseline mechanism exists yet.

OBJECTIVE
Implement a documented method for constructing a historical reference temperature for a given AOI and time-of-year, and compute heat anomaly against it.

TASKS
1. Inspect existing analytics engine and FortyGuard client before writing code.
2. Design the baseline method explicitly: query FortyGuard `tcm` for the same AOI across a small set of historical dates (e.g., same time-of-day, same calendar week, across the prior N available days/years that FortyGuard actually has data for — confirm real data availability empirically, do not assume depth of history) and compute a mean/median as the "historical reference." Do not invent a baseline number if FortyGuard has no historical coverage — in that case, return `baseline_available: false` and skip anomaly calculation rather than fabricating a placeholder value.
3. Implement `async def get_historical_baseline(polygon, reference_date_context, lookback_samples: int = 5) -> dict` in `analytics_engine.py`, returning the baseline value, the actual dates/sources sampled, and a `baseline_available` flag.
4. Implement `def calculate_anomaly(current_temp: float, baseline: dict) -> dict | None` returning `{"anomaly_c": ..., "current": ..., "baseline": ..., "baseline_dates": [...]}` or `None` if baseline unavailable.
5. Add explicit docstrings and a `/docs/methodology.md` section titled "Historical Baseline Construction" describing exactly how the baseline is built, so it can be defended to judges.
6. Write tests (mocked) covering: successful baseline construction and anomaly calculation, and the no-data-available path correctly returning `baseline_available: false` without fabricating a number.

TECHNICAL CONSTRAINTS
- Never use the words "forecast" or "predict" anywhere in this module's code, comments, or docs.
- Never fabricate a historical baseline value when real historical FortyGuard data isn't available for that location/time.

FILES
Modify: `/backend/app/services/analytics_engine.py`. Create: `/docs/methodology.md` (or append if exists). Create/modify: `/backend/tests/test_analytics_engine.py`.

VALIDATION
Run `pytest`. Attempt a real baseline construction call against a Phoenix AOI and report whether FortyGuard actually has enough historical depth available; document the real finding (even if it's "limited historical depth observed") in `/docs/methodology.md`.

COMPLETION REPORT
Report: baseline methodology as implemented, real empirical finding on FortyGuard historical data depth for Phoenix, test results, and next dependency (normalized zone-level metric aggregation).
```

### [ ] STEP 19 — Zone-Level Metric Normalization & Caching

**PURPOSE:** Combine tcm, persistence, exceedance, and anomaly into one normalized per-zone metrics object; add caching.

**DEPENDENCIES:** Step 17, Step 18.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel needs one clean, normalized "heat metrics" object per zone/hotspot combining current temperature, persistence, exceedance, and anomaly — ready to feed into vulnerability/resource joins and the Response Gap formula later.

CURRENT STATE
Individual analytic functions exist (`get_persistence`, `get_exceedance`, `get_historical_baseline`, `calculate_anomaly`). Nothing combines them into one zone metrics object yet.

OBJECTIVE
Implement a `compute_zone_heat_metrics(zone_polygon, context) -> HeatMetrics` function that orchestrates all four analytics for a single zone and returns one normalized, cached result.

TASKS
1. Inspect all existing analytics functions before writing orchestration code.
2. Define a `HeatMetrics` Pydantic model in `models/zone.py`: `current_temp_c`, `persistence_hours`, `exceedance_hours`, `anomaly_c` (nullable), `baseline_available` (bool), `data_sources` (list documenting which FortyGuard calls contributed), `computed_at`.
3. Implement `async def compute_zone_heat_metrics(zone_polygon, start_date, start_time) -> HeatMetrics` in `analytics_engine.py`, calling the relevant FortyGuard/analytics functions concurrently where safe (`asyncio.gather`), and assembling the combined result.
4. Add caching (SQLite table `zone_heat_metrics_cache`, keyed by zone polygon hash + date) so repeated demo runs reuse recent results, with a `force_refresh` option and clear `mode`/`cached_at` fields in the returned object.
5. Write unit tests (mocked) confirming correct assembly, correct handling when `baseline_available` is false (anomaly should be `None`, not zero), and correct caching behavior.

TECHNICAL CONSTRAINTS
- No silent zero-fill for missing data — nullable fields must stay null and be clearly flagged.
- Must reuse existing analytics functions, not duplicate FortyGuard calls.

FILES
Modify: `/backend/app/models/zone.py`, `/backend/app/services/analytics_engine.py`, `/backend/app/db.py`. Create/modify: `/backend/tests/test_zone_heat_metrics.py`.

VALIDATION
Run `pytest`. Run a real end-to-end `compute_zone_heat_metrics` call for one Phoenix hotspot and report the actual combined result.

COMPLETION REPORT
Report: `HeatMetrics` shape, real Phoenix result sample, caching confirmation, test results, and next dependency (Phase 5 — external vulnerability/resource data).
```

---

## [ ] PHASE 5 — PHOENIX EXTERNAL DATA

### [ ] STEP 20 — Census/ACS Vulnerability Data Ingestion

**PURPOSE:** Pull real Census/ACS data for Phoenix (population, elderly %, socioeconomic indicators) at a usable geography.

**DEPENDENCIES:** Step 8.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel's vulnerability layer uses US Census/ACS data: population, elderly population %, and socioeconomic vulnerability indicators, joined spatially to Phoenix zones/hotspots later.

CURRENT STATE
No external Census/ACS integration exists yet. The Phoenix target area boundary exists (Step 8).

OBJECTIVE
Ingest real Census/ACS data (via the public Census API or a downloaded ACS extract) at Census tract or block-group level covering the Phoenix target area, and store it locally.

TASKS
1. Inspect existing data directory structure before adding files.
2. Identify the correct Census geography (tract or block group — block group preferred for finer spatial join granularity) covering Maricopa County / the Phoenix target area boundary.
3. Implement `/backend/app/services/vulnerability_service.py` with a function `fetch_census_data(geography="block group", county_fips="04013")` that calls the Census/ACS public API (documented, free, no key required beyond optional Census API key registration — if a key is required, source it from config as `CENSUS_API_KEY` and add it to `.env.example`) to retrieve: total population, population 65+, and a socioeconomic indicator (e.g., poverty rate or median household income) for the relevant geography.
4. Store the raw + processed result in `/backend/app/data/census_phoenix.geojson` (tract/block-group polygons with the attributes attached) — this becomes a static, versioned local dataset checked into the repo (not re-fetched live during the demo, for reliability).
5. Compute derived fields: `elderly_pct = pop_65_plus / total_population`, and a normalized socioeconomic vulnerability score (0–1) documented with its exact formula.
6. Document data source, vintage (ACS year), geography level, and formula choices in `/docs/methodology.md` under "Vulnerability Data."
7. Write a test confirming the local GeoJSON loads correctly and required fields are present and within sane ranges (e.g., elderly_pct between 0 and 1).

TECHNICAL CONSTRAINTS
- Do not fabricate Census values — only real API-retrieved or officially published ACS data.
- All derived formulas must be explicitly documented, not black-boxed.
- Prefer storing a static local extract over depending on live Census API availability during the demo.

FILES
Create: `/backend/app/services/vulnerability_service.py`, `/backend/app/data/census_phoenix.geojson`. Modify: `/backend/.env.example` (if a Census key is needed), `/docs/methodology.md`. Create: `/backend/tests/test_vulnerability_service.py`.

VALIDATION
Run the ingestion script/function once against the live Census API, confirm real data is retrieved and saved, then run `pytest` against the saved static extract.

COMPLETION REPORT
Report: geography level used, data vintage, real sample values for a Phoenix block group/tract, formulas documented, test results, and next dependency (cooling/resource data ingestion).
```

### [ ] STEP 21 — Cooling & Hydration Resource Data Ingestion

**PURPOSE:** Pull real Phoenix cooling-resource locations (MAG Heat Relief Network).

**DEPENDENCIES:** Step 8.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel's resource layer uses Maricopa Association of Governments (MAG) Heat Relief Network data (200+ cooling/hydration/respite locations), and potentially ASU Resilience GIS Data Hub spatial cooling-center data, to compute protective resource availability near each zone.

CURRENT STATE
No resource data integration exists yet.

OBJECTIVE
Ingest real, publicly available cooling/hydration resource location data for the Phoenix target area and store it locally as a static GeoJSON dataset.

TASKS
1. Inspect existing data directory structure before adding files.
2. Locate a real, currently-published source for MAG Heat Relief Network locations (public listing/map/download) and, if genuinely available, ASU Resilience GIS Data Hub cooling-center data. If a machine-readable download isn't accessible, document the actual accessible format found and extract what's realistically obtainable (e.g., a published list with addresses that can be geocoded) — do not fabricate location data if the source can't be accessed.
3. Implement `/backend/app/services/resource_service.py` with `fetch_cooling_resources()` producing a GeoJSON FeatureCollection of point locations with properties: `name`, `type` (cooling/hydration/respite), `address`, `source`.
4. Save the result as `/backend/app/data/phoenix_cooling_resources.geojson`, filtered/clipped to points within or near the Phoenix target area.
5. Document the exact source, retrieval date, and any limitations (e.g., partial coverage, geocoding approximations) in `/docs/methodology.md` under "Resource Data."
6. Write a test confirming the GeoJSON loads, has a reasonable point count (>0, ideally tens of points near the target area), and all required properties are present.

TECHNICAL CONSTRAINTS
- Do not invent cooling center locations. If real data access is limited, be explicit in documentation about the actual coverage achieved rather than padding the dataset.
- Respect any usage terms of the source you pull from.

FILES
Create: `/backend/app/services/resource_service.py`, `/backend/app/data/phoenix_cooling_resources.geojson`. Modify: `/docs/methodology.md`. Create: `/backend/tests/test_resource_service.py`.

VALIDATION
Run `pytest`. Load the GeoJSON and report the actual point count and a sample of 5 real entries.

COMPLETION REPORT
Report: actual data source used, retrieval method, real point count and sample entries, documented limitations, test results, and next dependency (spatial joins: vulnerability + resources to zones).
```

### [ ] STEP 22 — Spatial Joins: Vulnerability to Zones

**PURPOSE:** Join Census vulnerability data onto arbitrary zone/hotspot polygons.

**DEPENDENCIES:** Step 20, Step 15.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel needs to attach vulnerability metrics (population, elderly %, socioeconomic score) to any given zone polygon (a hotspot or refined AOI), via spatial join with the Census block-group/tract dataset.

CURRENT STATE
`census_phoenix.geojson` exists with per-geography attributes (Step 20). Zone/hotspot polygons are produced by the spatial engine (Phase 3). No join logic exists yet.

OBJECTIVE
Implement an area-weighted spatial join that returns population-weighted vulnerability metrics for any input zone polygon.

TASKS
1. Inspect the Census dataset and zone/hotspot polygon shapes before writing code.
2. In `vulnerability_service.py`, implement `def get_vulnerability_for_zone(zone_polygon: GeoJSON) -> dict` that: finds all Census geographies intersecting the zone polygon, computes the area-weighted overlap fraction for each intersecting geography (using Shapely with a proper projection), and returns area-weighted aggregates: `population_estimate`, `elderly_pct` (population-weighted average), `socioeconomic_vulnerability` (population-weighted average), plus `source_geographies` (list of tract/block-group IDs contributing, for evidence traceability).
3. Handle the edge case where the zone polygon has no intersecting Census geography (return a clear "no coverage" result rather than a fabricated default).
4. Write unit tests using a synthetic zone polygon with known overlap against 2+ synthetic Census features, confirming area-weighted math is correct, plus a no-coverage edge case test.

TECHNICAL CONSTRAINTS
- Must use area-weighted aggregation, not a simple centroid-in-polygon lookup (a zone can span multiple block groups).
- Every returned aggregate must carry its `source_geographies` for the evidence trail (Phase 8/9 will surface this in the WHY panel).

FILES
Modify: `/backend/app/services/vulnerability_service.py`. Create/modify: `/backend/tests/test_vulnerability_service.py`.

VALIDATION
Run `pytest`. Run `get_vulnerability_for_zone` against a real detected hotspot from earlier phases and report actual output.

COMPLETION REPORT
Report: join methodology, real sample output for a Phoenix hotspot, test results, and next dependency (resource coverage/distance analysis).
```

### [ ] STEP 23 — Resource Coverage & Distance Analysis

**PURPOSE:** Compute nearby cooling-resource counts and distances for a given zone.

**DEPENDENCIES:** Step 21, Step 15.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel needs, for any zone polygon, the count of nearby protective resources (cooling/hydration centers) and a coverage/distance summary, to feed the Resource Deficit component of Response Gap.

CURRENT STATE
`phoenix_cooling_resources.geojson` exists (Step 21). Zone polygons are available from the spatial engine. No coverage/distance logic exists yet.

OBJECTIVE
Implement resource coverage analysis returning nearby resource counts and nearest-distance metrics for a zone.

TASKS
1. Inspect the resource dataset and zone polygon shapes before writing code.
2. In `resource_service.py`, implement `def get_resource_coverage_for_zone(zone_polygon: GeoJSON, search_radius_m: float = 1600.0) -> dict` (radius default ~1 mile — document this choice) that: finds resource points within the zone polygon itself, finds resource points within `search_radius_m` of the zone's boundary/centroid (properly projected distance calculation, not naive degrees), and returns: `resources_within_zone` (count + list), `resources_within_radius` (count + list), `nearest_resource_distance_m` (float or null if none found within a reasonable max search), and `resource_type_breakdown` (counts by type).
3. Document the `search_radius_m` default as a project analytical choice in `/docs/methodology.md`.
4. Write unit tests with synthetic zone + resource points at known distances, confirming correct counts and nearest-distance calculation, plus a no-resources-nearby edge case.

TECHNICAL CONSTRAINTS
- Distance calculations must use a proper projection (e.g., project to a local equal-distance CRS), not naive lat/lon Euclidean distance.
- Must not fabricate resource presence — a zone with genuinely zero nearby resources must return zero, which is itself important evidence.

FILES
Modify: `/backend/app/services/resource_service.py`. Create/modify: `/backend/tests/test_resource_service.py`. Modify: `/docs/methodology.md`.

VALIDATION
Run `pytest`. Run coverage analysis against a real Phoenix hotspot and report actual nearby resource counts/distances.

COMPLETION REPORT
Report: methodology, real sample output, test results, and next dependency (Response Gap formula — Phase 6).
```

---

## [ ] PHASE 6 — RESPONSE GAP

### [ ] STEP 24 — Vulnerability Score & Resource Deficit Formulas

**PURPOSE:** Define the deterministic, documented sub-scores feeding Response Gap.

**DEPENDENCIES:** Step 22, Step 23.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Response Gap = Heat Exposure × Population Vulnerability × Protective Resource Deficit, treated as a transparent, project-derived decision-support score — not an official public-health index, not a medical prediction. Each component must be a clearly documented, deterministic formula.

CURRENT STATE
Heat metrics (Step 19), vulnerability join (Step 22), and resource coverage (Step 23) all exist independently. No combined scoring formulas exist yet.

OBJECTIVE
Implement documented, normalized (0–1 or 0–100, pick one and be consistent) sub-score functions: Heat Exposure Score, Population Vulnerability Score, Resource Deficit Score.

TASKS
1. Inspect all three upstream data sources before writing formulas.
2. In a new `services/priority_engine.py`, implement:
   - `def heat_exposure_score(heat_metrics: HeatMetrics) -> float` combining normalized current temp, persistence hours, exceedance hours, and anomaly (when available) into one 0–100 score, with explicit, documented weights (e.g., temp 30%, persistence 30%, exceedance 25%, anomaly 15% — pick reasonable defaults and document them as tunable project choices). Handle `anomaly_c is None` by redistributing that weight rather than treating it as zero.
   - `def vulnerability_score(vuln_data: dict) -> float` combining normalized elderly_pct, socioeconomic_vulnerability, and population density (population_estimate / zone area) into one 0–100 score with documented weights.
   - `def resource_deficit_score(resource_data: dict) -> float` deriving a 0–100 deficit score that is HIGH when resources are scarce and LOW when abundant (e.g., inverse function of resource count within radius, with diminishing returns), documented explicitly.
3. Write a normalization helper `normalize(value, min_val, max_val) -> float` (clamped 0–100) used consistently across all three functions.
4. Document every formula, weight, and normalization range in `/docs/methodology.md` under "Response Gap Component Scores," explicitly labeling them as project-derived analytical choices.
5. Write unit tests for each function covering low/mid/high synthetic inputs and confirming outputs stay within the 0–100 range and behave monotonically as expected (e.g., more resources → lower deficit score).

TECHNICAL CONSTRAINTS
- No hidden magic numbers — every weight/threshold must be a named constant with a docstring/comment.
- Scores must be deterministic and reproducible from the same inputs (no randomness).

FILES
Create: `/backend/app/services/priority_engine.py`. Modify: `/docs/methodology.md`. Create: `/backend/tests/test_priority_engine.py`.

VALIDATION
Run `pytest`. Compute all three scores for a real Phoenix hotspot (using real Step 19/22/23 outputs) and report actual numeric results.

COMPLETION REPORT
Report: formulas and weights chosen, real sample scores for a Phoenix zone, test results, and next dependency (combined Response Gap + ranking).
```

### [ ] STEP 25 — Response Gap Formula & Zone Ranking

**PURPOSE:** Combine the three sub-scores into the final Response Gap and rank zones.

**DEPENDENCIES:** Step 24.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Response Gap = Heat Exposure × Population Vulnerability × Protective Resource Deficit — a transparent, project-derived decision-support score, explicitly not an official public-health index or mortality prediction.

CURRENT STATE
Three sub-score functions exist and are tested (Step 24). No combined formula or ranking exists yet.

OBJECTIVE
Implement the final Response Gap calculation and a zone-ranking function producing CRITICAL/HIGH/MODERATE/LOW tiers.

TASKS
1. Inspect the three sub-score functions before writing code.
2. In `priority_engine.py`, implement `def calculate_response_gap(heat_score: float, vulnerability_score: float, resource_deficit_score: float) -> dict` combining the three normalized (0–100) sub-scores into a single 0–100 Response Gap value. Since a naive product of three 0–100 scores would need rescaling, use a documented, defensible combination method (e.g., normalize each to 0–1, compute geometric mean or weighted product, rescale to 0–100) — document the exact math and rationale explicitly in `/docs/methodology.md`. Return the final score plus each component's contribution for evidence purposes.
3. Implement `def classify_zone(response_gap: float) -> str` mapping score ranges to `CRITICAL`/`HIGH`/`MODERATE`/`LOW` tiers, with documented, adjustable thresholds (e.g., ≥75 CRITICAL, ≥50 HIGH, ≥25 MODERATE, else LOW).
4. Implement `def rank_zones(zones: list[dict]) -> list[dict]` sorting a list of zone result objects (each already containing heat/vulnerability/resource/response-gap data) descending by Response Gap, assigning `rank` and `tier`.
5. Add a `disclaimer` constant string used wherever Response Gap is surfaced: "Response Gap is a project-derived decision-support score for this hackathon prototype. It is not an official public-health index, medical prediction, or mortality forecast." Wire this into the response object.
6. Write unit tests: known synthetic component scores produce the expected Response Gap and tier classification; ranking correctly orders a set of synthetic zones.

TECHNICAL CONSTRAINTS
- Must not claim causality or medical/mortality prediction anywhere in code, comments, or returned text.
- Formula and thresholds must be fully documented and defensible to judges.

FILES
Modify: `/backend/app/services/priority_engine.py`, `/docs/methodology.md`. Create/modify: `/backend/tests/test_priority_engine.py`.

VALIDATION
Run `pytest`. Compute a real Response Gap + tier for a real Phoenix hotspot using the actual Step 24 sub-scores and report the result.

COMPLETION REPORT
Report: final formula and rationale, tier thresholds, real Phoenix Response Gap sample, test results, and next dependency (Response Gap validation tests / edge cases before moving to NYC).
```

### [ ] STEP 26 — Response Gap Edge-Case & Sensitivity Tests

**PURPOSE:** Stress-test the formula before building anything on top of it.

**DEPENDENCIES:** Step 25.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Before building the agent and UI on top of Response Gap, we need confidence the formula behaves sensibly across edge cases and realistic Phoenix data ranges.

CURRENT STATE
`calculate_response_gap`, `classify_zone`, and `rank_zones` exist and pass basic unit tests (Step 25).

OBJECTIVE
Add a focused edge-case and sensitivity test suite, and a small sensitivity report.

TASKS
1. Inspect the existing priority engine tests before adding more.
2. Add tests for: all-zero inputs (should produce a low but valid score, not a crash/NaN), all-maximum inputs (should produce ~100 or the documented max), missing/None sub-scores (should raise a clear `ConfigurationError` rather than silently defaulting), and a realistic "hot + vulnerable + no resources" synthetic case confirming it lands in CRITICAL tier as expected.
3. Write a small script `/backend/scripts/response_gap_sensitivity.py` that runs the formula across a grid of plausible input combinations and prints a summary table (or saves a CSV) showing how Response Gap responds to each component — this becomes supporting evidence for the demo/judging narrative.
4. Run this sensitivity script against real computed scores for the 3–6 real Phoenix hotspots detected so far (from earlier phases) and save the results to `/backend/tests/fixtures/phoenix_response_gap_sample.json` for reuse in later frontend/agent development.

TECHNICAL CONSTRAINTS
- No NaN, infinity, or unhandled exceptions allowed for any valid-range input combination.
- Sensitivity script is a dev tool, not part of the production API.

FILES
Modify: `/backend/tests/test_priority_engine.py`. Create: `/backend/scripts/response_gap_sensitivity.py`, `/backend/tests/fixtures/phoenix_response_gap_sample.json`.

VALIDATION
Run `pytest` (full suite so far). Run the sensitivity script and confirm output is sane and saved.

COMPLETION REPORT
Report: edge cases tested and results, real Phoenix sample Response Gap values for the detected hotspots so far, confirmation of formula robustness, and note that this marks readiness for the **first working vertical slice** once basic agent ranking + map display are wired (Steps 27–32 below close that loop before Phase 7/NYC work begins).
```

### [ ] STEP 27 — Vertical Slice: Combine Scan → Metrics → Vulnerability → Resources → Response Gap into One Pipeline Function

**PURPOSE:** Assemble everything so far into a single callable pipeline — this directly enables the first working vertical slice.

**DEPENDENCIES:** Steps 14, 19, 22, 23, 25.

**ANTIGRAVITY PROMPT**
```
CONTEXT
This is the integration step that ties together every service built so far (scan, heat metrics, vulnerability join, resource coverage, Response Gap) into one orchestrated pipeline function, producing the first fully computed set of ranked Phoenix zones with real data end-to-end. This is the foundation of the "first working vertical slice."

CURRENT STATE
All individual services exist and are independently tested: `scan_service.scan_area`, `analytics_engine.compute_zone_heat_metrics`, `vulnerability_service.get_vulnerability_for_zone`, `resource_service.get_resource_coverage_for_zone`, `priority_engine.calculate_response_gap`/`rank_zones`. Nothing orchestrates them together yet.

OBJECTIVE
Implement `async def run_basic_pipeline(target_area: GeoJSON, top_n_hotspots: int = 5) -> list[dict]` that: scans the target area (Phase 3), detects hotspots (Step 15), and for each hotspot computes heat metrics, vulnerability, resource coverage, and Response Gap, then returns a fully ranked list of zone objects.

TASKS
1. Inspect every upstream service's real function signature before wiring — do not assume, verify actual signatures.
2. In a new `services/pipeline_service.py`, implement `run_basic_pipeline` orchestrating: `scan_service.scan_area` on the Phoenix target area → `detect_hotspots` → for each hotspot (bounded concurrency via `asyncio.gather` with a semaphore), call `compute_zone_heat_metrics`, `get_vulnerability_for_zone`, `get_resource_coverage_for_zone` → assemble each into a unified `Zone` Pydantic model (define in `models/zone.py` if not already complete) containing all evidence fields needed for the future WHY panel → call `calculate_response_gap` and `rank_zones` on the assembled list.
3. Ensure every `Zone` object carries a `sources` block documenting exactly which FortyGuard calls, Census geographies, and resource dataset entries contributed — this is the evidence trail required later.
4. Add basic error resilience: if one hotspot's downstream calls fail, log and exclude it from the ranked list rather than failing the whole pipeline, and report `excluded_zones` in the summary.
5. Write an integration test (mocked at the FortyGuard/Census/resource boundary) confirming the full pipeline assembles a correctly ranked list with evidence fields populated.

TECHNICAL CONSTRAINTS
- Must reuse every existing service function as-is — no reimplementation.
- The output `Zone` objects must be complete enough to directly power the Priority Panel and WHY panel UI without further backend changes later (verify against the spec's example zone format: temp, persistence, anomaly, elderly %, tree cover if available, cooling resources, Response Gap).

FILES
Create: `/backend/app/services/pipeline_service.py`. Modify: `/backend/app/models/zone.py`. Create: `/backend/tests/test_pipeline_service.py`.

VALIDATION
Run `pytest`. Run the real pipeline end-to-end against the actual Phoenix target area (live FortyGuard + real Census/resource data) and report the actual ranked zone list.

COMPLETION REPORT
Report: pipeline behavior, real end-to-end Phoenix results (ranked zones with scores), confirmation evidence fields are populated, test results, and confirm this is the backend half of the **first working vertical slice** — next dependency is exposing this via a real API endpoint and rendering it on the map (Steps 28–29).
```

### [ ] STEP 28 — Expose Pipeline via API Endpoint

**PURPOSE:** Give the frontend one endpoint that returns ranked, evidence-rich zones.

**DEPENDENCIES:** Step 27.

**ANTIGRAVITY PROMPT**
```
CONTEXT
This step exposes the Step 27 pipeline through the backend API so the frontend can display real, ranked Phoenix zones — completing the backend side of the first working vertical slice.

CURRENT STATE
`pipeline_service.run_basic_pipeline` works end-to-end against real Phoenix data (Step 27). No API route exposes it yet.

OBJECTIVE
Add `POST /api/analysis/basic-scan` returning the ranked zone list with mode/caching metadata.

TASKS
1. Inspect existing routers before adding new ones.
2. Create `/backend/app/routers/analysis.py` with `POST /api/analysis/basic-scan` (no required body — defaults to the Phoenix target area; optional `top_n` param) calling `run_basic_pipeline`, returning `{"mode": "live"|"cached", "zones": [...], "excluded_zones": [...], "generated_at": ..., "disclaimer": ...}`.
3. Add result caching (SQLite, keyed by target area + date) with `force_refresh` support, consistent with earlier caching patterns.
4. Register the router in `main.py`.
5. Write an integration test (mocked pipeline) confirming the endpoint's response shape and caching behavior.

TECHNICAL CONSTRAINTS
- Reuse the caching pattern already established (Step 11/14) rather than inventing a new approach.
- This endpoint is a stepping stone toward the real Heat Hunt endpoint (Phase 10) — keep naming clear so it's obviously superseded later, not confused with the final agent-driven endpoint.

FILES
Create: `/backend/app/routers/analysis.py`. Modify: `/backend/app/main.py`. Create: `/backend/tests/test_analysis_router.py`.

VALIDATION
Run backend, call the endpoint live once against real Phoenix data, confirm the response shape and real ranked zones. Run `pytest`.

COMPLETION REPORT
Report: endpoint behavior, real response sample, test results, and next dependency (rendering this on the Command Center UI).
```

### [ ] STEP 29 — Wire Ranked Zones into the Command Center UI

**PURPOSE:** Complete the first working vertical slice by displaying real ranked zones in the Priority Panel, WHY panel, and map.

**DEPENDENCIES:** Step 28, Step 6, Step 12.

**ANTIGRAVITY PROMPT**
```
CONTEXT
This step completes the **first working vertical slice**: Phoenix target area → tiled scan → hotspots → heat metrics → vulnerability → resources → Response Gap → ranked zones → displayed on the real Command Center UI (map + Priority Panel + WHY panel). Everything after this point builds on a genuinely working product.

CURRENT STATE
`POST /api/analysis/basic-scan` returns real ranked Phoenix zones (Step 28). The `PriorityPanel`, `WhyPanel`, and `HeatMap` components currently show static/mock content (Step 6) or a raw heat layer (Step 12).

OBJECTIVE
Replace mock content in `PriorityPanel` and `WhyPanel` with real data from `/api/analysis/basic-scan`, and render zone polygons + rank/tier coloring on the map.

TASKS
1. Inspect current frontend components and API client structure before modifying.
2. Add `/frontend/src/api/analysis.ts` with a React Query hook `useBasicScan()` calling `POST /api/analysis/basic-scan`.
3. Replace the temporary "Load Heat Data" button (Step 12) with a "RUN ANALYSIS" button (still a placeholder for the real Heat Hunt button coming in Phase 9) that triggers `useBasicScan`.
4. Update `Header` to compute and display real CRITICAL/HIGH/MODERATE/LOW counts from the returned zones.
5. Update `PriorityPanel` to list real ranked zones (id, tier, Response Gap score, temp, persistence, anomaly, elderly %, cooling resource count) with tier-based color coding, sorted by rank.
6. Add click/select interaction: selecting a zone in `PriorityPanel` highlights its polygon on the map and populates `WhyPanel` with that zone's evidence (heat metrics, vulnerability sources, resource sources, Response Gap component breakdown).
7. Render zone polygons on the map colored by tier, replacing/augmenting the raw cell heat layer from Step 12 (keep the cell heat layer as a toggleable base layer if straightforward).
8. Display the `disclaimer` text (from the API response) visibly near the Response Gap score in both panels.

TECHNICAL CONSTRAINTS
- No mock/placeholder zone data should remain reachable in the normal flow after this step.
- Must gracefully handle loading and error states (a failed live call should show a clear error, not blank panels).

FILES
Create: `/frontend/src/api/analysis.ts`. Modify: `Header.tsx`, `PriorityPanel.tsx`, `WhyPanel.tsx`, `HeatMap.tsx`, `CommandCenter.tsx`.

VALIDATION
Run both servers, click "RUN ANALYSIS," and confirm: real ranked zones appear in the Priority Panel, selecting a zone highlights it on the map and populates the WHY panel with real evidence, and the disclaimer is visible.

COMPLETION REPORT
Report: files changed, confirmation of the full real Phoenix flow working end-to-end in the browser (describe what's seen), any UX rough edges noted for Phase 17 polish, and explicit confirmation: **this is the first working vertical slice.** Next dependency: NYC validation module (Phase 7) can now run in parallel with agent work (Phase 8), but Phase 8 (Agent) is the higher priority per the critical path.
```

---

## [ ] PHASE 7 — NYC VALIDATION

### [ ] STEP 30 — NYC Heat Vulnerability Index Ingestion

**PURPOSE:** Bring in NYC's published HVI as an external benchmark dataset — validation only, not a second app.

**DEPENDENCIES:** Step 25 (Response Gap must be stable).

**ANTIGRAVITY PROMPT**
```
CONTEXT
NYC is used ONLY as a methodological validation check against HeatSentinel's independently constructed Response Gap — not as a second full application. NYC has a published Heat Vulnerability Index (HVI). This step ingests that published index at its native geography (NYC neighborhoods/community districts) for later comparison.

CURRENT STATE
Response Gap methodology is finalized and tested for Phoenix (Phase 6). No NYC data exists yet.

OBJECTIVE
Ingest NYC's published HVI dataset (real, publicly available) as a static local file, at its native geography.

TASKS
1. Inspect existing data directory structure before adding files.
2. Locate NYC's actual published Heat Vulnerability Index dataset (typically published by NYC Health/DOHMH at the neighborhood tabulation area or community district level) and document its real source URL/publication and vintage.
3. Save it as `/backend/app/data/nyc_hvi.geojson` with properties: geography id/name, published HVI score/tier, and any component indicators the publisher provides.
4. Document data source, vintage, and geography level in `/docs/methodology.md` under "NYC Validation Data."
5. Write a test confirming the file loads and required fields are present.

TECHNICAL CONSTRAINTS
- This dataset must be real and traceable to an actual public source — do not fabricate HVI values.
- Do not build a full Phoenix-equivalent pipeline for NYC (no NYC-specific FortyGuard scanning pipeline, no NYC hotspot detection) — this phase is a narrow validation dataset only.

FILES
Create: `/backend/app/data/nyc_hvi.geojson`. Modify: `/docs/methodology.md`. Create: `/backend/tests/test_nyc_data.py`.

VALIDATION
Run `pytest`. Report real sample entries from the loaded dataset.

COMPLETION REPORT
Report: real data source and vintage, sample entries, test results, and next dependency (a small NYC AOI Response Gap computation for comparison).
```

### [ ] STEP 31 — Small NYC AOI Response Gap Computation

**PURPOSE:** Compute HeatSentinel's Response Gap for a small number of real NYC AOIs, reusing the existing pipeline — not a parallel app.

**DEPENDENCIES:** Step 30, Step 27.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Use the verified FortyGuard API specification in the project context. To validate the Response Gap methodology, HeatSentinel computes it for a small, fixed set of NYC AOIs (e.g., 5–10 neighborhoods spanning a range of published HVI tiers) using the EXACT SAME pipeline already built for Phoenix — reusing `pipeline_service` components, not building new NYC-specific logic. Confirm NYC data coverage in FortyGuard before assuming it works identically to Phoenix.

CURRENT STATE
NYC HVI reference data exists (Step 30). The full Phoenix pipeline (scan → metrics → vulnerability → resources → Response Gap) exists and works (Phase 6).

OBJECTIVE
Select a small, fixed set of real NYC AOIs and compute their Response Gap using the existing pipeline, producing a comparison-ready dataset.

TASKS
1. Inspect the existing pipeline and NYC HVI dataset before writing code.
2. Select 5–10 real NYC neighborhood AOIs (each ≤10 mi², coordinates in [lon, lat]) spanning low/mid/high published HVI tiers — document the selection rationale.
3. First, verify FortyGuard actually returns usable data for these NYC AOIs (submit one test call per AOI) — if FortyGuard coverage is limited or unavailable for NYC, document this clearly and adjust scope honestly (do not fabricate results for AOIs without real coverage).
4. For AOIs with confirmed coverage, reuse `compute_zone_heat_metrics`, a NYC-appropriate vulnerability data source (NYC Census/ACS data — ingest a minimal equivalent to `census_phoenix.geojson` scoped only to these AOIs if needed, reusing `vulnerability_service` logic), and a minimal NYC cooling-resource dataset (NYC has published cooling center locations — ingest similarly narrowly, reusing `resource_service` logic) to compute Response Gap for each AOI via the existing `priority_engine` functions.
5. Save results to `/backend/app/data/nyc_validation_results.json` including each AOI's computed Response Gap and its published HVI tier for comparison.

TECHNICAL CONSTRAINTS
- Must reuse existing service functions — do not create NYC-parallel versions of the pipeline architecture.
- Explicitly scope this to a small, fixed AOI set — do not scan all of NYC.
- Report honestly if FortyGuard NYC coverage is limited rather than working around it with fabricated data.

FILES
Create: `/backend/scripts/nyc_validation_scan.py`, `/backend/app/data/nyc_validation_results.json`, minimal NYC vulnerability/resource data files if needed. Modify: `/docs/methodology.md`.

VALIDATION
Run the script against live FortyGuard/Census/resource sources and report actual real results for each AOI, including any AOIs excluded due to data unavailability.

COMPLETION REPORT
Report: AOIs selected and rationale, real FortyGuard NYC coverage findings, real computed Response Gap values vs. published HVI tiers per AOI, any limitations, and next dependency (statistical comparison/correlation analysis).
```

### [ ] STEP 32 — HVI Comparison & Correlation Analysis

**PURPOSE:** Statistically compare Response Gap against published HVI using careful, non-causal language.

**DEPENDENCIES:** Step 31.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel's Response Gap should be evaluated against NYC's published HVI using careful language: "We evaluated whether our independently constructed priority score aligns with an established heat-vulnerability index" — never "clinically validated," never causal claims.

CURRENT STATE
`nyc_validation_results.json` contains real computed Response Gap values and published HVI tiers for a small NYC AOI set (Step 31).

OBJECTIVE
Compute a correlation/association analysis between Response Gap and published HVI, and produce a documented, honestly-worded summary.

TASKS
1. Inspect the validation results file before writing analysis code.
2. In a new `services/validation_service.py` (or a script), compute Spearman rank correlation (appropriate since HVI is often tiered/ordinal) between computed Response Gap and published HVI score/tier across the AOI set, using SciPy.
3. Produce a small results summary: correlation coefficient, p-value, sample size, and a plain-language interpretation using "associated with" / "aligns with" language — explicitly avoiding causal claims, and explicitly noting the small sample size as a limitation.
4. Save the summary to `/backend/app/data/nyc_validation_summary.json` and add a corresponding section to `/docs/methodology.md` titled "NYC Validation Results," including the exact honest wording to reuse in demo narration.
5. If sample size is very small (e.g., <8), explicitly flag that correlation strength should be interpreted cautiously.

TECHNICAL CONSTRAINTS
- Never use the word "causes" or "validated" (in the clinical sense) anywhere in output text.
- Sample size and its limitation must be stated alongside any correlation figure.

FILES
Create: `/backend/app/services/validation_service.py` (or script), `/backend/app/data/nyc_validation_summary.json`. Modify: `/docs/methodology.md`.

VALIDATION
Run the analysis against the real Step 31 results and confirm a real, reportable correlation coefficient and honest interpretive text are produced.

COMPLETION REPORT
Report: real correlation results, honest interpretation text, limitations noted, and confirm NYC validation scope is complete and bounded (no further NYC pipeline work planned) — next dependency returns to the primary critical path: Phase 8, Agent.
```

*(Note: Step 32 is intentionally the end of the NYC branch. It can be executed any time after Step 27 in parallel with Phase 7/8 sequencing — but Phase 8 remains higher priority per the critical path in Part 4.)*

---

## [ ] PHASE 8 — AGENT

### [ ] STEP 33 — Agent Tool Schemas

**PURPOSE:** Define the formal tool schemas the LLM orchestrator will call.

**DEPENDENCIES:** Steps 14, 16, 22, 23, 25.

**ANTIGRAVITY PROMPT**
```
CONTEXT
The HeatSentinel agent is an orchestrator, never a calculator. It selects tools, chooses investigation targets, decides on refinement, coordinates data retrieval, interprets structured metrics, and explains/recommends — but never invents underlying measurements. Required tools: scan_city, query_fortyguard_heat, refine_hotspot, get_vulnerability_data, get_resources, calculate_risk_metrics, calculate_response_gap, recommend_action, explain_priority.

CURRENT STATE
All underlying deterministic service functions exist and are tested (scan_service, spatial_engine, analytics_engine, vulnerability_service, resource_service, priority_engine). No agent/tool-schema layer exists yet.

OBJECTIVE
Define formal tool schemas (Anthropic tool-use format) wrapping each existing service function, with strict input/output typing so the LLM can only call real, existing operations.

TASKS
1. Inspect every underlying service function's real signature before defining schemas — do not guess.
2. In `/backend/app/agent/tools.py`, define each tool as: an Anthropic tool-use JSON schema (name, description, input_schema) AND a Python function implementing the tool by calling the corresponding existing service function(s), never reimplementing logic:
   - `scan_city`: wraps `scan_service.scan_area` + `detect_hotspots` for the Phoenix target area.
   - `query_fortyguard_heat`: wraps a single-AOI `FortyGuardClient.run_heatmap` call for agent-directed ad hoc queries.
   - `refine_hotspot`: wraps `spatial_engine.refine_hotspot`.
   - `get_vulnerability_data`: wraps `vulnerability_service.get_vulnerability_for_zone`.
   - `get_resources`: wraps `resource_service.get_resource_coverage_for_zone`.
   - `calculate_risk_metrics`: wraps `analytics_engine.compute_zone_heat_metrics`.
   - `calculate_response_gap`: wraps `priority_engine.calculate_response_gap` (and `classify_zone`).
   - `recommend_action`: takes assembled evidence (heat metrics, vulnerability, resources, Response Gap, tier) as input and returns a structured recommendation payload for the LLM to phrase — the tool itself only selects from a small, documented set of deterministic action categories (e.g., "deploy mobile cooling support," "extend cooling center hours," "targeted outreach to elderly residents") based on rule-based logic on the evidence (e.g., zero nearby resources + CRITICAL tier → mobile cooling support), so the LLM composes wording but the underlying action category is deterministic, not invented.
   - `explain_priority`: assembles and returns the full evidence trail object (all sources, all component scores) for a given zone — no new computation, pure aggregation for display.
3. Write a `tool_registry.py` (or section of `tools.py`) mapping tool names to their implementing functions, for dispatch by the orchestrator.
4. Write unit tests confirming each tool schema is valid JSON schema and each tool function correctly delegates to its underlying service (mocked).

TECHNICAL CONSTRAINTS
- No tool may contain original calculation logic — every tool must delegate to an already-tested deterministic service function.
- `recommend_action`'s action-category selection logic must be rule-based and documented, not left to free LLM generation of facts.
- Tool descriptions given to the LLM must accurately describe real capability — do not describe capabilities that don't exist (e.g., do not describe `query_fortyguard_heat` as capable of forecasting).

FILES
Create: `/backend/app/agent/tools.py`, `/backend/app/agent/tool_registry.py`. Create: `/backend/tests/test_agent_tools.py`.

VALIDATION
Run `pytest` confirming schema validity and correct delegation for all 9 tools.

COMPLETION REPORT
Report: all 9 tools implemented and their delegation targets, test results, and next dependency (orchestrator loop / agent state machine).
```

### [ ] STEP 34 — Agent State & Orchestration Loop

**PURPOSE:** Build the core tool-calling loop that lets the LLM drive investigation.

**DEPENDENCIES:** Step 33.

**ANTIGRAVITY PROMPT**
```
CONTEXT
The HeatSentinel agent must genuinely drive which areas get investigated and refined — this is the core "adaptive agentic spatial investigation" differentiator. The orchestration loop calls the Anthropic API with tool-use enabled, executes requested tools via the Step 33 registry, feeds results back, and continues until the agent produces a final structured output or a safety-bounded step limit is reached.

CURRENT STATE
All 9 tools and their schemas exist (Step 33). No orchestration loop exists yet. `ANTHROPIC_API_KEY` is available via config (Step 3).

OBJECTIVE
Implement a bounded, observable agent orchestration loop that runs the tool-calling conversation and emits step-by-step progress events (for later use by the Agent Activity Panel).

TASKS
1. Inspect the tool registry and config module before writing code.
2. In `/backend/app/agent/orchestrator.py`, implement `class HeatHuntOrchestrator` with an `async def run(self, target_area: GeoJSON, on_step: Callable) -> dict` method that: constructs a system prompt establishing the agent's role (orchestrator, not calculator; Phoenix-focused; must use tools for all data; must not fabricate measurements; must use "associated with" not "causes"; must never say "forecast"), calls the Anthropic API with the 9 tool schemas attached, executes any requested tool calls via the registry, calls `on_step(event)` after each tool execution with a structured progress event (tool name, short human-readable status, e.g. "Scanning AOIs...", timestamp), feeds tool results back to the model, and repeats until the model returns a final non-tool-use response or a max-step safety limit (e.g., 25 steps) is reached.
3. Ensure the final agent output is a structured object (ranked zones with evidence, recommendations) — if the model's final text response isn't cleanly structured, add a final "finalize" tool the model must call with a strict JSON schema to force structured output rather than parsing free text.
4. Add clear error handling: tool execution errors should be fed back to the model as a tool error result (not crash the loop), and total loop failures should raise a `HeatSentinelError` with useful context.
5. Write tests using a mocked Anthropic client (no real API calls in automated tests) simulating a short tool-calling sequence, confirming: tools are dispatched correctly, `on_step` fires for each tool call, and the loop terminates correctly on both a clean finalize and the max-step safety limit.

TECHNICAL CONSTRAINTS
- Must have a hard max-step limit to prevent runaway loops/cost.
- The system prompt must explicitly forbid the model from stating any numeric measurement not sourced from a tool result.
- Must never call FortyGuard/Census/resource services directly — only through the Step 33 tool registry.

FILES
Create: `/backend/app/agent/orchestrator.py`. Create: `/backend/tests/test_orchestrator.py`.

VALIDATION
Run `pytest` (mocked). Then run one real, live orchestration call (real Anthropic API, real tools against real Phoenix data) via a temporary script and report the actual step-by-step trace and final output.

COMPLETION REPORT
Report: orchestration loop design, real live trace summary (steps taken, tools called, final output), test results, and next dependency (target-selection / adaptive refinement logic quality).
```

### [ ] STEP 35 — Agent Prompt Engineering for Adaptive Investigation

**PURPOSE:** Tune the system/task prompt so the agent genuinely performs coarse-scan → select → refine → re-query behavior.

**DEPENDENCIES:** Step 34.

**ANTIGRAVITY PROMPT**
```
CONTEXT
The core signature behavior is: coarse scan across the Phoenix target area → agent selects high-interest AOIs → refines selected polygons → re-queries FortyGuard at the refined scale → produces micro-level priority analysis. The orchestration loop exists (Step 34) but its prompt may not yet reliably produce this specific investigation pattern.

CURRENT STATE
`HeatHuntOrchestrator` runs a general tool-calling loop successfully (Step 34), but the specific coarse→select→refine→requery pattern has not been explicitly prompted or verified.

OBJECTIVE
Refine the orchestrator's system/task prompt to reliably produce the intended investigative sequence, and verify it empirically against real Phoenix data.

TASKS
1. Inspect the current system prompt in `orchestrator.py` before modifying it.
2. Rewrite the system prompt to explicitly instruct the agent to: (1) call `scan_city` first for a coarse pass, (2) review detected hotspots and select the top 3–5 most concerning by combining heat signal with the fact that vulnerability/resources are not yet known (i.e., select broadly at this stage, not just by raw temperature), (3) for each selected hotspot, call `refine_hotspot` then `query_fortyguard_heat` again at the refined polygon, (4) for each refined zone, call `get_vulnerability_data`, `get_resources`, `calculate_risk_metrics`, `calculate_response_gap` in a sensible order, (5) call `explain_priority` for each finalized zone, (6) call `recommend_action` for each, (7) call the finalize tool with the fully ranked, evidence-complete zone list.
3. Add a few-shot style clarifying example (in the prompt, describing tool-call ordering abstractly — not fabricated data) if it measurably improves reliability.
4. Run the real orchestrator against real Phoenix data 3 times and manually inspect whether the tool-call sequence matches the intended pattern each time; iterate on the prompt if not.
5. Log the full tool-call sequence of each run to `/backend/tests/fixtures/heat_hunt_trace_sample.json` (one representative successful run) for reuse in frontend Agent Activity Panel development (Phase 11) without needing a live call every time.

TECHNICAL CONSTRAINTS
- This step is prompt iteration, not new code architecture — avoid restructuring the orchestrator itself unless a genuine bug is found.
- Must remain within the max-step safety limit from Step 34.

FILES
Modify: `/backend/app/agent/orchestrator.py`. Create: `/backend/tests/fixtures/heat_hunt_trace_sample.json`.

VALIDATION
Run 3 live end-to-end orchestration runs against real Phoenix data; report whether each followed the intended scan→select→refine→requery→evidence→recommend pattern.

COMPLETION REPORT
Report: final prompt text summary, real run observations across 3 trials, the saved trace fixture, and next dependency (Heat Hunt as a distinct product-level orchestration wrapper — Phase 9).
```

---

## [ ] PHASE 9 — HEAT HUNT

### [ ] STEP 36 — Heat Hunt Job Model & Async Execution

**PURPOSE:** Wrap the orchestrator in a trackable, pollable "Heat Hunt run" job.

**DEPENDENCIES:** Step 35.

**ANTIGRAVITY PROMPT**
```
CONTEXT
"RUN HEAT HUNT" is HeatSentinel's primary user interaction — an autonomous investigation, not a synchronous dashboard load. Since the underlying orchestrator run can take from tens of seconds to a few minutes (multiple FortyGuard async calls chained together), it must run as a trackable background job the frontend can poll, similar in spirit to FortyGuard's own async pattern.

CURRENT STATE
`HeatHuntOrchestrator.run()` works end-to-end live against real Phoenix data with step callbacks (Step 35). No job tracking/async execution wrapper exists yet.

OBJECTIVE
Implement a Heat Hunt job model and async execution manager so a Heat Hunt run can be started, polled for progress, and retrieved on completion.

TASKS
1. Inspect the orchestrator and existing caching/db patterns before writing code.
2. Define a `HeatHuntJob` model (SQLite table): `job_id` (uuid), `status` (pending/running/completed/failed), `mode` (live/demo/cached), `progress_events` (JSON list, appended as the orchestrator's `on_step` fires), `result` (JSON, populated on completion), `error` (nullable), `created_at`, `completed_at`.
3. In `/backend/app/agent/heat_hunt_service.py`, implement `async def start_heat_hunt(target_area) -> str` (creates a job row, kicks off the orchestrator run as a background `asyncio.Task`, updates the job row via the `on_step` callback and on completion/failure) and `def get_heat_hunt_job(job_id: str) -> HeatHuntJob`.
4. Ensure progress events written during the run are incrementally persisted (not just held in memory) so polling reflects real-time progress even under concurrent requests.
5. Write tests (mocked orchestrator) confirming: job creation, progress event accumulation, successful completion updates status/result correctly, and a simulated orchestrator failure correctly sets `status=failed` with a captured error.

TECHNICAL CONSTRAINTS
- Must not block the FastAPI event loop — the orchestrator run must execute as a genuine background task, with the starting endpoint (added in Phase 10) returning immediately with a `job_id`.
- Reuse the SQLite `db.py` connection pattern already established.

FILES
Create: `/backend/app/agent/heat_hunt_service.py`. Modify: `/backend/app/db.py`. Create: `/backend/tests/test_heat_hunt_service.py`.

VALIDATION
Run `pytest` (mocked). Run a real live Heat Hunt job start + poll sequence via a temporary script and confirm progress events accumulate correctly and final result matches the orchestrator's real output.

COMPLETION REPORT
Report: job model design, real live run trace via polling, test results, and next dependency (Backend API endpoints — Phase 10).
```

---

## [ ] PHASE 10 — BACKEND API

### [ ] STEP 37 — Heat Hunt API Endpoints (Start, Status, Result)

**PURPOSE:** Expose the Heat Hunt job system as the primary product API.

**DEPENDENCIES:** Step 36.

**ANTIGRAVITY PROMPT**
```
CONTEXT
This is the primary product-facing API for HeatSentinel: starting, polling, and retrieving a Heat Hunt run, mirroring FortyGuard's own async submit/poll pattern at the product level.

CURRENT STATE
`start_heat_hunt` and `get_heat_hunt_job` exist and work against real data (Step 36). No API routes expose them yet.

OBJECTIVE
Implement `POST /api/heat-hunt/start`, `GET /api/heat-hunt/{job_id}/status`, and `GET /api/heat-hunt/{job_id}/result` in `routers/heat_hunt.py`.

TASKS
1. Inspect the existing `heat_hunt.py` router stub and `heat_hunt_service` before writing code.
2. Implement `POST /api/heat-hunt/start` (no required body, defaults to Phoenix target area) calling `start_heat_hunt`, returning `{"job_id": ...}` immediately (must return in well under a second — confirm the background task pattern from Step 36 is truly non-blocking).
3. Implement `GET /api/heat-hunt/{job_id}/status` returning `{"status": ..., "progress_events": [...], "mode": ...}` — this is the endpoint the frontend Agent Activity Panel will poll.
4. Implement `GET /api/heat-hunt/{job_id}/result` returning the final ranked zone list + disclaimer once `status == completed`, or a 409-style "not ready" response otherwise, or the error detail if `status == failed`.
5. Add consistent error handling using the Phase 1 error conventions (`HeatSentinelError` subclasses) for unknown job IDs.
6. Register the router in `main.py`. Write integration tests (mocked service layer) for all three endpoints covering pending/running/completed/failed/unknown-job-id states.

TECHNICAL CONSTRAINTS
- `/start` must return near-instantly; all real work happens in the background job.
- Must reuse `heat_hunt_service` — no duplicated job logic in the router.

FILES
Modify: `/backend/app/routers/heat_hunt.py`, `/backend/app/main.py`. Create: `/backend/tests/test_heat_hunt_router.py`.

VALIDATION
Run backend, start a real live Heat Hunt job via curl/HTTPie, poll status until completed, and fetch the final result — confirm real Phoenix data flows through correctly end-to-end via the API only (no direct service calls). Run `pytest`.

COMPLETION REPORT
Report: endpoint behavior, real live run confirmed via API polling, test results, and next dependency (Command Center frontend wiring to real Heat Hunt — Phase 11).
```

---

## [ ] PHASE 11 — COMMAND CENTER (FULL WIRING)

### [ ] STEP 38 — Real "RUN HEAT HUNT" Button & Polling Hook

**PURPOSE:** Replace the placeholder "RUN ANALYSIS" flow with the real, agent-driven Heat Hunt flow.

**DEPENDENCIES:** Step 37, Step 29.

**ANTIGRAVITY PROMPT**
```
CONTEXT
This step replaces the Step 29 placeholder synchronous analysis flow with the real product interaction: click "RUN HEAT HUNT," watch the agent investigate live, and see results populate as they complete.

CURRENT STATE
The Command Center currently calls `/api/analysis/basic-scan` synchronously via a "RUN ANALYSIS" button (Step 29). The real async Heat Hunt API exists (Step 37).

OBJECTIVE
Wire the UI to the real Heat Hunt start/status/result flow with proper polling.

TASKS
1. Inspect the current frontend API layer and `Header`/`CommandCenter` components before modifying.
2. Add `/frontend/src/api/heatHunt.ts` with functions/hooks: `useStartHeatHunt()` (mutation calling `POST /api/heat-hunt/start`), `useHeatHuntStatus(jobId)` (React Query with polling interval, e.g., every 1.5s, calling the status endpoint, auto-stopping once status is completed/failed), `useHeatHuntResult(jobId)` (fetches once completed).
3. Replace the "RUN ANALYSIS" button in `Header` with "RUN HEAT HUNT," wired to `useStartHeatHunt`; on success, store the `job_id` in component/context state and begin polling.
4. Add a clear running/idle/completed/failed UI state to the header (e.g., button disabled + spinner while running).
5. Once `status === completed`, fetch and render the result exactly as Step 29 did with `/api/analysis/basic-scan` (reuse the same `PriorityPanel`/`WhyPanel`/map rendering logic — the underlying zone shape should be compatible).
6. Handle `status === failed` with a clear, non-technical error message and a retry option.

TECHNICAL CONSTRAINTS
- Do not leave the old synchronous `/api/analysis/basic-scan` button reachable in the main UI after this step (it can remain as a backend dev tool, but the UI should use Heat Hunt exclusively).
- Polling must stop cleanly once the job reaches a terminal state (no infinite polling).

FILES
Create: `/frontend/src/api/heatHunt.ts`. Modify: `Header.tsx`, `CommandCenter.tsx`, `PriorityPanel.tsx` (if prop shape needs adjustment), `WhyPanel.tsx` (if prop shape needs adjustment).

VALIDATION
Click "RUN HEAT HUNT" in the running app, confirm the job starts, status polls correctly, and real ranked Phoenix zones render on completion. Simulate a failure path (e.g., temporarily break the backend) and confirm the error state renders correctly.

COMPLETION REPORT
Report: files changed, confirmation of the real live Heat Hunt flow working in-browser, failure-path confirmation, and next dependency (live Agent Activity Panel wired to real progress events).
```

### [ ] STEP 39 — Live Agent Activity Panel

**PURPOSE:** Show the agent's real step-by-step investigation as it happens.

**DEPENDENCIES:** Step 38.

**ANTIGRAVITY PROMPT**
```
CONTEXT
The Agent Activity Panel must show HeatSentinel's real investigation steps live (e.g., "Scanning AOIs...", "Hotspot detected...", "Refining polygon...", "Joining Census data...", "Calculating Response Gap...") sourced from real `progress_events`, not scripted/fake text.

CURRENT STATE
`AgentActivityPanel` currently shows static placeholder content (Step 6). `useHeatHuntStatus` returns real `progress_events` from the backend (Step 38).

OBJECTIVE
Wire `AgentActivityPanel` to render the real, live-updating progress event stream from a running Heat Hunt job.

TASKS
1. Inspect the current `AgentActivityPanel` and the shape of real `progress_events` returned by the status endpoint before modifying.
2. Update `AgentActivityPanel` to accept the current job's `progress_events` array and render them as a scrolling, timestamped activity feed, auto-scrolling to the latest event.
3. Map raw tool-call event names to the human-readable phrasing from the product spec (e.g., `scan_city` → "Dividing Phoenix target area / Scanning thermal conditions", `refine_hotspot` → "Refining priority AOI", `get_vulnerability_data` → "Joining vulnerability data", `get_resources` → "Checking protective resources", `calculate_response_gap` → "Calculating Response Gap") via a small mapping table — do not invent step text unconnected to a real event.
4. Add a visual "completed"/"failed" terminal state indicator at the end of the feed.
5. Ensure the panel updates smoothly as `useHeatHuntStatus` polls (no jank/full remount per poll — key list items stably).

TECHNICAL CONSTRAINTS
- Every displayed activity line must correspond to a real backend-emitted progress event — no fabricated/decorative-only steps.
- Must handle the case of zero events yet (job just started) gracefully.

FILES
Modify: `/frontend/src/components/AgentActivityPanel.tsx`, `CommandCenter.tsx`.

VALIDATION
Run a real Heat Hunt from the UI and confirm the Agent Activity Panel shows real, live, correctly-ordered progress events matching the actual backend trace, ending in a clear completed state.

COMPLETION REPORT
Report: mapping table used, confirmation of live real-event rendering, any event-name gaps found and how they were handled, and next dependency (WHY panel evidence completeness pass / recommendation display).
```

### [ ] STEP 40 — Recommendation Display & Evidence Completeness Pass

**PURPOSE:** Ensure the recommendation and full evidence trail render exactly per the product spec's example.

**DEPENDENCIES:** Step 39, Step 33 (`recommend_action`/`explain_priority`).

**ANTIGRAVITY PROMPT**
```
CONTEXT
Per the product spec, a finalized zone should display evidence like: heat (°C), persistence (hours), exceedance, historical anomaly, elderly population %, tree cover % (if available), cooling resources count, and Response Gap score — plus a recommended action — with a WHY panel exposing evidence sources and score decomposition.

CURRENT STATE
Real ranked zones with Response Gap and basic evidence render in `PriorityPanel`/`WhyPanel` (Step 29/38). Recommendation text from `recommend_action` may not yet be fully surfaced; tree cover data may not yet be integrated (note: tree cover was not explicitly built in Phase 5 — confirm current state and either integrate a real tree-canopy data source now if time allows, or explicitly omit the field with a clear "not available in this analysis" label rather than fabricating a value).

OBJECTIVE
Do a completeness pass ensuring every field from the product spec's example evidence block is either real and rendered, or explicitly and honestly labeled unavailable.

TASKS
1. Inspect the current `Zone` model, pipeline output, and UI components before making changes.
2. Confirm whether tree canopy data exists anywhere in the pipeline. If not, and if time allows, add a minimal real tree-canopy data source (e.g., a public land-cover/canopy dataset for Maricopa County) integrated similarly to Step 20's Census ingestion; if time does not allow, explicitly mark `tree_cover_pct: null` in the `Zone` model and render "Not available in this analysis" in the UI rather than omitting or fabricating it.
3. Ensure `recommend_action`'s output (action category + LLM-composed phrasing) is present on every finalized zone and rendered prominently in `PriorityPanel` under "Recommended:".
4. Ensure `explain_priority`'s full evidence object (all data sources: FortyGuard call IDs/params, Census geography IDs, resource dataset entries, component score breakdown of Response Gap) is rendered in `WhyPanel` in a clear, structured "WHY?" expandable format matching the spec's evidence-first design intent.
5. Add the Response Gap disclaimer text visibly next to every displayed Response Gap score (not just once globally) if not already consistently present.

TECHNICAL CONSTRAINTS
- Never render a fabricated value for a missing field — always an honest "not available" state.
- Recommendation text must trace back to `recommend_action`'s deterministic action category, not free-floating LLM text disconnected from tool output.

FILES
Modify: `/backend/app/models/zone.py` (if tree cover or other fields added), relevant pipeline/service files if tree cover is integrated, `/frontend/src/components/PriorityPanel.tsx`, `WhyPanel.tsx`.

VALIDATION
Run a real Heat Hunt and manually verify every field from the spec's example evidence block is present and either real or honestly labeled unavailable, and that recommendations and WHY evidence render correctly for the top-ranked zone.

COMPLETION REPORT
Report: whether tree cover was integrated or honestly omitted (and why), full field-by-field completeness confirmation, real example output, and next dependency (full end-to-end integration test — Phase 12).
```

---

## [ ] PHASE 12 — INTEGRATION

### [ ] STEP 41 — Full End-to-End Integration Test (Real Phoenix Scenario)

**PURPOSE:** Prove the entire Definition-of-Done flow works together, live, start to finish.

**DEPENDENCIES:** Step 40.

**ANTIGRAVITY PROMPT**
```
CONTEXT
This is the integration checkpoint validating the full Definition of Done: RUN HEAT HUNT → Phoenix target area divided into AOIs → FortyGuard data retrieved → hotspots detected → agent chooses investigation target → hotspot refined → FortyGuard re-queried → vulnerability joined → resources analyzed → heat metrics calculated → Response Gap calculated → priority ranking generated → evidence displayed → recommendation generated.

CURRENT STATE
Every individual piece has been built and unit/integration tested in isolation with real data spot-checks. A full, unbroken, live, UI-driven run has not yet been formally verified end-to-end in one pass.

OBJECTIVE
Run and document one complete, live, UI-driven Heat Hunt against real Phoenix data, confirming every stage of the Definition of Done actually executes and displays correctly, and write an automated backend integration test covering the same flow (with mocked external APIs for CI reliability, plus this manual live confirmation).

TASKS
1. Inspect the full flow (orchestrator, heat_hunt_service, routers, frontend) before testing — do not assume prior steps are still wired correctly; something may have regressed.
2. Manually run a real Heat Hunt from the browser UI, and, in your completion report, document each Definition-of-Done stage explicitly with real observed evidence (e.g., real AOI count, real activity_ids, real hotspot count, real refined polygon example, real vulnerability numbers, real resource counts, real Response Gap scores, real recommendation text).
3. Write `/backend/tests/test_integration_full_flow.py`, an automated integration test using a mocked FortyGuard/Census/resource boundary but real orchestration/pipeline/priority logic, asserting that a full run produces a non-empty, correctly-shaped, ranked, evidence-complete zone list end-to-end.
4. Fix any bugs discovered during the live run before reporting completion — do not report success with known unresolved issues.

TECHNICAL CONSTRAINTS
- The live run must use real FortyGuard/Census/resource data — no mocking for this manual verification pass.
- The automated test must be CI-safe (mocked externals, deterministic, fast).

FILES
Create: `/backend/tests/test_integration_full_flow.py`.

VALIDATION
Run `pytest` (full suite). Perform and document the live manual run per the tasks above.

COMPLETION REPORT
Report, stage by stage, real evidence that the full Definition-of-Done flow works live, any bugs found and fixed, automated integration test results, and next dependency (Phase 13 — Reliability hardening).
```

---

## [ ] PHASE 13 — RELIABILITY

### [ ] STEP 42 — Retries, Timeouts, and Graceful Degradation

**PURPOSE:** Harden every external call against real-world flakiness before demo day.

**DEPENDENCIES:** Step 41.

**ANTIGRAVITY PROMPT**
```
CONTEXT
FortyGuard, Census, and Anthropic API calls can all fail or be slow during a live demo. HeatSentinel needs consistent timeout, retry, and graceful-degradation behavior across every external integration.

CURRENT STATE
Individual retry logic exists in the FortyGuard client (Step 10). Timeouts/retries elsewhere (Census fetch, Anthropic calls) have not been systematically reviewed.

OBJECTIVE
Audit and standardize timeout/retry/degradation behavior across every external call in the system.

TASKS
1. Inspect every service module that makes an external HTTP call (FortyGuard client, vulnerability_service Census calls, orchestrator's Anthropic calls) before modifying anything.
2. Standardize on consistent timeout values (e.g., 30s for FortyGuard submit/status, 15s for Census, per-turn timeout for Anthropic calls) defined as named config constants, not scattered literals.
3. Ensure every external call has bounded retry (e.g., 2 retries, exponential backoff) for transient errors (timeouts, 5xx) but NOT for confirmed 4xx/validation errors.
4. Add graceful degradation: if the Census vulnerability call fails for a given zone during a Heat Hunt run, that zone should still be produced with `vulnerability_data_available: false` rather than failing the whole run (similarly for resource data) — verify this is already true from Step 27's per-hotspot error handling and extend if gaps are found.
5. Add an overall Heat Hunt run timeout (e.g., 5 minutes) after which the job is marked `failed` with a clear message rather than hanging indefinitely.
6. Write/extend tests simulating a slow/failing FortyGuard call, a failing Census call mid-run, and an overall run timeout, confirming correct degraded-but-non-crashing behavior in each case.

TECHNICAL CONSTRAINTS
- Never silently retry indefinitely.
- Degraded results must be clearly flagged in the returned data, never presented as complete when they aren't.

FILES
Modify: relevant service files, `heat_hunt_service.py`, config constants file. Modify/create tests accordingly.

VALIDATION
Run `pytest` including new failure-simulation tests. Manually verify (e.g., via a temporarily injected fault) that a mid-run Census failure still produces a usable, clearly-flagged Heat Hunt result.

COMPLETION REPORT
Report: standardized timeout/retry values, degradation behaviors confirmed, test results, and next dependency (fallback/demo-mode caching layer).
```

### [ ] STEP 43 — Fallback Mode: Cached → Deterministic Demo Scenario

**PURPOSE:** Build the three-tier fallback (live → cached → deterministic demo) as a real, labeled system behavior.

**DEPENDENCIES:** Step 42.

**ANTIGRAVITY PROMPT**
```
CONTEXT
If the live API fails, HeatSentinel must fall back: live mode → cached valid response → deterministic demo scenario, always clearly labeled, never presenting fake live data as real.

CURRENT STATE
Per-request caching exists in several services (FortyGuard scan cache, zone metrics cache, analysis result cache). A formal three-tier fallback policy and a deterministic demo scenario do not yet exist.

OBJECTIVE
Implement a formal fallback resolver used by the Heat Hunt flow, plus a curated deterministic demo dataset as the final fallback tier.

TASKS
1. Inspect all existing caching mechanisms before adding new logic — reuse rather than duplicate.
2. Capture one complete, real, successful Heat Hunt run's full result (from Step 41's live run) and save it as `/backend/app/data/demo_scenario_phoenix.json` — this is the deterministic demo fallback, clearly documented as being derived from a real historical live run (include the real capture timestamp).
3. In `heat_hunt_service.py` (or a new `fallback_service.py`), implement a resolver used when starting a Heat Hunt: attempt live orchestration first; if the orchestration fails or the target FortyGuard calls fail outright at the very first scan step, fall back to the most recent valid cached full-run result if one exists and is reasonably fresh (e.g., <24h); if no valid cache exists, fall back to `demo_scenario_phoenix.json`. Every fallback tier must set the job's `mode` field accordingly (`live`/`cached`/`demo`).
4. Ensure the frontend (`Header`/map/panels) already surfaces `mode` clearly (extend the Step 12 mode badge pattern across the full Command Center if not already consistent) — never presenting cached/demo data without a visible label.
5. Write tests simulating a full live failure and confirming correct fallback to cache, then to demo scenario when cache is also unavailable, with correct `mode` labeling throughout.

TECHNICAL CONSTRAINTS
- Fallback must never be silent — `mode` must always be accurate and visible in both API response and UI.
- The demo scenario must be real, previously-captured data, not fabricated.

FILES
Create: `/backend/app/data/demo_scenario_phoenix.json`, `/backend/app/services/fallback_service.py` (or extend `heat_hunt_service.py`). Modify: relevant frontend components for consistent mode badging. Create/modify tests.

VALIDATION
Run `pytest` covering all three fallback tiers. Manually simulate a live failure (e.g., temporarily invalidate the API key) and confirm the UI correctly falls back and labels the result, then restore normal operation and confirm live mode resumes.

COMPLETION REPORT
Report: fallback tiers implemented, real demo scenario capture confirmed, test results, manual failure-simulation confirmation, and next dependency (Phase 14 — Security).
```

---

## [ ] PHASE 14 — SECURITY

### [ ] STEP 44 — Secrets, `.env`, and Dependency Security Audit

**PURPOSE:** Final security pass before deployment.

**DEPENDENCIES:** Step 43.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Before deployment, HeatSentinel needs a focused security audit: secrets handling, `.env`/`.gitignore` correctness, input validation, and dependency vulnerability scanning.

CURRENT STATE
Config/secrets handling was established in Phase 1 and used consistently throughout. No formal audit has been performed since.

OBJECTIVE
Audit and confirm secure handling of secrets, safe input validation on all API endpoints, and check dependencies for known vulnerabilities.

TASKS
1. Inspect the full codebase for any accidental hardcoded API keys, tokens, or credentials (grep for suspicious patterns) — fix any found immediately.
2. Confirm `.env` is genuinely gitignored and was never committed in git history (`git log --all --full-history -- .env`); if it was ever committed, document this clearly as a finding (do not attempt to silently rewrite history without flagging it).
3. Review every FastAPI endpoint for input validation: confirm all request bodies use Pydantic models (rejecting malformed input with 422s), confirm polygon inputs are validated for coordinate order and reasonable bounds (already partially covered in Step 9 — confirm it's applied everywhere polygons are accepted, including any agent-exposed AOI parameters).
4. Run a dependency vulnerability check for both backend (`pip-audit` or equivalent) and frontend (`npm audit`), and report/fix any high-severity findings that can be resolved without breaking functionality.
5. Confirm error responses in production mode never leak stack traces, file paths, or internal config values (re-verify Step 4's exception handler still behaves correctly).
6. Add basic rate-limiting consideration note in `/docs/architecture.md` for the `/api/heat-hunt/start` endpoint (full implementation optional given timeline — document the recommendation even if not built, per Phase 15 performance tradeoffs).

TECHNICAL CONSTRAINTS
- Do not disable or weaken any existing validation to "fix" an audit finding — fix the underlying issue.
- Do not commit real secret values anywhere, including in test fixtures or scripts.

FILES
Modify as needed based on findings. Modify: `/docs/architecture.md`.

VALIDATION
Report the full audit findings and confirm all identified issues are resolved or explicitly documented as accepted/deferred with rationale.

COMPLETION REPORT
Report: audit findings, fixes applied, dependency scan results, any deferred items with rationale, and next dependency (Phase 15 — Performance).
```

---

## [ ] PHASE 15 — PERFORMANCE

### [ ] STEP 45 — Latency & Caching Optimization Pass

**PURPOSE:** Get Heat Hunt run time and map responsiveness into demo-acceptable ranges.

**DEPENDENCIES:** Step 44.

**ANTIGRAVITY PROMPT**
```
CONTEXT
A full Heat Hunt run chains multiple async FortyGuard calls, Census joins, and an LLM tool-calling loop. For a 3–5 minute live demo, total run time and map responsiveness must be predictable and reasonably fast.

CURRENT STATE
The full flow works correctly (Phase 12/13) but has not been specifically profiled or optimized for latency.

OBJECTIVE
Profile the real Heat Hunt run end-to-end, identify the actual slowest stages, and apply targeted optimizations.

TASKS
1. Inspect the orchestrator, scan_service, and pipeline for existing concurrency patterns before optimizing.
2. Run a real, live, timed Heat Hunt and log per-stage durations (coarse scan, hotspot detection, per-zone refinement+requery, vulnerability/resource joins, Response Gap calc, LLM reasoning turns) using the existing structured logging.
3. Identify the actual bottleneck(s) from real data rather than assuming — report exact timings.
4. Apply targeted fixes only where justified by real profiling, for example: increasing bounded concurrency for zone-level tool calls if currently serialized and safe to parallelize, ensuring Census/resource data (which are static local files, not live APIs) are loaded once and reused rather than re-read per zone, and ensuring the frontend polling interval is sensible (not too aggressive, not laggy).
5. On the frontend, confirm map rendering performance with the real zone/cell counts involved is smooth (no visible jank); optimize GeoJSON layer updates if needed (e.g., avoid full source replacement when only styling changes).
6. Document the final measured end-to-end Heat Hunt duration in `/docs/architecture.md`.

TECHNICAL CONSTRAINTS
- Do not sacrifice correctness or evidence completeness for speed (e.g., do not skip real vulnerability/resource joins to save time).
- Any concurrency increase must respect FortyGuard's rate/usage limits (reuse existing bounded semaphore patterns, don't remove bounds).

FILES
Modify relevant service files based on real profiling results. Modify: `/docs/architecture.md`.

VALIDATION
Re-run the timed live Heat Hunt after optimization and report before/after durations.

COMPLETION REPORT
Report: real before/after timing data, specific optimizations applied and why, confirmation the full flow still passes `pytest` and the Step 41 integration test, and next dependency (Phase 16 — Demo Mode).
```

---

## [ ] PHASE 16 — DEMO MODE

### [ ] STEP 46 — 3–5 Minute Demo Flow Assembly

**PURPOSE:** Assemble the actual demo script and ensure the app supports it smoothly.

**DEPENDENCIES:** Step 45, Step 43.

**ANTIGRAVITY PROMPT**
```
CONTEXT
The demo narrative is: problem framing → open HeatSentinel → Phoenix command center → RUN HEAT HUNT → scanning AOIs → FortyGuard results → hotspot detected → agent investigates → polygon refinement → vulnerability/resource correlation → Response Gap ranking → ZONE X CRITICAL → WHY? → evidence → recommended action → closing line. This must run reliably within 3–5 minutes.

CURRENT STATE
The full live flow works and is optimized (Phase 15). Fallback/demo-mode data exists (Step 43). No dedicated demo-mode UI affordances or rehearsal have happened yet.

OBJECTIVE
Add any final UI affordances needed to support a smooth live demo, and produce a written demo script mapped to actual app screens/actions.

TASKS
1. Inspect the current full app flow end-to-end before adding anything.
2. Add a simple, presenter-friendly control (e.g., an explicit "Demo Mode" toggle in a dev/settings corner, defaulting off) that forces `mode=demo` using the Step 43 deterministic scenario, for use ONLY as a safety net if live/cached both fail during the actual judging demo — clearly labeled, never the default.
3. Confirm the real live path remains the default and primary path for the actual demo attempt.
4. Time a full real live run of the exact demo sequence (open app → RUN HEAT HUNT → watch agent activity → select top zone → open WHY → read recommendation) and confirm it fits within 3–5 minutes; if not, identify the specific step consuming excess time and apply a targeted fix (may loop back to Phase 15 optimizations).
5. Write `/docs/demo_script.md`: a beat-by-beat script mapping the narrative in the context above to exact on-screen actions and approximate timing per beat, including the two closing lines from the spec verbatim as presenter notes.
6. Do a full rehearsal run-through against the real app and note any rough edges for Phase 17 polish.

TECHNICAL CONSTRAINTS
- Live mode must remain the default and the primary demo path; the demo-mode toggle is a safety net only, not a replacement.
- No new major features in this step — only what's needed to support a smooth existing flow.

FILES
Modify: `Header.tsx` or a small settings component for the demo-mode toggle. Create: `/docs/demo_script.md`.

VALIDATION
Time and document a full real rehearsal run of the exact demo flow.

COMPLETION REPORT
Report: real rehearsal timing, the finalized demo script, rough edges found for Phase 17, and next dependency (Phase 17 — UI Polish).
```

---

## [ ] PHASE 17 — UI POLISH

### [ ] STEP 47 — Visual Hierarchy & Tier Color System

**PURPOSE:** Sharpen the CRITICAL/HIGH/MODERATE/LOW visual language across the whole app.

**DEPENDENCIES:** Step 46.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel's Command Center should feel like a professional, high-stakes situational-awareness tool. Tier color coding (CRITICAL/HIGH/MODERATE/LOW) must be consistent, accessible, and visually clear across the header counts, map polygons, priority panel, and WHY panel.

CURRENT STATE
The app is functionally complete and demo-timed (Phase 16), but tier colors/typography may have accumulated inconsistencies across components built in different phases.

OBJECTIVE
Establish and consistently apply one shared tier-color/typography system.

TASKS
1. Inspect all current color usage for tiers across `Header`, `PriorityPanel`, `WhyPanel`, and the map layer before changing anything.
2. Define a single shared constants file `/frontend/src/theme/tiers.ts` with one canonical color (and an accessible-contrast text color) per tier, plus consistent iconography/labels.
3. Refactor every component using tier colors to import from this single source, removing any duplicated/inconsistent color logic.
4. Do a basic color-contrast accessibility check (e.g., WCAG AA for text-on-background) for each tier color pairing and adjust if needed.
5. Review overall typography hierarchy (headline sizes, evidence numbers, labels) for consistency and legibility at a glance, given this is meant to be read quickly by judges.

TECHNICAL CONSTRAINTS
- Must not change underlying tier classification logic (Step 25) — this step is presentation only.
- Keep the dark command-center aesthetic established in Step 6.

FILES
Create: `/frontend/src/theme/tiers.ts`. Modify: `Header.tsx`, `PriorityPanel.tsx`, `WhyPanel.tsx`, `HeatMap.tsx`.

VALIDATION
Visually review the app with real Heat Hunt data and confirm consistent, accessible tier coloring throughout.

COMPLETION REPORT
Report: files changed, confirmation of consistent tier system, contrast check results, and next dependency (responsiveness/accessibility pass).
```

### [ ] STEP 48 — Responsiveness & Accessibility Pass

**PURPOSE:** Make sure the demo looks good on the actual presentation screen/resolution and is broadly accessible.

**DEPENDENCIES:** Step 47.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Judging environments vary (laptop screen share, projector, different resolutions). The Command Center should remain legible and usable across common presentation setups, and should meet basic accessibility practices.

CURRENT STATE
Tier color/typography system is consistent (Step 47). Responsiveness has only been loosely verified at typical laptop widths (Step 6).

OBJECTIVE
Verify and improve layout responsiveness across common screen sizes, and address basic accessibility gaps.

TASKS
1. Inspect the current layout/CSS before changing anything.
2. Test the Command Center layout at common widths (e.g., 1920×1080 projector, 1440×900 laptop, 1280×720) and fix any overflow/clipping/overlap issues found, particularly in `PriorityPanel` and `WhyPanel` scroll behavior and the map's responsiveness to container resize.
3. Add basic accessibility improvements: semantic HTML where reasonable, ARIA labels on the "RUN HEAT HUNT" button and tier badges, keyboard focus states on interactive zone list items, and alt/aria text on any icon-only controls.
4. Confirm text remains legible at typical projector viewing distance (check font sizes for headline evidence numbers specifically, since these are the "money shot" for judges).

TECHNICAL CONSTRAINTS
- Do not introduce a full mobile-app-grade responsive redesign — focus on realistic presentation environments per project scope (no dedicated mobile app per constraints).
- Do not regress the tier color system from Step 47.

FILES
Modify: relevant component/CSS files as needed based on findings.

VALIDATION
Manually verify the app at the three target resolutions and confirm no layout breakage; verify keyboard navigation reaches the key interactive elements.

COMPLETION REPORT
Report: resolutions tested, issues found and fixed, accessibility improvements made, and next dependency (Phase 18 — Final Testing).
```

---

## [ ] PHASE 18 — FINAL TESTING

### [ ] STEP 49 — Full Automated Test Suite Pass (Backend)

**PURPOSE:** Ensure the entire backend test suite is green and meaningfully covers critical logic.

**DEPENDENCIES:** Step 48.

**ANTIGRAVITY PROMPT**
```
CONTEXT
Before deployment, the full backend test suite (accumulated across every phase) must pass cleanly and cover the genuinely critical logic: spatial tiling/area constraints, FortyGuard client behavior, analytics correctness, Response Gap formula correctness, agent tool delegation, and full-flow integration.

CURRENT STATE
Tests have been written incrementally throughout every phase. A final consolidated review has not been done.

OBJECTIVE
Run the full backend test suite, fix any failures/flakiness, and identify and fill any meaningful coverage gaps in critical logic specifically (not chasing 100% coverage generally).

TASKS
1. Inspect the full `/backend/tests/` directory structure before making changes.
2. Run the complete `pytest` suite; investigate and fix any failing or flaky tests (flaky tests must be fixed, not skipped/deleted, unless genuinely testing something no longer relevant — document any intentional removals).
3. Review test coverage specifically for: the 10 mi² area cap enforcement, coordinate-order validation, native persistence/exceedance usage (never recreated from tcm), historical baseline no-fabrication guarantee, Response Gap formula edge cases, and agent tool delegation (no tool contains original calculation logic). Add tests for any of these found to be under-covered.
4. Run a basic coverage report (`pytest --cov`) and report the overall percentage, without treating raw percentage as the goal — prioritize the critical-path items above.

TECHNICAL CONSTRAINTS
- Do not delete or weaken a test to make it pass — fix the underlying issue or the test's correctness.
- Do not chase 100% coverage on trivial code (e.g., simple Pydantic models) at the expense of time.

FILES
Modify/create tests as needed based on findings.

VALIDATION
Full `pytest` run is green; coverage report generated and reviewed.

COMPLETION REPORT
Report: final test count and pass rate, coverage summary, critical-path coverage confirmation, any fixes made, and next dependency (frontend testing pass).
```

### [ ] STEP 50 — Frontend Test Pass & Failure-Path Testing

**PURPOSE:** Add targeted frontend tests and verify failure paths behave correctly.

**DEPENDENCIES:** Step 49.

**ANTIGRAVITY PROMPT**
```
CONTEXT
The frontend has been built incrementally with manual verification at each step but limited automated testing. Before deployment, key components and failure paths need automated coverage, given the live demo will depend on graceful failure handling.

CURRENT STATE
Frontend components exist and work correctly in manual testing across all prior phases. Minimal/no automated frontend tests exist yet.

OBJECTIVE
Add focused Vitest/React Testing Library tests for the most important components and failure paths, and manually verify remaining failure-path behavior.

TASKS
1. Inspect the current frontend structure and any existing test setup before adding new tests.
2. Set up Vitest + React Testing Library if not already configured.
3. Write tests for: `Header` renders correct tier counts from a given zone list, `PriorityPanel` renders zones in correct rank order and correct tier colors, `WhyPanel` renders evidence fields correctly including the "not available" state for missing fields (from Step 40), and the Heat Hunt polling hook correctly stops polling on terminal status (mocked API responses).
4. Manually verify (documented, not necessarily automated given time constraints) these failure paths in the running app: backend fully unreachable at Heat Hunt start, Heat Hunt job fails mid-run, and a zone with missing vulnerability/resource data (degraded but valid) — confirm each renders a clear, non-broken UI state.
5. Fix any bugs found during this pass.

TECHNICAL CONSTRAINTS
- Prioritize the components most central to the demo (Header, PriorityPanel, WhyPanel, Heat Hunt polling) over exhaustive coverage of every component.

FILES
Create: frontend test files under `/frontend/src/**/__tests__/` or co-located `*.test.tsx` files, per whatever convention the existing setup uses.

VALIDATION
Run the frontend test suite and confirm all pass. Manually verify the three failure-path scenarios above in the running app.

COMPLETION REPORT
Report: tests added and results, manual failure-path verification results, bugs found/fixed, and next dependency (Phase 19 — Deployment).
```

---

## [ ] PHASE 19 — DEPLOYMENT

### [ ] STEP 51 — Production Configuration & Environment Setup

**PURPOSE:** Prepare production-ready config for both backend and frontend.

**DEPENDENCIES:** Step 50.

**ANTIGRAVITY PROMPT**
```
CONTEXT
HeatSentinel needs a simple, reliable production deployment for the live demo — a single backend service and a static/SPA frontend, no microservices/Kubernetes per project constraints.

CURRENT STATE
The app runs correctly in local dev for both backend and frontend. No production configuration exists yet.

OBJECTIVE
Prepare backend and frontend for production deployment with correct environment variable handling, CORS configuration, and build processes.

TASKS
1. Inspect current dev-only configuration (CORS, base URLs, etc.) before changing anything.
2. Configure FastAPI CORS middleware to allow the deployed frontend's origin (via a config variable, not hardcoded), while keeping dev origins working locally.
3. Add a production `requirements.txt`/build check confirming no dev-only dependencies are required at runtime.
4. Configure the frontend build (`npm run build`) to use an environment-variable-driven backend API base URL rather than a hardcoded localhost URL.
5. Write `/docs/deployment.md` documenting: required environment variables for production (`FORTYGUARD_API_KEY`, `ANTHROPIC_API_KEY`, `CENSUS_API_KEY` if used, `DATABASE_URL`, `ALLOWED_ORIGINS`), how to run the production build for both backend and frontend, and the chosen hosting approach (e.g., a single VM/container for backend + Vercel/Netlify for frontend, or equivalent simple PaaS setup) with exact commands.
6. Confirm SQLite database file path/persistence works correctly under the chosen deployment target (document any volume/persistence requirement).

TECHNICAL CONSTRAINTS
- No Kubernetes, no multi-service orchestration — keep deployment as simple as the architecture demands.
- Never hardcode production secrets into any committed file.

FILES
Modify: `/backend/app/main.py` (CORS), frontend env config files. Create: `/docs/deployment.md`.

VALIDATION
Run a local production-mode build for both backend and frontend and confirm they start correctly with production-style environment variables set.

COMPLETION REPORT
Report: configuration changes made, deployment documentation summary, local production-mode verification results, and next dependency (actual deployment + smoke test).
```

### [ ] STEP 52 — Deploy & Smoke Test

**PURPOSE:** Actually deploy to the chosen hosting targets and verify the live URLs work.

**DEPENDENCIES:** Step 51.

**ANTIGRAVITY PROMPT**
```
CONTEXT
This step performs the actual deployment of HeatSentinel's backend and frontend to real hosting, followed by a live smoke test against the deployed URLs.

CURRENT STATE
Production configuration and deployment documentation exist (Step 51). Nothing has been deployed to a live public URL yet.

OBJECTIVE
Deploy both backend and frontend to their chosen hosting targets and confirm a real Heat Hunt run works against the live deployed URLs.

TASKS
1. Inspect `/docs/deployment.md` and current production config before proceeding.
2. Deploy the backend to the chosen target, setting all required production environment variables (real API keys, allowed origins) via the platform's secret management — never committing them to the repo.
3. Deploy the frontend to the chosen target, configured to point at the deployed backend's real URL.
4. Run a live smoke test against the deployed URLs: load the frontend, run a real Heat Hunt, confirm the full flow (scan → agent investigation → ranked zones → WHY panel → recommendation) works against production exactly as it did locally.
5. Confirm HTTPS is used for both frontend and backend if the hosting target supports it by default.
6. Update `/docs/deployment.md` with the final live URLs and any deployment-specific notes/gotchas discovered during the real deploy.

TECHNICAL CONSTRAINTS
- Secrets must be set via the hosting platform's environment/secret configuration, never committed.
- Do not skip the live smoke test — a deployment is not complete until a real Heat Hunt run has been confirmed working on the live URL.

FILES
Modify: `/docs/deployment.md` with final URLs/notes.

VALIDATION
Perform and document a real live Heat Hunt run against the deployed production URLs.

COMPLETION REPORT
Report: live URLs, smoke test results (real Heat Hunt confirmed working live), any deployment issues encountered and resolved, and next dependency (Phase 20 — Final Audit).
```

---

## [ ] PHASE 20 — FINAL AUDIT

### [ ] STEP 53 — Full Specification Audit

**PURPOSE:** Verify the entire deployed product against the original HeatSentinel specification, line by line.

**DEPENDENCIES:** Step 52.

**ANTIGRAVITY PROMPT**
```
CONTEXT
This is the final audit step. The complete HeatSentinel specification (core problem framing, signature features — Heat Hunt, Adaptive Agentic Spatial Investigation, Response Gap — evidence-first design, scientific integrity constraints, Phoenix-primary/NYC-secondary scoping, and the Definition of Done) must be verified against the actual deployed, live product.

CURRENT STATE
The full product is built, tested, and deployed live (Phase 19).

OBJECTIVE
Produce a final, honest audit report confirming which specification requirements are genuinely met, partially met, or not met, using the live deployed product as ground truth.

TASKS
1. Re-read the full original specification context (core problem, signature features, agent architecture, evidence-first design, scientific integrity language rules, Phoenix/NYC scoping, Definition of Done flow).
2. Against the live deployed app, verify and document each of the following with real, current evidence:
   - RUN HEAT HUNT produces the full documented flow (tiling → scan → hotspots → agent selection → refinement → re-query → vulnerability → resources → heat metrics → Response Gap → ranking → evidence → recommendation).
   - The agent genuinely influences investigation targets (not a hardcoded sequence) — cite a real observed trace.
   - Response Gap and its disclaimer language are correctly presented as a project-derived decision-support score, never as an official index/medical prediction.
   - No "forecast" language appears anywhere in the live product.
   - Persistence/exceedance are confirmed to come from FortyGuard's native analytics, not app-side recreation.
   - The 10 mi² area constraint and 60m granularity floor are respected and never misrepresented in UI copy.
   - NYC is present only as a bounded validation artifact, not a second full app.
   - Fallback mode is correctly labeled when triggered.
   - Scientific-integrity language rules ("associated with" not "causes," no mortality-prediction claims) are followed throughout all UI copy and generated recommendation text — spot-check several real Heat Hunt runs' recommendation text for compliance.
3. Compile findings into `/docs/final_audit.md`, explicitly marking each requirement as MET / PARTIALLY MET / NOT MET with real supporting evidence or a clear gap description for anything not fully met.
4. If any critical-path item (per Part 4 of this roadmap) is NOT MET, flag it clearly as a pre-demo blocker requiring immediate attention outside this roadmap's normal sequencing.

TECHNICAL CONSTRAINTS
- This is an audit step — do not silently "fix" issues found without explicitly reporting them first; report first, then remediate only clear, low-risk fixes, flagging anything larger for explicit follow-up.

FILES
Create: `/docs/final_audit.md`.

VALIDATION
The audit report itself, grounded in real, current, live-product evidence for every claim.

COMPLETION REPORT
Report: full audit findings (MET/PARTIALLY MET/NOT MET per requirement), any blockers flagged, remediation performed if low-risk, and confirmation of overall readiness for judging.
```

---

# PART 4 — CRITICAL PATH

**Minimum sequence required for a judgeable MVP** (skipping this sequence breaks the core product):

```
Step 1  (Repo discovery)
  → Step 2–5 (Foundation: structure, config, logging, backend skeleton)
  → Step 6  (Frontend shell)
  → Step 7  (FortyGuard access verified)
  → Step 8  (Phoenix target area)
  → Step 9–10 (FortyGuard models + client)
  → Step 13–15 (AOI tiling, multi-AOI scan, hotspot detection)
  → Step 17–19 (Native persistence/exceedance, anomaly, normalized zone metrics)
  → Step 20–23 (Census vulnerability + cooling resources + spatial joins)
  → Step 24–25 (Response Gap formula + ranking)
  → Step 27–29 (Pipeline integration + API + UI — FIRST VERTICAL SLICE)
  → Step 33–35 (Agent tools + orchestration loop + adaptive prompt tuning)
  → Step 36–37 (Heat Hunt job model + API)
  → Step 38–40 (UI wired to real Heat Hunt, live agent activity, evidence/recommendation display)
  → Step 41  (Full integration verification)
  → Step 43  (Fallback/demo mode — required for judging-day reliability)
  → Step 46  (Demo flow assembled and timed)
  → Step 52  (Deployed + live smoke tested)
```

This matches the spec's stated critical path: **Repository → FortyGuard → Phoenix AOIs → Heat analysis → Vulnerability → Resources → Response Gap → Agent → Heat Hunt → Map → Evidence → Recommendation.**

**First working vertical slice:** completed at **Step 29** (Phoenix → tiled AOIs → FortyGuard → tcm/persistence/exceedance/anomaly → Census vulnerability → cooling resources → Response Gap → basic ranking → real map/panel display). Everything before Step 29 is pure enablement; everything after Step 29 makes the product agentic, resilient, and demo-ready rather than just "working."

---

# PART 5 — OPTIONAL FEATURES

Safe to skip or defer without breaking the core product:

- **Phase 7 (NYC Validation) — Steps 30–32.** Strengthens the "Data Analysis & Correlation" track narrative but is not required for the core Heat Hunt loop. Cut first if time is short.
- **Tree canopy data integration (part of Step 40).** Explicitly designed with an honest fallback ("not available") — safe to skip and label rather than build.
- **Satellite / street-view / heat-intelligence enrichment (mentioned in spec, no dedicated step above).** Only ever add after the core Heat Hunt loop works; not included in the core 53-step path, deliberately.
- **Demo-mode manual toggle (Step 46, task 2).** The three-tier automatic fallback (Step 43) is the real safety net; the manual toggle is a nice-to-have.
- **`pip-audit`/`npm audit` remediation beyond high-severity issues (Step 44).** Fix high-severity only under time pressure.
- **Frontend automated test breadth (Step 50).** The manual failure-path verification matters more than automated coverage breadth under time pressure.
- **Full WCAG-grade accessibility pass (Step 48).** Basic contrast/ARIA is worth keeping; deep accessibility audit can be cut.
- **Rate limiting on `/api/heat-hunt/start` (Step 44, task 6).** Documented as a recommendation, not required to implement given single-demo scope.
- **Redis/PostgreSQL migration.** Never justified within this timeline; SQLite is sufficient throughout.

**Never cut:** Phase 2 (FortyGuard), Phase 3 (Spatial/10 mi² tiling), Phase 6 (Response Gap), Phase 8–9 (Agent + Heat Hunt), Step 43 (Fallback), Step 46 (Demo flow), Step 52 (Deployment). These are the product.

---

# PART 6 — DAY-BY-DAY PLAN

| Day | Steps | Focus |
|---|---|---|
| **Day 1** | 1–12 | Repo discovery, foundation (structure/config/logging/skeletons), frontend shell, FortyGuard access verification, Phoenix target area, FortyGuard models/client, first real API-wired call, heat layer visualization. **Goal: prove the live data path.** |
| **Day 2** | 13–19 | AOI tiling, multi-AOI scan, hotspot detection, refinement, native persistence/exceedance, historical baseline/anomaly, normalized zone metrics + caching. |
| **Day 3** | 20–29 | Census vulnerability ingestion, cooling resource ingestion, spatial joins, resource coverage, Response Gap formula + ranking + sensitivity tests, **full pipeline integration, API, and UI wiring — first working vertical slice (Step 29).** |
| **Day 4** | 30–37 (30–32 optional/parallel) | NYC validation (if time allows, otherwise defer/skip), agent tool schemas, orchestration loop, adaptive-investigation prompt tuning, Heat Hunt job model, Heat Hunt API endpoints. |
| **Day 5** | 38–46 | Real Heat Hunt UI wiring, live Agent Activity Panel, evidence/recommendation completeness pass, full integration test, reliability hardening (retries/timeouts), fallback/demo mode, demo flow assembly and timing. |
| **Day 6** | 47–53 | UI polish (tier system, responsiveness/accessibility), final backend + frontend testing, production configuration, deployment + live smoke test, final specification audit, demo rehearsal. **No new architecture — bugs, reliability, polish only.** |

If Day 3 or Day 4 slip, cut Steps 30–32 (NYC) first, then trim Phase 17 polish scope on Day 6 — never cut Phase 2, 3, 6, 8, or 9.

---

# PART 7 — FINAL DEFINITION OF DONE

The application is accepted as complete when **all** of the following are true against the **live deployed product**:

- [ ] Clicking **RUN HEAT HUNT** in the deployed UI triggers a real, live FortyGuard-backed investigation (not mock/hardcoded data) by default.
- [ ] The Phoenix target area is genuinely divided into multiple AOIs, each verified ≤10 mi², before any FortyGuard call is made.
- [ ] FortyGuard data is retrieved via the documented async submit → activity_id → poll → completed workflow, entirely through the single `FortyGuardClient` module.
- [ ] Hotspots are detected from real scanned data using a documented, non-fabricated threshold method.
- [ ] The LLM agent genuinely selects which hotspots to investigate further — verified via a real observed tool-call trace, not a hardcoded sequence.
- [ ] At least one hotspot polygon is refined and re-queried against FortyGuard at the refined scale, with no claims of sub-60m thermal resolution anywhere in code or UI.
- [ ] Persistence and exceedance values come from FortyGuard's native `analytic_type` calculations, never recreated from raw tcm data.
- [ ] Heat anomaly is calculated as current-minus-documented-historical-baseline, with `baseline_available: false` (never a fabricated value) when real historical data isn't available; the word "forecast" appears nowhere in the product.
- [ ] Real Census/ACS vulnerability data (population, elderly %, socioeconomic indicator) is spatially joined to zones via area-weighted aggregation, with source geography IDs retained for evidence.
- [ ] Real cooling/hydration resource data is used to compute nearby resource counts/distances per zone.
- [ ] Response Gap is calculated via the documented, transparent formula combining Heat Exposure × Vulnerability × Resource Deficit, and is displayed everywhere alongside its "not an official public-health index" disclaimer.
- [ ] Zones are ranked and classified into CRITICAL/HIGH/MODERATE/LOW tiers, rendered consistently on the map, header, and priority panel using one shared color system.
- [ ] Selecting a zone opens a WHY panel exposing the full real evidence trail: heat metrics, vulnerability sources, resource sources, and Response Gap component breakdown.
- [ ] Every finalized zone displays a recommended action traceable to a deterministic action category, phrased by the LLM but not inventing facts.
- [ ] The Agent Activity Panel displays real, live progress events matching the actual backend tool-call trace of the running Heat Hunt job.
- [ ] If the live path fails, the app automatically and visibly falls back to cached data, then to a clearly-labeled deterministic demo scenario — never presenting fallback data as live without labeling.
- [ ] NYC appears only as a bounded validation artifact (if built) — no second full Phoenix-equivalent pipeline exists for NYC.
- [ ] All scientific-integrity language rules are followed throughout the live product: "associated with" not "causes"; no mortality-prediction claims; Response Gap never called an official index.
- [ ] The full flow completes within the demo's realistic 3–5 minute window on the live deployed product, confirmed via a timed rehearsal.
- [ ] The application is deployed to live public URLs (backend + frontend), confirmed via a real end-to-end smoke test on those URLs, not just localhost.
- [ ] `/docs/final_audit.md` exists and confirms every item above as MET against the live product, with no unresolved critical-path blockers.
