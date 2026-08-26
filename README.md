# 🛡️ HeatSentinel AI — Autonomous Hyperlocal Heat Response Intelligence

> **FortyGuard Hackathon '26** — *Agentic AI & Data Analysis / Correlation Tracks*  
> **Target Cities:** Phoenix, AZ (Primary Deployment & Live Demo) · New York City (Secondary Validation Track)  
> **Team XOF:**  
> - **Waleed Khalid** ([@Waleed-Khalid-dev](https://github.com/Waleed-Khalid-dev))  
> - **Nafees Aftab** ([@justnefo-debug](https://github.com/justnefo-debug))  
> - **Muhammad Ali** ([@ali38958](https://github.com/ali38958))  

---

## 🌟 Executive Summary

**HeatSentinel AI** is an autonomous municipal heat resilience and tactical response platform. Rather than merely rendering static temperature heatmaps, HeatSentinel dynamically investigates hyperlocal thermal anomalies, overlays socio-demographic vulnerability indices (US Census ACS 5-Year data), computes planar accessibility to protective infrastructure (Maricopa Association of Governments Cooling Centers), and outputs a transparent, reproducible **Response Gap ($R$)** priority score to direct emergency interventions where heat is most likely to harm human life.

---

## 🏗️ System Architecture

HeatSentinel is engineered as a **modular monolith** with a **deterministic analysis core** paired with an autonomous agent tool loop and an interactive real-time Command Center.

```
                    ┌────────────────────────────────────────┐
                    │       External Data Ingestion          │
                    │  FortyGuard API · Census ACS · MAG HRN │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │      Deterministic Core Engine         │
                    │   • Spatial Tiling Engine (≤10 mi²)    │
                    │   • DBSCAN Hotspot Clustering          │
                    │   • EPSG:2223 Area-Weighted Joins      │
                    │   • Response Gap Scoring (0.4E+0.35V)  │
                    │   • SQLite 0ms Observation Cache       │
                    └───────────────────┬────────────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
        ┌────────────────────────────────┐  ┌────────────────────────────────┐
        │       FastAPI Backend API      │  │     Agent Investigation Layer  │
        │   POST /api/analysis/basic-scan│  │  Autonomous Tool Dispatching   │
        │   GET  /api/health             │  │  Empirical Evidence Grounding  │
        └────────────────┬───────────────┘  └────────────────┬───────────────┘
                         │                                   │
                         └─────────────────┬─────────────────┘
                                           ▼
                    ┌────────────────────────────────────────┐
                    │    Frontend Command Center Dashboard   │
                    │   • MapLibre GL Interactive Contours   │
                    │   • Real-Time KPI Stat Cards           │
                    │   • 3-Pillar Empirical WHY Drawer      │
                    │   • On-Demand Async Heat Intel PDFs    │
                    │   • Tactical Priority Registry         │
                    └────────────────────────────────────────┘
```

---

## 📁 Repository Directory Structure

```text
HeatSentinel/
├── .agents/                     # AG Kit AI agent specifications, rules & memory index
│   ├── memory/                  # Persistent project decisions & conventions
│   └── rules/                   # Clean code, routing & testing protocols
├── backend/                     # High-performance FastAPI backend service
│   ├── app/
│   │   ├── data/                # Versioned local datasets (Census GeoJSON & MAG Cooling Centers)
│   │   ├── models/              # Pydantic schemas (HeatZone, HeatMetrics, ZoneEvidence, LatLng)
│   │   ├── routers/             # API endpoints (analysis, health, heat-hunt)
│   │   ├── services/            # Deterministic business logic & spatial algorithms
│   │   │   ├── analytics_engine.py      # Heat persistence & exceedance metric computation
│   │   │   ├── fortyguard_client.py     # Centralized submit/poll FortyGuard client
│   │   │   ├── hotspot_service.py       # DBSCAN convex-hull spatial clustering
│   │   │   ├── pipeline_service.py      # Unified end-to-end basic scan pipeline
│   │   │   ├── priority_engine.py       # Deterministic Response Gap scoring formula
│   │   │   ├── resource_service.py      # Planar 1-mile buffer & facility proximity
│   │   │   ├── spatial_engine.py        # 10 mi² AOI tiling & coordinate validation
│   │   │   └── vulnerability_service.py # Area-weighted demographic Census joins
│   │   ├── config.py            # Pydantic environment settings
│   │   ├── db.py                # SQLite result caching & persistence
│   │   ├── errors.py            # Structured exception handling
│   │   ├── logging_config.py    # Standardized logging formatter
│   │   └── main.py              # FastAPI application entry point & CORS configuration
│   ├── scripts/                 # Sensitivity analysis & dev utility scripts
│   ├── tests/                   # Full pytest regression suite (56/56 passing)
│   │   ├── fixtures/            # Golden sample datasets & sensitivity matrices
│   │   └── test_*.py            # Modular unit and integration tests
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Backend environment template
├── frontend/                    # Modern React + Vite + Tailwind CSS dashboard
│   ├── public/                  # Static assets & brand SVG logos
│   ├── src/
│   │   ├── api/                 # React Query API client abstraction
│   │   │   ├── analysis.ts      # useBasicScan, useZones, useHeatMapMarkers, useHeatGeoJSON
│   │   │   └── index.ts         # Barrel export for queries & mutations
│   │   ├── components/          # Modular UI components
│   │   │   ├── AnalyticsCards.tsx       # Risk summary, demographics & readiness cards
│   │   │   ├── Header.tsx               # Action header with RUN ANALYSIS trigger
│   │   │   ├── HyperlocalHeatMapCard.tsx# MapLibre GL interactive vector map & contours
│   │   │   ├── KpiStatCards.tsx         # Top 5-card metric row
│   │   │   ├── Layout.tsx               # Responsive application shell
│   │   │   ├── Sidebar.tsx              # Persistent desktop navigation sidebar
│   │   │   └── WhyPanel.tsx             # 3-pillar empirical evidence drawer
│   │   ├── pages/               # Route views (Overview, Heat Map, Risk Zones, Settings)
│   │   ├── theme/               # Risk tier configurations & HSL color tokens
│   │   ├── types.ts             # TypeScript domain interfaces
│   │   ├── App.tsx              # App routing & React Query Provider
│   │   ├── index.css            # Tailwind CSS v4 design tokens & custom scrollbars
│   │   └── main.tsx             # React DOM root mounting
│   ├── package.json             # Frontend dependencies & scripts
│   ├── tsconfig.json            # Strict TypeScript configuration
│   └── vite.config.ts           # Vite 6 config with Tailwind CSS v4 integration
├── context/                     # System design specs, roadmap & FortyGuard reference
│   ├── HeatSentinel_AI_System_Design.md
│   ├── HeatSentinel_AI_Context_Handoff.md
│   ├── fortyguard-api-reference.md
│   ├── fortyguard-participant-handbook.md
│   └── heatsentinel_antigravity_roadmap.md
├── docs/                        # Scientific methodology & mathematical formulations
│   ├── architecture.md
│   └── methodology.md
├── .gitignore                   # Standard multi-language ignore rules
├── LICENSE                      # MIT Open Source License
├── metadata.json                # Project descriptor metadata
└── README.md                    # This document
```

---

## 🧮 Response Gap Formulation ($R$)

To ensure accountability and prevent arbitrary AI hallucinations, all risk scoring is strictly deterministic:

$$R = 0.40 \cdot E + 0.35 \cdot V + 0.25 \cdot D$$

Where each sub-score is normalized on a standard $[0, 100]$ scale:
1. **Heat Exposure Score ($E$):** Composite of peak thermal intensity, consecutive hours above $40^\circ\text{C}$ (FortyGuard Persistence), and baseline urban exceedance.
2. **Vulnerability Score ($V$):** Census ACS 5-Year demographic overlap calculating population density, senior concentration ($\ge 65$), and the socioeconomic Social Vulnerability Index (SVI).
3. **Resource Deficit Score ($D$):** Inverse accessibility score to active MAG cooling and hydration stations within a $1\text{-mile}$ ($1600\text{ m}$) planar walkability buffer.

### Priority Tiers:
- **`CRITICAL`** ($R \ge 7.0$): Immediate tactical deployment of mobile cooling & EMS units.
- **`HIGH`** ($5.0 \le R < 7.0$): Priority hydration station expansion & community canvassing.
- **`MODERATE`** ($3.0 \le R < 5.0$): Elevated awareness & cooling center readiness.
- **`LOW`** ($R < 3.0$): Standard baseline municipal monitoring.

> **Disclaimer:** Response Gap is a project-derived decision-support score for this hackathon prototype. It is not an official public-health index, medical prediction, or mortality forecast.

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: v18+ and `npm`
- **Python**: v3.11+ (Python 3.13 supported)
- **FortyGuard API Key** (Set in `backend/.env`)

---

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Add your FORTYGUARD_API_KEY inside .env

# Launch FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup (React + Vite)

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```
Access the Command Center at `http://localhost:3000/`.

---

## 🧪 Testing & Verification

### Backend Automated Test Suite (Pytest)
Run the full 56-test regression suite:
```bash
cd backend
python -m pytest tests/
```
*Result: `56 passed, 0 failed`.*

### Verification & Quality Assurance
- **Backend Test Suite (Pytest):** `cd backend && python -m pytest tests/` (`56/56 unit and integration tests passing`).
- **Interactive Verification (Playwright MCP):** Verified via Playwright automation covering API endpoints, live data ingestion, MapLibre GL polygon rendering, and interactive WHY evidence drawers.

---

## ⚖️ License
Distributed under the **MIT License**. See [`LICENSE`](file:///d:/[Project]/HeatSentinel/LICENSE) for more information.
