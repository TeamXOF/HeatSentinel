---
type: project
created: 2026-08-26
updated: 2026-08-26
---

# HeatSentinel AI — Project Working & State Analysis

This document consolidates the entire context of the HeatSentinel AI project, combining architecture, technology stack, business logic, current stability state, and known flaws to provide complete context to any AI assistant working on the codebase.

## 1. Project Overview & Mission
**HeatSentinel AI** is an autonomous municipal heat resilience and tactical response platform built for the **FortyGuard Hackathon '26**. Rather than merely rendering static temperature heatmaps, HeatSentinel dynamically investigates hyperlocal thermal anomalies, overlays socio-demographic vulnerability indices (US Census ACS 5-Year data), computes planar accessibility to protective infrastructure (MAG Cooling Centers), and outputs a transparent, reproducible **Response Gap (R)** priority score to direct emergency interventions where heat is most likely to harm human life.

## 2. Technology Stack & Architectural Decisions
The application functions as a **Modular Monolith**.

### Frontend
- **Framework:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS v4
- **State/Data Fetching:** React Query
- **Mapping:** MapLibre GL JS

### Backend
- **Framework:** Python 3.11+ + FastAPI + Uvicorn
- **Architecture:** Modular monolith (no microservices)
- **Geospatial Processing:** Pure `Shapely` in Python (deferring GeoPandas/vectorized libraries to Phase 3)
- **Database/Storage:** File-based SQLite with 0ms Observation Cache (no PostgreSQL for the 6-day MVP)

## 3. Current State & Stability
HeatSentinel AI is in a highly mature state (Phases 1 through 16 are complete).
- **Backend:** 103/103 tests (pytest) are passing.
- **Frontend:** 55/55 manual Playwright tests covering all 10 pages passed successfully.
- **Reliability:** A robust 3-tier Fallback Shield (Live → Cached <24h → Deterministic Demo Scenario) is actively protecting the application from third-party API failures during the live demo. The live FortyGuard `/v1/heatmap` and `/v1/heat_intelligence` endpoints are fully integrated and functional.

## 4. The Complete Working Process (End-to-End Flow)

### Phase A: Target Designation & Tiling
1. The user triggers an analysis via the **Frontend Command Center**.
2. The `FastAPI` backend receives the request at `/api/analysis/basic-scan`.
3. **Spatial Engine (`spatial_engine.py`)**: Because FortyGuard caps requests at 10 mi² per call, the spatial engine dynamically tiles the Phoenix target boundary into smaller, valid polygon grid cells (using `[longitude, latitude]` strict ordering).

### Phase B: Data Ingestion & Analytics
4. **FortyGuard Client**: The backend makes concurrent async requests to the FortyGuard API (`Premium` plan, Header auth) using a Submit-and-Poll pattern. Responses are cached via SHA-256 hashes in an SQLite database.
5. **Analytics Engine**: Deterministic Python code analyzes the thermal data. It calculates **Heat Exposure (E)** by comparing the live data against a 5-day historical baseline (using the `tcm` endpoint) and native `persistence` metrics.
6. **Hotspot Clustering**: `DBSCAN` algorithms group the hottest points into isolated anomaly clusters/zones using convex-hull buffering (EPSG:6933).

### Phase C: Contextual Enrichment
7. **Vulnerability Service**: Using EPSG:2223 area-weighted spatial joins, the backend overlays the identified hotspots with local 2022 US Census ACS 5-Year demographic data (tracking population density, senior citizens, and SVI). This yields the **Vulnerability Score (V)**.
8. **Resource Service**: A planar proximity search checks for active MAG Cooling Centers within a 1-mile walkable buffer to determine the **Resource Deficit Score (D)**.

### Phase D: Priority Engine & Scoring
9. **Priority Engine**: The system deterministically calculates the **Response Gap (R)** using the core formula:  
   `R = 0.40 * E + 0.35 * V + 0.25 * D`
10. Zones are assigned strict Priority Tiers (`CRITICAL`, `HIGH`, `MODERATE`, `LOW`) based on this `R` score.

### Phase E: Autonomous Heat Hunt (Agent Layer) & PDF Intel
11. **Agent Orchestration**: For `CRITICAL` or user-selected zones, the **HeatHuntOrchestrator** is triggered.
12. The LLM (currently Gemini) acts strictly as an investigator (never doing the math itself). It uses specialized tool-call schemas to pull empirical evidence and streams its progress live back to the frontend's Agent Activity Panel via Server-Sent Events (SSE).
13. **Heat Intelligence PDF**: Users can request a premium async PDF report from FortyGuard's `/v1/heat_intelligence` endpoint, passing in the zone's computed metrics.

## 5. Flaws & Areas for Improvement (Post-MVP Roadmap)

### Flaw 1: Hardcoded Spatial Contexts (Scaling Bottleneck)
- **Current State:** The system heavily relies on static local JSON/GeoJSON files for Phoenix Census data and MAG cooling networks.
- **Improvement:** To scale to other cities (like NYC), the platform needs a **Dynamic Multi-City Selector Engine**. It needs to dynamically ingest boundary boxes and local GIS data rather than relying on bundled `.geojson` files.

### Flaw 2: LLM Agent Rate Limits and Cost
- **Current State:** The `HeatHunt` agent loop can be aggressive. Running multiple autonomous agents concurrently on several target zones will quickly exhaust rate limits or spike API costs.
- **Improvement:** Implement a strict job-queue broker (like Redis/Celery) and batch LLM queries.

### Flaw 3: File-Based SQLite Concurrency
- **Current State:** SQLite is fantastic for a zero-ops hackathon but will face database locking issues (`database is locked`) if multiple users trigger concurrent heat hunts or massive spatial tile writes.
- **Improvement:** Migrate the core storage to **PostgreSQL + PostGIS** for robust concurrent spatial queries and job tracking.

### Flaw 4: Geometrical Math Performance
- **Current State:** Geometric boundaries, buffering, and DBSCAN convex hulls are calculated using pure `Shapely` in Python. Over large areas, this can become a CPU bottleneck.
- **Improvement:** Introduce `GeoPandas` for vectorized spatial processing to drastically reduce computation times during Phase 3 clustering. 

### Flaw 5: Third-Party API Brittle-ness
- **Current State:** The core logic entirely hinges on the FortyGuard API returning timely and accurate satellite telemetry.
- **Improvement:** A true production app needs a data pipeline that pre-fetches and standardizes satellite data asynchronously so the user never waits for a scan to poll.
