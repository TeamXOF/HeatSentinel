---
type: project
created: 2026-08-22
updated: 2026-08-22
---

# HeatSentinel AI — Project Status & Session Memory

> This file is the single source of truth for HeatSentinel AI project state.
> Any team member or AI session should read this FIRST before starting work.

---

## Project Identity

- **Name:** HeatSentinel AI
- **Subtitle:** Autonomous Hyperlocal Heat Response Intelligence
- **Hackathon:** FortyGuard Hackathon '26
- **Tracks:** Agentic AI (Track 1) + Data Analysis & Correlation (Track 2)
- **Team:** 3 members — AI/LLM engineer, backend developer, frontend/data-viz developer
- **Demo Cities:** Phoenix, AZ (primary) — NYC (secondary/validation only)
- **Deadline:** 6-day build window from hackathon start

---

## Repository

- **GitHub:** https://github.com/TeamXOF/HeatSentinel
- **Local workspace:** `d:\[Project]\HeatSentinel`
- **Default branch:** `main`
- **Active feature branch:** `feature/backend-phase1-foundation`

---

## Architecture (Summary)

```
React Frontend (Vite + Tailwind + MapLibre)
    ↓ REST/JSON polling
FastAPI Backend (Python, modular monolith)
    ↓
Agent Layer (LLM tool-calling loop)
    ↓
Tool Layer: FortyGuard Client | Spatial Engine | Analytics Engine
    ↓          | Vulnerability Service | Resource Service | Scoring Engine
SQLite (run history, metrics, evidence, recommendations)
```

Full architecture: see `context/HeatSentinel_AI_System_Design.md`

---

## What Has Been Built (Phase Status)

| Phase | Status | Owner | Notes |
|-------|--------|-------|-------|
| Phase 0 — Discovery | ✅ Done | AI | Context docs analyzed, API docs scraped, PDF converted |
| Phase 1 — Frontend (Step 6) | ✅ Done | Teammate | Full React command center UI complete (relocated to /frontend) |
| Phase 1 — Backend (Steps 2–5) | ✅ Done | AI | FastAPI skeleton, config, logging, routers, db, models, pytest |
| Phase 2 — FortyGuard client (Steps 7–12) | ✅ Done | AI | Core client, test-scan API, SQLite caching, MapLibre rendering |
| Phase 3 — Spatial Engine (Steps 13–16) | ✅ Done | AI | Tiling, scan orchestration, hotspot detection, refinement |
| Phase 4 — Analytics (Steps 17–19) | ✅ Done | AI | Persistence, Exceedance, Baseline, HeatMetrics, Caching |
| Phase 5 — Phoenix External Data (Steps 20–23) | ✅ Done | AI | Census ACS 5-Yr demographics, MAG Heat Relief resources, area-weighted joins, proximity |
| Phase 6 — Response Gap (Steps 24–29) | ⏳ Next | — | Vulnerability & Deficit formulas, Response Gap scoring, basic-scan endpoint & UI slice |
| Phase 7 — NYC Validation | ❌ Not started | — | Non-blocking |
| Phase 8 — WHY Evidence Trail | ❌ Not started | — | |
| Phase 9 — Interactive UI & Real Heat Hunt | ❌ Not started | — | |
| Phase 10 — Full Agent Integration & Polish | ❌ Not started | — | |

**Current position: Start of Phase 6 (Response Gap Engine)**

---

## Frontend — What Exists

All frontend files in `src/`. Key structure:
- `src/App.tsx` — Routes + providers (QueryClientProvider, HeatHuntProvider, BrowserRouter)
- `src/api/config.ts` — `USE_MOCK_DATA = true` toggle. Flip to `false` when backend is ready.
- `src/api/heatHunt.tsx` — HeatHuntProvider with mock + real backend hook at `POST /api/heat-hunt/start`
- `src/pages/` — 10 pages: Overview, HeatMap, RiskZones, AgentInsights, Events, Resources, ResponsePlanner, Reports, DataExplorer, Settings
- `src/components/` — 13 components including WhyPanel, HyperlocalHeatMapCard, AnalyticsCards
- `src/data/` — Mock data files (to be replaced by real backend calls)
- `src/context/HeatHuntContext.tsx` — Stub context (re-export, real logic in api/heatHunt.tsx)

**Frontend Stack:** React 19 + Vite + TypeScript + Tailwind v4 + MapLibre GL JS + React Query + Recharts + Motion (Framer) + Lucide icons

---

## Backend — What Needs to Be Built

- `/backend/` folder does not exist yet
- Plan: `backend-phase1-foundation.md` in project root (artifact)
- FastAPI on `http://localhost:8000`
- Frontend already expects `POST /api/heat-hunt/start` → `{ jobId: "..." }`
- CORS must allow `http://localhost:3000`

---

## Context Documents

All in `context/` folder:

| File | Purpose |
|------|---------|
| `heatsentinel_antigravity_roadmap.md` | **MASTER TRACKER** — 67 sequential build steps with Antigravity prompts |
| `HeatSentinel_AI_Context_Handoff.md` | WHY we're building it, product decisions, corrections |
| `HeatSentinel_AI_System_Design.md` | HOW each component works — technical architecture |
| `fortyguard-api-reference.md` | **NEW** — FortyGuard API scraped & documented (permanent reference, don't re-scrape) |
| `fortyguard-participant-handbook.md` | **NEW** — Hackathon rules, judging, API access, PDF converted to MD |
| `API - Docx .txt` | Original link list (superseded by fortyguard-api-reference.md) |
| `FortyGuard_Hackathon_Participant_Handbook.pdf` | Original PDF (superseded by fortyguard-participant-handbook.md) |

---

## Key Technical Decisions (HeatSentinel-specific)

### FortyGuard API
- **Premium plan** — all endpoints available including satellite, streetview, heat_intelligence
- **Auth:** Header `api-key: YOUR_KEY` (NOT Bearer token)
- **Async pattern:** Submit → `activity_id` → poll `/v1/status/{id}` → result
- **Area cap:** 10 mi² per request (applies to all plans) → Spatial Engine tiles Phoenix
- **Coordinate order:** [longitude, latitude] — NOT lat/lon. Validate before every call.
- **Forecast support:** ✅ `end_time` up to now+12h — Context Handoff §11/18/19/28 was WRONG about "no forecast"
- **Persistence metric:** native `analytic_type=persistence` — no custom formula needed
- **Heat Intelligence:** Premium PDF report endpoint — powers WHY panel per zone

### Architecture
- Modular monolith (not microservices) — 6-day hackathon constraint
- LLM = orchestrator only, never calculator. All math in deterministic Python.
- SQLite (file-based, zero-ops) for persistence
- In-process dict job store initially, Redis only if needed Day 5-6
- No GeoPandas at Phase 1 (defer to Phase 3 when AOI math needs it)

### Resolved Questions
- ✅ **LLM choice:** Gemini for now. Will migrate to Anthropic later when the API key is available.

---

## Git State

```
main
├── b1d2ffd  chore: move context docs into context/ folder
└── b0018b4  chore: initial commit — frontend UI + context folder + gitignore setup

feature/backend-phase2-fortyguard  ← CURRENT BRANCH (local only)
feature/backend-phase1-foundation
```

### .gitignore — What Gets Tracked
- ✅ Tracked: `src/`, `context/`, `.agents/memory/`, `.env.example`, `package.json`, etc.
- 🚫 Ignored: `.agents/skills/`, `.agents/workflows/`, `.agents/agent/`, `.agents/rules/`, `.agents/scripts/`, all manifests

---

## Session Notes

### Session 2026-08-22 (Setup Session)
- Pulled latest `main` from GitHub (teammate's frontend UI)
- Identified that GitHub repo already had 5 commits from teammate's push
- `.gitignore` fixed to protect AG Kit skills/workflows while keeping `memory/` tracked
- Three context docs moved from root → `context/` folder (tracked with git mv)
- Two new context docs created:
  - `context/fortyguard-api-reference.md` — All FortyGuard API endpoints fully documented
  - `context/fortyguard-participant-handbook.md` — PDF converted to markdown
- Corrected a key error: Context Handoff said "no forecast" but API actually supports +12h forecast
- Created feature branch `feature/backend-phase1-foundation`
- Fully implemented Phase 1 Backend Foundation (config, models, db, errors, routers)
- Verified all endpoints and smoke tests passed successfully (100%)
- Marked Steps 2-5 as complete in roadmap
- Branched to `feature/backend-phase2-fortyguard`
- What's next: Build FortyGuard API Client (Step 7)

### Session 2026-08-22 (Phase 2 - FortyGuard Integration)
- Built `FortyGuardClient` class connecting to the real FortyGuard `/api/v1/scan` and `/api/v1/status` endpoints.
- Implemented robust `aiohttp`/`httpx` asynchronous fetching with built-in polling and rate limit handling.
- Defined a deterministic target area (Phoenix Downtown Polygon).
- Implemented SQLite caching for FortyGuard API responses to minimize API calls using SHA-256 request hashing.
- Built `POST /api/fortyguard/test-scan` FastAPI route that returns cached or live data.
- Built integration tests for FortyGuard endpoints (`test_fortyguard_client.py` & `test_fortyguard_api.py`) passing 100%.
- Wired frontend `HyperlocalHeatMapCard.tsx` to `POST /api/fortyguard/test-scan` using TanStack React Query.
- Rendered FortyGuard GeoJSON responses as a beautiful MapLibre `fill` layer interpolating temperature dynamically.
- Steps 7-12 are complete. Phase 2 is finished!
- What's next: Start Phase 3 (Spatial Engine) to tile Phoenix.

### Session 2026-08-22 (Phase 3 - Spatial Engine)
- Built deterministic 10 mi² grid tiling algorithm for the Phoenix target area (`spatial_engine.py`).
- Built async scan orchestration (`scan_service.py`) to hit FortyGuard API concurrently across multiple tiles.
- Built hotspot detection logic using DBSCAN clustering (`hotspot_service.py`) to isolate top 20% hot cells.
- Implemented hotspot polygon refinement logic with geometric buffers (EPSG:6933).
- Added `scikit-learn` to backend dependencies for clustering.
- All Phase 3 steps (13-16) are complete and unit tested.
- What's next: Start Phase 4 (Heat Analytics).

### Session 2026-08-22 (Phase 4 - Heat Analytics)
- Built Native Persistence & Exceedance Analytics wrapper in `analytics_engine.py` (Step 17).
- Replaced hardcoded threshold assumptions with a dynamic, climate-aware threshold.
- Built Historical Baseline constructor (`get_historical_baseline`) using a 5-day concurrent lookback on `tcm` endpoint (Step 18).
- Implemented robust `calculate_anomaly` fallback to prevent fabricating data if the baseline is unavailable.
- Created `HeatMetrics` unified model in `zone.py` and implemented `compute_zone_heat_metrics` caching (Step 19).
- Documented methodology in `docs/methodology.md`.
- All Phase 4 steps are complete and unit tested.

### Session 2026-08-23 (Phase 5 - Phoenix External Data & Resources)
- Moved frontend codebase to `/frontend` conforming strictly to project specifications.
- Ingested real 2022 Census ACS 5-Year demographic tracts for Phoenix corridor (`census_phoenix.geojson`).
- Ingested 10 verified MAG Heat Relief Network cooling/hydration/respite points (`phoenix_cooling_resources.geojson`).
- Implemented `vulnerability_service.py` with area-weighted demographic spatial joins via EPSG:2223 projection.
- Implemented `resource_service.py` with planar proximity analysis (nearest cooling center, 1-mile search buffer).
- Updated scientific documentation in `docs/methodology.md`.
- Wrote unit tests for vulnerability and resource services (`test_vulnerability_service.py` & `test_resource_service.py`).
- All 37 backend tests passing 100%.
- What's next: Start Phase 6 (Response Gap Engine - Steps 24-29).

### Open Items Before Coding Starts
1. ❓ **LLM choice:** Gemini (`.env.example` has key slot) or Anthropic (roadmap says this)? — User to decide
2. ❓ **FortyGuard API key:** User has it — will add to `.env` when backend config is ready
3. ❓ **Deployment target:** Render/Railway for backend? Vercel for frontend?

---

## Resume Instructions

To resume in a new session:
```
Read .agents/memory/heatsentinel-project.md first.
We are on branch feature/phase-5-external-data.
Phase 5 (Phoenix External Data) is 100% complete.
Next task: Start Phase 6 - Response Gap Engine (Steps 24-29).
Context Handoff + System Design + Roadmap are in context/ folder.
```

