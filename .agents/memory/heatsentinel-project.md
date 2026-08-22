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
| Phase 1 — Frontend (Step 6) | ✅ Done | Teammate | Full React command center UI complete |
| Phase 1 — Backend (Steps 2–5) | 🔴 Not started | **Next task** | FastAPI skeleton, config, logging, router stubs |
| Phase 2 — FortyGuard client (Steps 7–12) | ❌ Not started | — | |
| Phase 3 — Spatial Engine (Steps 13–17) | ❌ Not started | — | |
| Phase 4 — Analytics (Steps 18–22) | ❌ Not started | — | |
| Phase 5 — Agent Loop (Steps 23–28) | ❌ Not started | — | |
| Phase 6 — Vulnerability (Steps 29–33) | ❌ Not started | — | |
| Phase 7 — NYC Validation | ❌ Not started | — | Non-blocking |
| Phase 16 — Demo Mode | ❌ Not started | — | |

**Current position: Start of Step 2 (Monorepo Backend Skeleton)**

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

feature/backend-phase1-foundation  ← CURRENT BRANCH (local only, not pushed)
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
- **No backend code written yet** — plan created, awaiting LLM choice confirmation
- What's next: Build `/backend/` Python/FastAPI skeleton (Task 1 of plan)

### Open Items Before Coding Starts
1. ❓ **LLM choice:** Gemini (`.env.example` has key slot) or Anthropic (roadmap says this)? — User to decide
2. ❓ **FortyGuard API key:** User has it — will add to `.env` when backend config is ready
3. ❓ **Deployment target:** Render/Railway for backend? Vercel for frontend?

---

## Resume Instructions

To resume in a new session:
```
Read .agents/memory/heatsentinel-project.md first.
We are on branch feature/backend-phase1-foundation.
Next task: Build backend/ FastAPI skeleton (Phase 1, Steps 2-5).
Context Handoff + System Design + Roadmap are in context/ folder.
API reference is in context/fortyguard-api-reference.md — do not re-scrape.
```
