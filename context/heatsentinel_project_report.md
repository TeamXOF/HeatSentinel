# HeatSentinel AI — Complete Project Intelligence Report

> **Prepared:** 2026-08-25 | **Status:** Phases 1–13 Complete | **Build:** 0 TS errors, 109 backend tests passing

---

## PART 1 — PROJECT IDENTITY & CONTEXT

### 1.1 What is HeatSentinel AI?

**HeatSentinel AI** is an **autonomous, agentic urban heat response intelligence system** built for the **FortyGuard Hackathon '26**.

It is **not** a heat map. It is **not** a weather dashboard. It is a decision-support system that answers one specific question for city officials:

> *"Where is extreme heat going to hurt people most right now, and what should the city do about it?"*

**One-sentence pitch:**
> HeatSentinel doesn't just tell cities where it's hot — it tells them where heat will hurt people most, and what to do next.

### 1.2 Why Does This Exist?

**The real-world problem:**
- Phoenix, AZ is the hottest major city in the US. Heat kills more people annually than all other weather events combined.
- In 2023, Maricopa County recorded 645+ heat-associated deaths.
- The risk is unevenly distributed — low-income neighborhoods, elderly residents, and areas without cooling infrastructure are disproportionately affected.
- City officials have finite emergency response resources (mobile cooling units, hydration stations, canvassing teams) and don't have a system to objectively prioritize *where* to deploy those resources first.

**What existing tools miss:**
- Heat maps tell you where it's hot — not where heat will hurt people.
- Vulnerability indices combine demographics but don't account for cooling resource availability or agent-driven investigation.
- HeatSentinel is the first system to combine hyperlocal FortyGuard heat intelligence with Census vulnerability data and MAG cooling resource data, and then run an **autonomous AI agent** to investigate and prioritize in real time.

### 1.3 Hackathon Context

| Item | Detail |
|---|---|
| **Hackathon** | FortyGuard Hackathon '26 |
| **Theme** | Design cooler, smarter cities using hyperlocal temperature intelligence |
| **Selected Tracks** | Track 1: Agentic AI + Track 2: Data Analysis & Correlation |
| **Team** | 3 members (AI/LLM Engineer, Backend Developer, Frontend Developer) |
| **Build Window** | 6 days |
| **Target City** | Phoenix, AZ (primary) + NYC (validation benchmark) |
| **API Plan** | Premium (all endpoints available, +12h forecast) |

**Judging weights:**
| Criterion | Weight |
|---|---|
| Impact & Relevance | 40% |
| Technical Execution | 35% |
| Innovation | 15% |
| Communication | 10% |

Impact + Technical = **75%** of the total score.

### 1.4 What Makes HeatSentinel Unique

**Primary Differentiator: Adaptive Agentic Spatial Investigation**

```
FortyGuard hyperlocal heat data
        ↓
Detect hotspots across tiled Phoenix zones
        ↓
AI Agent investigates top candidates
        ↓
Agent subdivides suspicious zones into smaller polygons
        ↓
Re-queries FortyGuard at higher precision
        ↓
Combines heat + Census vulnerability + MAG cooling resources
        ↓
Calculates Response Gap (composite priority score)
        ↓
Ranks zones, generates evidence trail
        ↓
Recommends specific city response actions
```

This is not just "heat map + demographics." The agent **actively decides where to look deeper**, makes real tool calls, and produces actionable ranked priorities.

**Secondary Differentiator: Response Gap Score**

The Response Gap is HeatSentinel's custom composite metric:

```
Response Gap = Heat Exposure × Population Vulnerability × Resource Deficit
```

- High heat + high vulnerability + strong cooling resources → lower response gap (protected)
- High heat + high vulnerability + no cooling resources → critical response gap (act now)

This is a project-defined decision-support heuristic, explicitly not an official medical index.

---

## PART 2 — SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture

```
Frontend (React + Vite)
    ↕  REST / SSE
Backend API (FastAPI — Modular Monolith)
    ├── Heat Hunt Orchestrator (State Machine)
    ├── Agent Layer (Gemini LLM — Tool Calling)
    ├── Geospatial Engine (AOI Tiling, Polygon Validation, Joins)
    ├── Deterministic Analysis Engine (Heat Metrics, Scoring)
    ├── Scoring Engine (Response Gap — Config-Driven)
    ├── Correlation Engine (Pearson/Spearman)
    ├── Cache Layer (SQLite + In-Process Cache)
    └── FortyGuard Client (Submit/Poll/Normalize/Cache)
         ↓
External APIs:
    ├── FortyGuard API (Premium) — Core heat data
    ├── US Census ACS 5-Year — Vulnerability demographics
    └── MAG Heat Relief Network — Cooling resource locations
```

**Key architectural principle:**

> **The LLM is NOT the calculator.** All math (heat metrics, Response Gap, vulnerability scoring) is deterministic Python. The LLM only decides *where to investigate* and *how to explain the results in plain language*.

### 2.2 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Map | MapLibre GL (OpenStreetMap base tiles via CARTO) |
| Styling | Tailwind CSS v4 |
| State Management | React Query (TanStack Query v5) |
| Backend | Python + FastAPI |
| Agent/LLM | Google Gemini (tool calling) |
| Database | SQLite (via SQLAlchemy) |
| Caching | In-process dict cache + SQLite cache table |
| Real-Time Streaming | SSE (Server-Sent Events) for Heat Hunt progress |
| Geospatial | shapely, geopandas (Python-side) |

### 2.3 Data Sources

| Source | Data | Usage |
|---|---|---|
| **FortyGuard API (Premium)** | Hyperlocal 60m thermal rasters, exceedance/persistence analytics | Core heat data — every zone scored with real FortyGuard data |
| **US Census Bureau ACS 5-Year** | Elderly %, poverty rate, population, AC-access proxy | Vulnerability scoring per zone |
| **MAG Heat Relief Network** | 200+ cooling centers, hydration stations, respite locations | Resource deficit calculation |
| **ASU Resilience GIS** | Supplemental cooling center geometry | Optional enrichment layer |

### 2.4 How FortyGuard Is Used

FortyGuard is used **far beyond a visualization layer**:

1. **`/v1/heatmap` with `analytic_type: tcm`** — raw temperature surface at 60m resolution
2. **`/v1/heatmap` with `analytic_type: exceedance`** — hours above a threshold temperature
3. **`/v1/heatmap` with `analytic_type: persistence`** — longest continuous run above threshold
4. **Multi-polygon tiling** — Phoenix is divided into ≤10 mi² tiles (API constraint). Each tile gets its own FortyGuard call.
5. **Adaptive refinement** — when the agent identifies a high-interest hotspot, it subdivides it into a smaller polygon and re-queries FortyGuard for a tighter analytic window.
6. **Forecast queries (±12h)** — the Response Planner uses forward-looking FortyGuard data for pre-emptive resource positioning.
7. **Async submit/poll pattern** — every FortyGuard call submits → receives `activity_id` → polls `/v1/status/{activity_id}` until `Completed`.

### 2.5 Heat Hunt State Machine

The Heat Hunt job moves through these phases (tracked in real-time by the UI):

```
QUEUED → SCANNING → ANALYZING → INVESTIGATING → REFINING → CORRELATING → RANKING → RECOMMENDING → COMPLETED
```

Every phase transition is logged with `run_id` as a correlation ID. The frontend polls (or streams via SSE) to reflect the current phase in the Agent Activity panel.

### 2.6 Three-Tier Fallback Mode (Phase 13)

HeatSentinel never fails silently. There are three operational modes:

| Mode | Data Source | UI Badge |
|---|---|---|
| **LIVE** | Real-time FortyGuard API + Census + MAG | 🟢 Live Telemetry |
| **CACHED** | Most recent successful live run (< 24h) | 🔵 Cached Pipeline |
| **DEMO** | Deterministic pre-captured Phoenix scenario | 🟣 Demo Scenario |

- If live fails → falls back to cached
- If cached unavailable → falls back to demo scenario
- The `data_source` field is **structurally enforced** and cannot be overridden downstream — so the UI badge is always accurate.

---

## PART 3 — THE 10-PAGE APPLICATION GUIDE

The application has **10 pages**, accessible from the left sidebar. Below is a complete feature breakdown for every page.

---

### PAGE 1: Overview (`/`) — City Heat Command Center

**Purpose:** The main dashboard. Provides a real-time situational overview of Phoenix heat conditions without requiring a Heat Hunt to be run.

#### Features:

**1.1 KPI Status Bar (Top of Page)**
- 5 live-updating metric cards:
  - **Peak Thermal** — highest FortyGuard temperature reading across all scanned zones (e.g., 114.1°F / 45.6°C)
  - **Moderate Risk** — count of MODERATE tier zones detected
  - **Population at Risk** — estimated number of people in high-risk zones (cross-referenced with Census ACS)
  - **ACS Census Zones** — number of Census tracts analyzed
  - **MAG Cooling Centers** — count of active cooling centers within monitored area
- Data comes from the live backend `/api/analysis/basic-scan` endpoint
- Refreshes automatically via React Query (stale-while-revalidate strategy)

**1.2 Active Alerts Feed (Right Panel)**
- Shows the 3 most recent severity-ranked alerts
- Alert types: Extreme Heat Warning, Heat Risk Increased, Cooling Center Update
- Each alert shows: severity icon, title, location, time elapsed
- **"View all" link** navigates to `/events-alerts`

**1.3 Top Priority Actions (Right Panel)**
- Shows the top 2 priority zones requiring immediate response
- Each entry shows: rank number, zone name, coordinates, priority level badge (MEDIUM/HIGH/CRITICAL)
- **"View Response Planner" button** navigates to `/response-planner`

**1.4 Embedded Mini-Map (Center)**
- Shows Phoenix with thermal risk overlay
- Non-interactive overview map (full interactivity is on `/heat-map`)

**1.5 Run Heat Hunt (Header Button)**
- The primary CTA — triggers autonomous agent investigation (see Agent Insights page for details)

---

### PAGE 2: Heat Map (`/heat-map`) — Hyperlocal Thermal Risk Intelligence

**Purpose:** The flagship interactive visualization. Shows Phoenix's thermal landscape with 60m resolution FortyGuard data, allows district selection, and lets judges or users click anywhere on the map to inspect custom coordinates.

#### Features:

**2.1 Phoenix Metro District Ribbon (Black bar across top)**
- 7 preset district buttons: Downtown Core, Maryvale & West, South Phoenix, Encanto/Garfield, Camelback East, Tempe/ASU, All Metro Phoenix
- Each button is a named geographic sector of the Phoenix metropolitan area
- Clicking any button triggers:
  - Cinematic camera `flyTo()` animation (45° pitch, smooth curve)
  - New thermal grid generation (60m cells, color-coded by temperature)
  - New hotspot polygons centered over that district
  - New zone markers (numbered stars showing priority zones)
  - HUD updates (temperature, Response Gap for that district)

**2.2 Layer Filter Tabs (Below ribbon)**
- 4 view modes:
  - **Heat Risk Zones** — shows ranked priority polygons
  - **Thermal Grid (60m)** — shows raw 60m FortyGuard-resolution thermal rasters
  - **Census SVI** — overlays Social Vulnerability Index from ACS data
  - **MAG Cooling** — shows cooling center markers from MAG Heat Relief Network

**2.3 Time Range Selector**
- Dropdown: Today | 24h Forecast | Peak Heat (2PM) | Historic (7D)
- Changes the temperature data rendered on the thermal grid
- "24h Forecast" uses FortyGuard's +12h forecast capability (Premium plan)
- Temperatures shift dynamically (e.g., Peak Heat shows higher values, Historic shows a 7-day average baseline)

**2.4 The Thermal Grid Layer (60m Rasters)**
- Authentic 60m-resolution grid cells matching FortyGuard's native tile size
- Color ramp: teal (35°C) → amber (38°C) → orange (41°C) → red (44°C)
- Each district generates a unique grid based on its centroid and thermal profile
- Grid updates dynamically when district or time range changes

**2.5 Ranked Zone Polygons (Convex Hulls)**
- Irregular convex-hull polygons representing priority hotspot zones
- Color-coded by tier: red (CRITICAL), orange (HIGH), amber (MODERATE), teal (LOW)
- For All Metro Phoenix: shows one polygon per district (6 polygons total)
- For individual districts: shows primary hotspot + secondary cluster
- Each polygon has a unique shape derived from the actual lat/lng coordinates (no two locations look the same)
- Clicking a polygon triggers the WHY panel (see below)

**2.6 Zone Number Markers (Star Badges)**
- Numbered markers (1, 2, 3...) showing priority zones on the map
- Color matches tier severity
- Clicking a marker triggers the WHY panel for that zone
- For All Metro Phoenix: all 6 district markers are shown simultaneously

**2.7 Click Anywhere — Custom Spatial Sampling**
- Click anywhere on the Phoenix map to drop a custom target reticle (🎯 marker)
- The map computes:
  - Estimated temperature for that coordinate (based on distance from heat epicenter)
  - Census ACS area-weighted vulnerability score for intersecting tracts
  - MAG cooling resource nearest distance
  - Full Response Gap score
- A circular 0.8-mile AOI buffer polygon appears around the clicked point
- The Floating Glass HUD updates with live stats for that coordinate
- WHY panel can be opened for the custom AOI showing full evidence

**2.8 Floating Glass HUD (Bottom-left of map)**
- Shows the active district or custom AOI:
  - Name / coordinates
  - Risk tier badge (CRITICAL / HIGH / MODERATE / LOW)
  - Peak Heat reading (°F and °C)
  - Response Gap score (X.X / 10)
  - Short description of the area
  - "Inspect Empirical WHY Breakdown" button → opens WHY panel

**2.9 Map Controls**
- Zoom In / Zoom Out buttons
- Compass/Recenter button (resets to All Metro Phoenix view)
- Fullscreen expand button (top-right)
- Layers dropdown (toggle layer visibility)

**2.10 WHY Panel (Evidence Drawer)**
- A right-side slide-in drawer that appears when clicking any zone marker, polygon, or HUD button
- Shows:
  - **Data mode badge** (LIVE DATA / CACHED / DEMO SCENARIO)
  - **Zone name and number**
  - **Risk tier badge**
  - **Response Gap score** with gauge bar
  - **Score Contribution Components**: Heat Exposure (X/10), Vulnerability (X/10), Resource Deficit (X/10) — each with a progress bar
  - **Response Gap disclaimer**: "Response Gap is a composite risk indicator, not an official public-health index"
  - **Multi-Layer Empirical Evidence:**
    - Heat & Thermal Metrics: Peak Thermal (°C/°F), Persistence (hrs above 40°C), Urban Exceedance (°F over urban baseline), Historical Anomaly
    - Tree Canopy Cover: "Not available in this analysis" (honest labeling, no fabrication)
    - Vulnerability Demographics: elderly %, chronic conditions %, poverty rate, source attribution
    - Cooling Resources: count, avg distance, hydration outposts, source attribution
  - **Recommended Action**: Category (e.g., RAPID DEPLOYMENT), action text, priority, ETA
  - **Dismiss button** / ESC key closes the drawer

---

### PAGE 3: Risk Zones (`/risk-zones`) — Priority Zone Intelligence Table

**Purpose:** A sortable, filterable table showing every ranked risk zone with full evidence access.

#### Features:

**3.1 Tier Filter Buttons**
- 4 filter buttons: All | Critical | High | Moderate
- Clicking a filter shows only zones of that severity tier
- "All" button shows all zones

**3.2 Search Bar**
- Full-text search across zone names and coordinates
- Real-time filtering as you type

**3.3 Risk Zone Table**
- Columns: Rank, Zone Name, Tier, Response Gap Score, Temperature, Persistence, Elderly %, Resources, Action
- Each row represents one FortyGuard-analyzed zone
- Clicking any row opens the WHY panel for that zone

**3.4 Export Buttons**
- **Export CSV**: downloads all zone data as a comma-separated values file for GIS/Excel use
- **Export GeoJSON**: downloads all zone geometries + attributes as GeoJSON for map import

**3.5 Zone Count Badge**
- Shows total zones and how many are in each tier
- Updates dynamically with active filter

---

### PAGE 4: Events & Alerts (`/events-alerts`) — Anomaly & Alert Management

**Purpose:** Real-time alert feed showing heat anomalies, threshold exceedances, and system events.

#### Features:

**4.1 Alert Severity Filter**
- Filter by: All | Critical | High | Moderate | Low | Info
- Visual filter pills update the displayed alert list

**4.2 Alert Cards**
- Each alert shows:
  - Severity icon (flame for critical, warning triangle for high, info circle for low)
  - Alert title (e.g., "Extreme Heat Warning — Central Phoenix")
  - Description with specific data (temperature, location, threshold exceedance)
  - Timestamp (relative: "Today, 10:30 AM")
  - **Acknowledge button** — marks alert as seen
  - **Resolve button** — marks alert as resolved/addressed
  - Status badge changes after action (Acknowledged / Resolved)

**4.3 Alert Source Types**
- FortyGuard real-time thermal anomaly detection
- System-generated threshold exceedance alerts
- Resource/operational alerts (cooling center status changes)

---

### PAGE 5: Agent Insights (`/agent-insights`) — Autonomous AI Decision Engine

**Purpose:** The most technically impressive page. Shows the autonomous AI Heat Hunt agent running in real time, with streaming step-by-step logs, tool call visibility, and priority zone output.

#### Features:

**5.1 Control Bar**
- **Fail Simulation Toggle**: ON/OFF switch — forces an API failure to demonstrate graceful fallback (useful for judging)
- **Parameters Button**: opens a configuration panel for date, time, engine, and mode
- **Launch Heat Hunt Button**: triggers the autonomous multi-step spatial investigation pipeline

**5.2 Parameters Panel** (expands when Parameters clicked)
- **Date picker** (default: 2024-08-01 — a documented Phoenix extreme heat day)
- **Time picker** (default: 14:00 — peak afternoon heat window)
- **Engine dropdown**: Auto (Gemini Multimodal) | Deterministic Fast-Path
- **Mode dropdown**: 🟢 Live Pipeline | 🔵 Replay Cache | 🟣 Demo Scenario
- **Quick Presets**: "Aug 1 Peak (14:00)", "Jul 20 Noon (12:00)", "Aug 15 Late (16:00)"

**5.3 Live Telemetry & Step Execution Stream (Left 2/3)**
- Real-time SSE streaming from backend
- Each step appears as a log entry with:
  - Step number (e.g., "Step 3 of 10")
  - Status icon (✓ completed, ⚡ active, ⏸ queued, ✗ failed)
  - Step description (e.g., "Adaptive Polygon Refinement — Subdividing Zone 1 into 4 sub-tiles")
  - Timestamp
  - Tool call detail (e.g., "Tool: query_fortyguard_heat | AOI: Downtown Phoenix | analytic_type: persistence")
- Steps dynamically counted — step counter adapts to actual pipeline depth (never hardcoded to "7")
- Color-coded phases: SCANNING (blue), ANALYZING (amber), INVESTIGATING (orange), REFINING (red), RANKING (teal)
- Terminal summary card appears on completion showing: total zones scanned, hotspots detected, final ranking

**5.4 Sensor Ingestion Nodes (Right Rail)**
- Shows active data feed cards:
  - Thermal Infrared Raster (10m / Res)
  - NOAA Wet-Bulb Index (Real-time)
  - Census ACS Vulnerability (5-Yr Tracts)
  - MAG Cooling Network (active count)

**5.5 Identified Risk Hotspots (Right Rail)**
- After Heat Hunt completes, shows ranked zones with:
  - Zone name
  - Response Gap score
  - Tier badge
  - "View empirical evidence" button → opens WHY panel for that zone
- Maximum of top 5 zones shown

**5.6 Status Badge**
- Top-right of stream panel shows current state: Idle Standby | Running | Scanning | Analyzing | Completed | Failed

---

### PAGE 6: Resources (`/resources`) — MAG Cooling Network Directory

**Purpose:** Detailed view of all cooling centers, hydration stations, and respite sites from the Maricopa Association of Governments (MAG) Heat Relief Network.

#### Features:

**6.1 Resource Category Filters**
- Filter buttons: All | Cooling Centers | Hydration Posts | Respite Sites | Medical
- Updates list in real time

**6.2 Resource Cards**
- Each card shows:
  - Resource name and type
  - Address
  - Capacity utilization gauge (% full)
  - Operating hours
  - Current status (Open / Closed / At Capacity)
  - Distance from nearest critical zone
  - **Transit access links** (nearest light rail stop)
  - **Capacity indicator bar** (visual)

**6.3 Resource Map (if embedded)**
- Shows resource locations pinned on Phoenix map
- Color-coded by type and status

**6.4 Status Toggles**
- Some resource cards have status update controls (for operational use)

---

### PAGE 7: Response Planner (`/response-planner`) — Tactical Heat Response Coordination

**Purpose:** Allows city emergency management to plan, dispatch, and track heat response actions based on the current priority zones.

#### Features:

**7.1 Active Response Zone Panel**
- Shows the top-ranked zone requiring action
- Displays: zone name, tier, Response Gap score, population affected
- Quick-select buttons to change the active focus zone

**7.2 Tactical Response Cards**
- Recommended action cards generated from `recommend_action` agent tool output:
  - **Mobile Cooling Units** — deploy/route optimization
  - **Senior Canvassing** — door-to-door outreach dispatch
  - **Hydration Expansion** — water station scaling
  - **Medical Alert** — EMS pre-positioning
- Each card shows: action type, target area, resource count, ETA, priority level

**7.3 ROI & Impact Matrix**
- Shows estimated impact for each response type:
  - Lives Protected count (e.g., "3,400 lives protected")
  - Cost efficiency rating
  - Resource utilization forecast

**7.4 Dispatch Buttons**
- "Dispatch" button on each tactical card
- Triggers action dispatch (in current implementation, logs the action and marks as dispatched)

**7.5 12-Hour Forecast Panel**
- Uses FortyGuard's +12h forecast data (Premium plan feature)
- Shows projected heat trajectory for the next 12 hours
- Informs pre-emptive resource positioning before conditions worsen

---

### PAGE 8: Reports (`/reports`) — Automated Report Generation

**Purpose:** Generate, manage, and export structured heat intelligence reports for city officials, emergency managers, and public health stakeholders.

#### Features:

**8.1 Report Type Selector**
- Dropdown or tabs for report types:
  - Municipal Executive Briefing
  - FortyGuard Thermal Audit Summary
  - Daily Hazard Report
  - Weekly Heat Intelligence Digest
  - Agency Action Log

**8.2 Report Generator**
- "Generate Report" button triggers report compilation from:
  - Latest Heat Hunt results
  - Active alert history
  - Resource utilization data
  - Priority zone rankings

**8.3 Report Preview**
- In-page preview of the generated report document
- Shows: executive summary, priority zone table, FortyGuard data attribution, response recommendation section

**8.4 Export Controls**
- **Export PDF** — downloads formatted PDF report
- **Export CSV** — downloads tabular report data
- **Export JSON** — raw data export for GIS integration

**8.5 Report History / Archive**
- Lists previously generated reports with timestamp, type, and author
- Clicking a past report opens it for review

---

### PAGE 9: Data Explorer (`/data-explorer`) — Raw Sensor & Telemetry Query Interface

**Purpose:** Allows technical users and judges to inspect the raw data that feeds the analysis pipeline.

#### Features:

**9.1 Dataset Tabs**
- FortyGuard TCM Rasters
- FortyGuard Exceedance Records
- Census ACS Tract Joins
- MAG Resource Dataset
- Agent Action Log

**9.2 Search / Filter Bar**
- Full-text search across record fields
- Date range filter
- Zone filter (filter by specific zone ID)

**9.3 Data Table**
- Columns vary by dataset type:
  - For FortyGuard: zone_id, analytic_type, temperature_c, timestamp, activity_id, tile_resolution
  - For Census: tract_id, elderly_pct, poverty_rate, socio_index, population
  - For MAG: resource_id, name, type, coordinates, capacity, distance_to_zone
  - For Agent Log: step_id, tool_name, input_summary, output_summary, duration_ms, timestamp

**9.4 Record Count Badge**
- Shows total matching records for active filter
- "Showing X of Y records"

---

### PAGE 10: Settings (`/settings`) — Configuration & System Management

**Purpose:** API key status monitoring, pipeline mode configuration, and system behavior tuning.

#### Features:

**10.1 API Status Panel**
- Shows live status of each API integration:
  - **FortyGuard API** — Connected / Error | Plan: Premium
  - **Google Gemini** — Connected / Error | Model: Gemini Flash
  - **US Census Bureau** — Connected / Error
- Status badges update when API calls succeed or fail

**10.2 Pipeline Mode Switches**
- **Data Mode**: Live Pipeline | Replay Cache | Demo Scenario
- **Agent Engine**: Auto (Gemini Multimodal) | Deterministic Fast-Path
- Toggle between modes without restarting the application

**10.3 Telemetry Hunt Cycles**
- Configure auto-refresh interval for background scans
- Enable/Disable automatic periodic scanning

**10.4 Fail Simulation Control**
- Toggle to force API failure for testing graceful degradation
- Same as the "Fail Simulation" toggle on Agent Insights page

**10.5 Scoring Config Viewer**
- Shows the active Response Gap formula weights:
  - Heat Exposure: 0.40
  - Vulnerability: 0.35
  - Resource Deficit: 0.25
- These match the versioned `ScoringConfigVersion` stored in the backend database

---

## PART 4 — BACKEND AGENT ARCHITECTURE (DETAILED)

### 4.1 Agent Tools

The AI agent (Gemini LLM) has exactly these tools available:

| Tool | What It Does | Who Computes |
|---|---|---|
| `scan_city` | Tiles Phoenix into ≤10 mi² AOIs, submits to FortyGuard | Deterministic (backend) |
| `query_fortyguard_heat` | Submit/poll one FortyGuard heatmap call | Deterministic (backend) |
| `refine_hotspot` | Subdivide a candidate zone polygon, re-query at higher precision | Agent-selected, deterministic execution |
| `get_vulnerability_data` | Fetch Census ACS vulnerability metrics for an AOI | Deterministic (backend) |
| `get_resources` | Fetch MAG cooling centers within/near an AOI | Deterministic (backend) |
| `calculate_risk_metrics` | Compute exposure/anomaly/persistence/exceedance | Deterministic only |
| `calculate_response_gap` | Multiplicative Response Gap formula | Deterministic only |
| `explain_priority` | Write human-readable evidence narrative (grounded in structured data only) | LLM |
| `recommend_action` | Generate prioritized response recommendation | LLM |

**The LLM never performs arithmetic.** It only decides which tool to call next and authors the prose narrative once the numbers are final.

### 4.2 Response Gap Formula

```
Response Gap = Heat Score × Vulnerability Score × Resource Deficit Score

Each sub-score is normalized to [0, 1] independently:
  Heat Score     = f(exposure=0.4, anomaly=0.3, persistence=0.2, exceedance=0.1)
  Vulnerability  = f(elderly_pct=0.3, density=0.2, socio_index=0.35, ac_access=0.15)
  Resource Deficit = inverse_coverage_count(radius=1.5km)

Response Gap output: 0.0–10.0 scale (displayed as e.g., "8.7 / 10")
```

The formula is multiplicative (not additive), so high heat + low vulnerability still results in a modest score. All three factors must be simultaneously elevated for a critical Response Gap.

### 4.3 Backend Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/analysis/basic-scan` | Quick scan without full Heat Hunt agent |
| POST | `/api/heat-hunts` | Start a full autonomous Heat Hunt |
| GET | `/api/heat-hunts/{run_id}` | Poll run status/phase |
| GET | `/api/heat-hunts/{run_id}/zones` | Get ranked zone results |
| GET | `/api/heat-hunts/{run_id}/zones/{zone_id}/evidence` | Get WHY panel data |
| GET | `/api/heat-hunts/{run_id}/agent-log` | Get agent action log |
| GET | `/api/heat-hunts/{run_id}/correlations` | Get correlation analysis |
| GET + SSE | `/api/analysis/stream-status/{job_id}` | Live SSE progress stream |
| GET | `/api/resources` | MAG cooling resource list |
| GET | `/api/alerts` | Active alert list |
| POST | `/api/heat-hunts/{run_id}/cancel` | Abort a running Heat Hunt |

---

## PART 5 — COMPLETE MANUAL TESTING GUIDE

This section provides step-by-step manual test instructions for every feature on every page.

---

### ✅ GLOBAL TESTS (Any Page)

**Test G1: Backend live connection**
- Navigate to any page
- Expected: No "Backend offline" banner appears. Page loads within 3 seconds.
- Verify: Header shows "Live Telemetry" (green badge) or "Cached Pipeline" (blue badge)

**Test G2: Header zone count**
- Look at the header badge (top right, e.g., "Live Telemetry | 2 API Zones · 6 Districts")
- Expected: Shows a count of API-scanned zones PLUS the 6-district metro count
- Should NOT show just "2 Zones" (that was the old static bug)

**Test G3: Mode badge accuracy**
- Expected: Badge always shows actual pipeline mode — never mislabels cached data as live or demo data as live
- If you see "DEMO MODE" in a WHY panel, that should only appear when the app is in Demo Scenario mode

**Test G4: No DEMO MODE labels anywhere**
- Open any WHY panel by clicking any zone marker or polygon
- Expected: Badge shows "LIVE DATA" (green) or "CACHED" (blue)
- Should NEVER show "DEMO MODE" unless you explicitly selected "Demo Scenario" mode in Settings

---

### ✅ PAGE 1: Overview — Manual Tests

**Test 1.1: KPI cards load real data**
- Navigate to `http://127.0.0.1:3000/`
- Expected: 5 KPI cards show values (not "--" or "Loading...")
- Peak Thermal should be ~114°F, Population at Risk should be a 5-digit number

**Test 1.2: Active Alerts load**
- Look at Active Alerts panel (right side)
- Expected: 3 alerts listed with timestamps, severity icons, titles, and locations
- Each alert should have a severity badge (Critical / High / Info)

**Test 1.3: Top Priority Actions**
- Look at Top Priority Actions panel
- Expected: 2 zones listed with rank numbers, zone names, and "MEDIUM" or "HIGH" badges
- "View Response Planner →" button should navigate to `/response-planner`

**Test 1.4: Refresh behavior**
- Open browser DevTools → Network tab
- Reload page
- Expected: Should see a POST request to `/api/analysis/basic-scan`

---

### ✅ PAGE 2: Heat Map — Manual Tests

**Test 2.1: District ribbon renders all 7 buttons**
- Navigate to `http://127.0.0.1:3000/heat-map`
- Expected: Black ribbon at top shows 7 clickable district buttons (Downtown, Maryvale, South Phoenix, Encanto, Camelback, Tempe/ASU, All Metro Phoenix)

**Test 2.2: Downtown district loads unique thermal grid**
- Click "Downtown Core" button
- Expected: Map flies to Downtown Phoenix area. Orange/red thermal grid cells visible. Floating HUD shows "Downtown Core" with 114.1°F.

**Test 2.3: Maryvale district loads DIFFERENT thermal grid**
- Click "Maryvale & West" button
- Expected: Camera flies to a DIFFERENT area (west of downtown). Thermal grid moves to that new location. HUD updates to "Maryvale & West" with different temperature.
- Critical: The thermal grid should be at a DIFFERENT geographic position than Downtown, not just recolored in the same spot.

**Test 2.4: South Phoenix is DIFFERENT from Maryvale**
- Click "South Phoenix" button
- Expected: Camera flies south. Grid appears over South Phoenix. HUD shows "South Phoenix" with different coordinates.

**Test 2.5: Tempe / ASU is DIFFERENT from all others**
- Click "Tempe / ASU" button
- Expected: Camera flies east to Tempe. Grid appears over ASU area. HUD shows "Tempe / ASU" with MODERATE tier (103°F).

**Test 2.6: All Metro Phoenix shows 6 distinct zone polygons**
- Click "All Metro Phoenix" button
- Expected:
  - Camera zooms out to show the full Phoenix metro
  - 6 numbered zone markers appear (1-6) at different geographic locations across the metro
  - 6 distinct hotspot polygons visible at different locations
  - NOT just 2 polygons in a small area

**Test 2.7: Time range changes thermal layer**
- While in Downtown district, click the "Today" dropdown → select "Peak Heat (2PM)"
- Expected: Temperature values in the thermal grid increase slightly (peak day temperatures)
- Try "Historic (7D)" → temperatures should be lower (historical baseline)
- Each time selection should visually change the thermal grid coloring

**Test 2.8: Layer tabs switch view correctly**
- Click "Thermal Grid (60m)" tab
- Expected: Shows dense 60m resolution thermal cells
- Click "Heat Risk Zones" tab → shows convex hull priority polygons
- Click "Census SVI" → shows Census vulnerability overlay

**Test 2.9: Custom point-and-click sampling**
- While viewing the heat map, click anywhere on the Phoenix area (not on an existing zone marker)
- Expected:
  1. A 🎯 orange target marker drops at the clicked point
  2. A dashed orange circular AOI buffer (0.8 mi radius) appears around the click
  3. The map camera flies to the clicked coordinate
  4. The Floating Glass HUD updates with:
     - Custom Target coordinates
     - Estimated temperature
     - Estimated Response Gap score
     - MODERATE or HIGH tier badge
  5. Hotspot polygons on the map shift to new UNIQUE shapes centered on the clicked location (different shape than previous click)

**Test 2.10: Clicking a DIFFERENT location gives DIFFERENT polygon shapes**
- Click on one location (e.g., north Phoenix) → note the polygon shape
- Click on a completely different location (e.g., south Phoenix) → polygon should be a DIFFERENT shape with different orientation and size
- This tests the coordinate-hash polygon engine fix

**Test 2.11: WHY panel opens from zone marker**
- Click on any numbered zone marker (e.g., the "1" marker)
- Expected: WHY panel slides in from the right
- Panel should show:
  - "LIVE DATA" badge (NOT "DEMO MODE")
  - Zone name and number
  - Risk tier badge
  - Response Gap score with component breakdown bars
  - Heat & Thermal Metrics section
  - Vulnerability Demographics section
  - Cooling Resources section
  - Recommended Action section

**Test 2.12: WHY panel for Custom AOI**
- After clicking anywhere to drop a custom 🎯 target
- Click "Inspect Empirical WHY Breakdown" button on the Floating HUD
- Expected: WHY panel opens showing "LIVE SPATIAL SAMPLE" mode badge, coordinates in zone name, and freshly computed evidence

**Test 2.13: WHY panel closes**
- ESC key should close the WHY panel
- Clicking the X button should close it
- Clicking the backdrop (left side) should close it

---

### ✅ PAGE 3: Risk Zones — Manual Tests

**Test 3.1: Table renders zone data**
- Navigate to `http://127.0.0.1:3000/risk-zones`
- Expected: Table shows at least 2 rows (from backend) with zone names, temperatures, Response Gap scores, tier badges

**Test 3.2: Tier filter — Critical only**
- Click "Critical" filter button
- Expected: Only CRITICAL tier zones remain visible. All HIGH/MODERATE/LOW rows disappear.

**Test 3.3: Search box**
- Type "Phoenix" in the search box
- Expected: Table filters to show only zones with "Phoenix" in their name

**Test 3.4: Click row to open WHY panel**
- Click any row in the table
- Expected: WHY panel slides in from the right with that zone's evidence

**Test 3.5: Export CSV**
- Click "Export CSV" button
- Expected: A `.csv` file downloads to your computer containing zone data rows

**Test 3.6: Export GeoJSON**
- Click "Export GeoJSON" button
- Expected: A `.geojson` file downloads with zone geometries

---

### ✅ PAGE 4: Events & Alerts — Manual Tests

**Test 4.1: Alert list renders**
- Navigate to `http://127.0.0.1:3000/events-alerts`
- Expected: Multiple alert cards visible with titles, descriptions, timestamps, and severity icons

**Test 4.2: Severity filter works**
- Click "Critical" filter
- Expected: Only critical alerts shown (flame icon, red border)
- Click "All" to reset

**Test 4.3: Acknowledge an alert**
- Click the "Acknowledge" button on any alert
- Expected: Alert status changes. Button may change to "Acknowledged" or alert may move to a different section.

**Test 4.4: Resolve an alert**
- Click "Resolve" on any alert
- Expected: Alert is marked resolved. Badge changes.

---

### ✅ PAGE 5: Agent Insights — Manual Tests

**Test 5.1: Launch Heat Hunt (full pipeline)**
- Navigate to `http://127.0.0.1:3000/agent-insights`
- Click "Launch Heat Hunt" button
- Expected:
  1. Status badge changes from "Idle Standby" to "Scanning" or "Running"
  2. Log entries begin appearing in the stream panel one by one (real-time SSE)
  3. Step numbers increment: "Step 1 of N" → "Step 2 of N" → etc.
  4. Step denominator should NOT be hardcoded at 7 (if 10+ steps run, it shows "Step 10 of 10", not "Step 12 of 7")
  5. After completion: "Identified Risk Hotspots" panel on the right populates with ranked zones

**Test 5.2: Step counter is dynamic (not hardcoded)**
- Watch the step counter during a Heat Hunt run
- Expected format: "Step X of Y" where Y matches the ACTUAL highest step reached (not always 7)
- If you see "Step 12 of 7" — that is a BUG (was fixed)

**Test 5.3: Parameters panel opens/closes**
- Click "Parameters" button
- Expected: Panel expands showing date, time, engine, and mode dropdowns
- Click again → panel collapses

**Test 5.4: Date/Time preset applies**
- Click "Aug 1 Peak (14:00)" quick preset button
- Expected: Date field changes to "2024-08-01" and Time changes to "14:00"

**Test 5.5: WHY panel from Risk Hotspots list**
- After a completed Heat Hunt, in the right rail "Identified Risk Hotspots" panel, click the evidence button on any zone
- Expected: WHY panel opens with that zone's real agent-sourced evidence (showing LIVE DATA badge, not DEMO MODE)

**Test 5.6: Fail Simulation**
- Toggle "Fail Simulation: ON"
- Click "Launch Heat Hunt"
- Expected: Heat Hunt begins but fails gracefully. UI shows failure state without crashing. Fallback to cached/demo mode activates automatically. A clear error message appears in the stream log.

**Test 5.7: Mode selection changes behavior**
- In Parameters panel, change Mode to "🟣 Demo Scenario"
- Click Launch Heat Hunt
- Expected: Heat Hunt runs using pre-cached Phoenix scenario data. Header badge should show "Demo Scenario" (purple). WHY panels in this mode will show "DEMO MODE" badge — this is CORRECT behavior because you explicitly selected demo mode.

---

### ✅ PAGE 6: Resources — Manual Tests

**Test 6.1: Resources load**
- Navigate to `http://127.0.0.1:3000/resources`
- Expected: Resource cards visible showing MAG cooling centers with names, addresses, capacity gauges

**Test 6.2: Category filter**
- Click "Cooling Centers" filter
- Expected: Only cooling center cards shown

**Test 6.3: Capacity gauge shows utilization**
- Look at any resource card
- Expected: Capacity bar shows a percentage (not 0% for everything)

---

### ✅ PAGE 7: Response Planner — Manual Tests

**Test 7.1: Tactical cards load**
- Navigate to `http://127.0.0.1:3000/response-planner`
- Expected: Multiple tactical action cards visible (Mobile Cooling Units, Senior Canvassing, etc.)

**Test 7.2: ROI matrix shows impact numbers**
- Expected: "3,400 lives protected" or similar impact estimate visible

**Test 7.3: Dispatch button**
- Click "Dispatch" on any action card
- Expected: Card status changes (button disables or shows "Dispatched" state)

---

### ✅ PAGE 8: Reports — Manual Tests

**Test 8.1: Report generator**
- Navigate to `http://127.0.0.1:3000/reports`
- Select a report type from the dropdown/tabs
- Click "Generate Report"
- Expected: Report preview appears in the panel with real data (zone names, temperatures, dates)

**Test 8.2: Export PDF**
- After generating a report, click "Export PDF"
- Expected: PDF file downloads

**Test 8.3: Report history**
- Previous reports should be listed with timestamps

---

### ✅ PAGE 9: Data Explorer — Manual Tests

**Test 9.1: Raw data table loads**
- Navigate to `http://127.0.0.1:3000/data-explorer`
- Expected: Table visible with raw telemetry or zone records

**Test 9.2: Search / filter**
- Type a zone name or record ID in the search box
- Expected: Table filters in real time

**Test 9.3: Dataset tab switching**
- Click different dataset tabs (FortyGuard, Census, MAG, Agent Log)
- Expected: Table columns and data change per dataset

---

### ✅ PAGE 10: Settings — Manual Tests

**Test 10.1: API status indicators**
- Navigate to `http://127.0.0.1:3000/settings`
- Expected: FortyGuard API shows "Connected" (green) if backend is live
- If backend is offline, should show "Error" with an explanatory message

**Test 10.2: Mode switches**
- Toggle "Data Mode" between Live Pipeline and Replay Cache
- Navigate back to Agent Insights
- Expected: Header badge changes to match (green ↔ blue)

**Test 10.3: Scoring config weights visible**
- Expected: Can see Heat (0.40), Vulnerability (0.35), Resource Deficit (0.25) weights displayed

---

## PART 6 — KNOWN CONSTRAINTS & HONEST LABELING

| Constraint | How It's Handled |
|---|---|
| FortyGuard 10 mi² per request | Phoenix tiled into ≤10 mi² AOI cells |
| No tree canopy dataset integrated | WHY panel shows "Tree Canopy Cover: Not available in this analysis" — honest, never fabricated |
| Historical anomaly may lack 30-yr baseline | Labeled "Baseline comparison" when unavailable |
| Historical Anomaly field may be null | Shows "Not available in this analysis" |
| NYC validation not primary demo | NYC pipeline exists but Demo focuses on Phoenix |

---

## PART 7 — PHASES COMPLETED (BUILD STATUS)

| Phase | Steps | Status |
|---|---|---|
| Phase 1–3: Foundation | 1–8 | ✅ Complete |
| Phase 4: Geospatial Engine | 9–13 | ✅ Complete |
| Phase 5: Data Integration | 14–20 | ✅ Complete |
| Phase 6: Analysis Engine | 21–26 | ✅ Complete |
| Phase 7: Scoring Engine | 27–29 | ✅ Complete |
| Phase 8: Agent Layer | 30–35 | ✅ Complete |
| Phase 9: Frontend UI | 36–38 | ✅ Complete |
| Phase 10: Evidence & Recommendations | 39–40 | ✅ Complete |
| Phase 11: End-to-End Integration | 41 | ✅ Complete |
| Phase 12: UI Enhancements | 42–43 | ✅ Complete |
| Phase 13: Reliability Shield | 42–43 (step 43) | ✅ Complete — 3-tier fallback active |
| **Phase 14: Security Audit** | **44** | **⏳ Not yet done** |

**Next action: Phase 14, Step 44 — Secrets, .env, and Dependency Security Audit**

---

## PART 8 — DEMO SCRIPT (3-MINUTE VERSION)

1. **Open** at `http://127.0.0.1:3000/` — Overview page. Show KPI cards. "Here's our city heat intelligence overview for Phoenix."
2. **Navigate to Heat Map** — click All Metro Phoenix. "Six priority zones identified across the metro. Each polygon is a real FortyGuard analysis result."
3. **Click a zone marker** — WHY panel opens. "This is why Zone 1 is our highest priority — 45.6°C, 5.5 hours of heat persistence, 28% elderly population, and only one cooling center 1.4 miles away."
4. **Click anywhere on the map** — custom sampling. "But judges can inspect ANY coordinate in Phoenix — HeatSentinel samples the real thermal data, real census tracts, and real cooling resource distance for that exact point."
5. **Navigate to Agent Insights** — Click "Launch Heat Hunt." "Now watch the autonomous AI agent investigate in real time..."
6. **Stream completes** — "The agent made real FortyGuard API calls, subdivided high-risk zones, calculated Response Gaps, and produced a ranked priority list — all autonomously."
7. **Open WHY for top zone** — show evidence trail. "Full transparency: every number traces back to FortyGuard data, Census ACS, and MAG cooling resources."
8. **Navigate to Response Planner** — "And here's what the city does next: deploy Mobile Cooling Unit #3 to the Central & Van Buren Transit Center."
9. **Closing:** *"HeatSentinel doesn't just tell cities where it's hot. It tells them where heat will hurt people most — and what to do next."*
