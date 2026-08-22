---
type: project
created: 2026-07-18
updated: 2026-07-18
---

# Technical Decisions

- Component metadata uses SemVer while the toolkit release keeps CalVer.
- `manifest.json` and `manifest.lock.json` must remain synchronized with component frontmatter.

## HeatSentinel AI Technical Decisions (2026-08-22)

### Stack
- Frontend: React 19 + Vite + TypeScript + Tailwind v4 + MapLibre GL JS + React Query
- Backend: Python 3.11+ + FastAPI + Uvicorn (modular monolith — no microservices)
- Geospatial: Shapely only at Phase 1; defer GeoPandas decision to Phase 3
- Storage: SQLite file-based; no PostgreSQL for 6-day MVP
- LLM: **Gemini** (currently configured in `.env.example`). Will migrate to Anthropic later when the API key is available.
- Testing: pytest + pytest-asyncio (backend); Vitest (frontend, future)

### FortyGuard API Decisions
- Auth: Header `api-key: KEY` (not Bearer)
- Coordinates: ALWAYS [longitude, latitude] order — validate at model layer
- Forecast: end_time up to now+12h is supported — use for Response Planner page
- Persistence: use native `analytic_type=persistence` — no custom formula
- All endpoints available (Premium hackathon plan): heatmap, env_params, satellite, streetview, heat_intelligence
- FortyGuard client: single centralized service — never call endpoints from routers or agent directly

### Architecture Principles (from System Design doc)
- LLM = orchestrator only. Never lets LLM calculate metrics.
- All heat/vulnerability/gap math: deterministic Python with unit tests
- Evidence-first data model: every zone has sources + evidence block from creation
- Fallback modes: live | cached | demo — threaded from Phase 1, not retrofitted
- AOI tiling: Phoenix tiles into ≤10 mi² AOIs before any FortyGuard call
