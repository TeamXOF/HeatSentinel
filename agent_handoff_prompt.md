# HeatSentinel — Agent Handoff Prompt (Step 40+)

> Copy everything below this line and paste it as your first message to the new agent.

---

You are taking over an active hackathon project called **HeatSentinel AI** — an autonomous heat emergency intelligence system built for the **FortyGuard Hackathon '26**. This is a real, live codebase. Your job is to continue from **Step 40** of the build roadmap. Before writing a single line of code, you must read the entire codebase and memory system to get up to speed.

---

## MANDATORY ONBOARDING — DO THIS BEFORE ANYTHING ELSE

### Step 1 — Read project memory (your primary source of truth)

Read this file first. It contains every architectural decision, phase status, session notes, and resume instructions:

```
d:\[Project]\HeatSentinel\.agents\memory\heatsentinel-project.md
```

Then read the MEMORY.md index:

```
d:\[Project]\HeatSentinel\.agents\memory\MEMORY.md
```

### Step 2 — Read the roadmap

The master build tracker with all 67 steps, their status, and what's been done:

```
d:\[Project]\HeatSentinel\context\heatsentinel_antigravity_roadmap.md
```

Find **Step 40** (search for "STEP 40") and read it carefully — that is your next task.

### Step 3 — Read the system design

This is the technical architecture document explaining every module:

```
d:\[Project]\HeatSentinel\context\HeatSentinel_AI_System_Design.md
```

### Step 4 — Read the FortyGuard API reference

This is the permanent scraped reference for the FortyGuard API (do not re-scrape):

```
d:\[Project]\HeatSentinel\context\fortyguard-api-reference.md
```

### Step 5 — Survey the live codebase structure

Read the following key files in order to understand the current state:

**Backend (Python/FastAPI):**
- `d:\[Project]\HeatSentinel\backend\app\models\zone.py` — Zone model and evidence types
- `d:\[Project]\HeatSentinel\backend\app\agent\tools.py` — All 10 agent tool definitions
- `d:\[Project]\HeatSentinel\backend\app\agent\heat_hunt_service.py` — Job model, ProgressEvent (has `display_name` field), TOOL_DISPLAY_NAMES dict
- `d:\[Project]\HeatSentinel\backend\app\services\pipeline_service.py` — Full pipeline orchestration
- `d:\[Project]\HeatSentinel\backend\app\routers\heat_hunt.py` — Live API endpoints

**Frontend (React/TypeScript):**
- `d:\[Project]\HeatSentinel\frontend\src\types.ts` — All TypeScript interfaces including HeatHuntProgressEvent (has `display_name?: string`)
- `d:\[Project]\HeatSentinel\frontend\src\api\heatHunt.tsx` — HeatHuntProvider context (SSE + polling, USE_MOCK_DATA=false)
- `d:\[Project]\HeatSentinel\frontend\src\components\AgentActivityPanel.tsx` — NEW reusable activity feed (just completed in Step 39)
- `d:\[Project]\HeatSentinel\frontend\src\pages\AgentInsightsPage.tsx` — Agent insights page (now uses AgentActivityPanel)
- `d:\[Project]\HeatSentinel\frontend\src\components\WhyPanel.tsx` — Evidence panel (this is what Step 40 improves)
- `d:\[Project]\HeatSentinel\frontend\src\components\RightRailCards.tsx` — Priority panel area

---

## PROJECT CONTEXT (READ CAREFULLY)

### What HeatSentinel Is

An AI-powered system that autonomously hunts urban heat emergencies in Phoenix, AZ. It:
1. Tiles the Phoenix metro area into 10 mi² cells and calls the FortyGuard thermal API on each
2. Clusters hotspots using DBSCAN
3. Joins Census ACS demographics (elderly %, poverty rate, etc.) for vulnerability
4. Checks MAG Heat Relief network for nearby cooling resources
5. Calculates a **Response Gap Score** (0–10) combining heat exposure + vulnerability + resource deficit
6. Uses an LLM agent (Gemini) to run a 7-phase investigation and rank priority zones
7. Streams the investigation steps live to the frontend via Server-Sent Events (SSE)

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind v4 + MapLibre GL JS + React Query + Recharts |
| Backend | FastAPI + Python 3.13 + SQLite + asyncio |
| Agent | Gemini 3.5-flash-lite (LLM orchestrator only — never calculator) |
| Data | FortyGuard Premium API + Census ACS 5-Yr + MAG Heat Relief network |
| DB | SQLite (file-based, zero-ops) |

### Critical Rules (Never Break These)

1. **LLM = orchestrator only.** All math (Response Gap, vulnerability scores, anomaly detection) is deterministic Python. LLM only calls tools.
2. **No mock data in active flows.** `USE_MOCK_DATA = false`. Real API calls only.
3. **FortyGuard coordinates are [longitude, latitude]** (NOT lat/lon) — validate before every call.
4. **FortyGuard auth is header `api-key: KEY`** (NOT Bearer token).
5. **Area cap is 10 mi² per FortyGuard request** — the Spatial Engine tiles Phoenix.

### Phase Status (as of Step 39 completion)

| Phase | Status |
|---|---|
| Phases 0–10 (Foundation → Backend API) | ✅ Complete |
| Phase 11 Step 38 — Real RUN HEAT HUNT button | ✅ Complete |
| Phase 11 Step 39 — Live AgentActivityPanel | ✅ Complete |
| **Phase 11 Step 40 — Recommendation Display & Evidence Completeness** | **⏳ YOUR TASK** |

### What Was Done in Step 39 (the step before yours)

- `AgentActivityPanel.tsx` was created as a reusable component (extracted from `AgentInsightsPage.tsx`)
- Backend `ProgressEvent` now has `display_name: Optional[str]` populated by `TOOL_DISPLAY_NAMES` dict
- Frontend renders `evt.display_name || evt.message` (backend owns the human-readable label)
- `AgentInsightsPage.tsx` shrunk from 484 → 270 lines

---

## YOUR TASK: STEP 40

Once you have read all the files above, find **Step 40** in the roadmap (`context/heatsentinel_antigravity_roadmap.md`) and read it carefully.

**In summary, Step 40 requires you to:**

1. Inspect the current `Zone` model (`backend/app/models/zone.py`), pipeline output, and `PriorityPanel`/`WhyPanel` before making any changes
2. Confirm whether **tree canopy data** exists anywhere in the pipeline — if not (and if time doesn't allow integration), mark `tree_cover_pct: null` in the Zone model and render "Not available in this analysis" in the UI. **Never fabricate a value.**
3. Ensure `recommend_action` tool output (action category + phrasing) is present on every finalized zone and rendered prominently in `PriorityPanel` under "Recommended:"
4. Ensure `explain_priority` full evidence object (FortyGuard call IDs, Census geography IDs, resource dataset entries, component score breakdown) renders in `WhyPanel` in a clear, structured expandable format
5. Add the Response Gap disclaimer text **next to every displayed Response Gap score** (not just once globally)

---

## CONFIRMATION REQUIRED

Before writing any code, you must:

1. Read all the files listed in the onboarding steps above
2. Reply to me with a **Knowledge Confirmation** in this exact format:

```
KNOWLEDGE CONFIRMED — HeatSentinel Step 40

Phase status: [what you read from memory]
Zone model fields: [list the key fields you found in zone.py]
recommend_action current state: [does it render in PriorityPanel? where?]
explain_priority current state: [does WhyPanel show full evidence? what's missing?]
Tree canopy: [exists in pipeline or not?]
Response Gap disclaimer: [currently shown where?]

Ready to proceed with Step 40 implementation.
```

Do NOT start coding until you have sent this confirmation and I have responded. This protects the hackathon entry from regressions.

---

## REPOSITORY

- **GitHub:** https://github.com/TeamXOF/HeatSentinel
- **Local workspace:** `d:\[Project]\HeatSentinel`
- **Branch:** `main`
- **Backend runs on:** `http://localhost:8000`
- **Frontend runs on:** `http://localhost:3000` (via `npm run dev` in `/frontend`)
- **Backend start:** `uvicorn app.main:app --reload` in `/backend`
