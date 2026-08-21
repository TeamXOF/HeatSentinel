# HeatSentinel AI — Autonomous Urban Heat Vulnerability Platform

An enterprise-grade, autonomous municipal heat resilience and vulnerability intelligence platform designed for the Phoenix metropolitan corridor. HeatSentinel AI continuously monitors urban thermal anomalies, ingests geospatial census vulnerability indicators, tracks protective cooling infrastructure, and deploys targeted emergency interventions.

---

## 🛠️ Tech Stack

- **Framework & Runtime**: React 19, TypeScript (~5.8), Vite 6
- **Styling & Design System**: Tailwind CSS v4, Custom Design Tokens, Accessible HSL color palettes, Glassmorphism, Responsive mobile-first grid
- **Data Fetching & State**: TanStack Query (React Query v5) with centralized API abstraction layer (`/src/api/`)
- **Spatial Mapping**: MapLibre GL (`maplibre-gl`) with interactive vector contours, custom heat-risk markers, and layer controls
- **Data Visualization**: Recharts (Donut and risk distribution charts)
- **Icons & Motion**: Lucide React (`lucide-react`), Motion (`motion`)

---

## 📁 Folder Structure

```text
heatsentinel-ai/
├── public/
├── src/
│   ├── api/                     # Centralized API abstraction & Query hooks
│   │   ├── alerts.ts            # useAlerts, useActiveAlerts
│   │   ├── analysis.ts          # useZones, useZoneEvidence, useHeatMapMarkers, useHeatGeoJSON, etc.
│   │   ├── config.ts            # USE_MOCK_DATA toggle & apiFetch utility
│   │   ├── heatHunt.tsx         # HeatHuntProvider & useHeatHunt autonomous execution engine
│   │   ├── index.ts             # Barrel exports for all API hooks
│   │   ├── priorityActions.ts   # usePriorityActions, useTacticalPlanner
│   │   ├── reports.ts           # useReports
│   │   ├── resources.ts         # useResources, useResourceReadiness
│   │   └── telemetry.ts         # useTelemetryRecords
│   ├── components/              # Modular UI components
│   │   ├── AnalyticsCards.tsx   # Risk summary, demographics & readiness cards
│   │   ├── BottomTabBar.tsx     # Mobile bottom navigation bar
│   │   ├── FooterStatusBar.tsx  # Autonomous agent telemetry footer
│   │   ├── Header.tsx           # Global header with Heat Hunt launcher & profile
│   │   ├── HyperlocalHeatMapCard.tsx # MapLibre GL heat risk map
│   │   ├── KpiStatCards.tsx     # 5-card metric row
│   │   ├── Layout.tsx           # Responsive shell layout
│   │   ├── Logo.tsx             # HeatSentinel SVG geometric mark
│   │   ├── MobileNavDrawer.tsx  # Slide-out drawer navigation for mobile
│   │   ├── RightRailCards.tsx   # Active alerts & priority action cards
│   │   ├── Sidebar.tsx          # Persistent desktop navigation sidebar
│   │   └── WhyPanel.tsx         # Slide-in drawer with empirical evidence & scoring
│   ├── context/                 # Application contexts
│   ├── data/                    # Mock datasets & Phoenix geospatial coordinates
│   │   ├── mockAnalyticsData.ts
│   │   ├── mockHeatMapData.ts
│   │   ├── mockKpiData.ts
│   │   ├── mockRightRailData.ts
│   │   └── mockZoneEvidenceData.ts
│   ├── pages/                   # Application route views
│   │   ├── AgentInsightsPage.tsx # Live telemetry event stream terminal
│   │   ├── DataExplorerPage.tsx  # Raw telemetry tabular explorer & CSV export
│   │   ├── EventsAlertsPage.tsx  # Interactive alerts ledger with ACK controls
│   │   ├── HeatMapPage.tsx       # Fullscreen GIS heat risk map
│   │   ├── OverviewPage.tsx      # Main municipal dashboard
│   │   ├── ReportsPage.tsx       # Executive briefings & PDF download portal
│   │   ├── ResourcesPage.tsx     # Cooling centers & hydration outposts
│   │   ├── ResponsePlannerPage.tsx # Tactical dispatch planner
│   │   ├── RiskZonesPage.tsx     # Ranked vulnerability registry
│   │   └── SettingsPage.tsx      # Thresholds, API keys & preferences
│   ├── theme/                   # Risk tier definitions & token constants
│   ├── types.ts                 # Core TypeScript interfaces & schemas
│   ├── App.tsx                  # Routing configuration & Query client
│   ├── index.css                # Global CSS & Tailwind imports
│   └── main.tsx                 # React DOM mount point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔌 Mock Data Layer

The frontend is currently decoupled from live backend servers using client-side mock fixtures located in `/src/data/` and unified via `/src/api/`.

To switch between mock fixtures and the real FastAPI backend:
1. Open [`/src/api/config.ts`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/src/api/config.ts).
2. Set `export const USE_MOCK_DATA = false;`.
3. Provide `VITE_API_BASE_URL` in your `.env` file (defaults to `http://localhost:8000`).

---

## 📋 TODO: Backend Wiring

The following hooks in `/src/api/` have mock implementations that need to be wired to the corresponding FastAPI backend endpoints. These align directly with the **Antigravity Roadmap**:

### 1. FortyGuard & Thermal Telemetry Stream (Antigravity Steps 10–12)
- **`useHeatMapMarkers`** (`/src/api/analysis.ts`):
  - *Target Endpoint*: `GET /api/heatmap/markers`
  - *Wiring*: Real-time coordinate ingest of calibrated sensor nodes with localized surface temperature deltas.
- **`useHeatGeoJSON`** (`/src/api/analysis.ts`):
  - *Target Endpoint*: `GET /api/heatmap/geojson`
  - *Wiring*: Raster thermal polygon contours from regional infrared satellite passes and ground-station grids.
- **`useTelemetryRecords`** (`/src/api/telemetry.ts`):
  - *Target Endpoint*: `GET /api/telemetry/raw`
  - *Wiring*: Historical and live sensor logs with wet-bulb globe temperature (WBGT) and canopy density.

### 2. Ranked Risk Zones & Empirical Evidence (Antigravity Steps 28–29)
- **`useZones`** (`/src/api/analysis.ts`):
  - *Target Endpoint*: `GET /api/zones`
  - *Wiring*: Dynamic Response Gap score calculation combining CDC SVI / Census ACS vulnerability with heat persistence.
- **`useZoneEvidence`** (`/src/api/analysis.ts`):
  - *Target Endpoint*: `GET /api/zones/{zoneId}/evidence`
  - *Wiring*: Detailed factor breakdown (Heat Exposure, Vulnerability, Resource Deficit) powering the **WhyPanel** drawer.
- **`useRiskZoneSummary`** & **`usePopulationAtRisk`** (`/src/api/analysis.ts`):
  - *Target Endpoints*: `GET /api/analytics/risk-summary`, `GET /api/analytics/population-risk`
  - *Wiring*: Aggregated risk tier tallies and vulnerable population demographic totals.

### 3. Autonomous Heat Hunt Async Job Engine (Antigravity Steps 37–38)
- **`useHeatHunt`** (`/src/api/heatHunt.tsx`):
  - *Job Launch Endpoint*: `POST /api/heat-hunt/start`
  - *SSE / Polling Stream Endpoint*: `GET /api/heat-hunt/{jobId}/events`
  - *Status Endpoint*: `GET /api/heat-hunt/{jobId}/status`
  - *Wiring*: Connect the React Context execution loop to Server-Sent Events (SSE) or WebSockets from the FastAPI autonomous worker pipeline.
- **`useActiveAlerts`** & **`useAlerts`** (`/src/api/alerts.ts`):
  - *Target Endpoints*: `GET /api/alerts/active`, `POST /api/alerts/{id}/acknowledge`
  - *Wiring*: Real-time anomaly alerts generated during Heat Hunt runs.
- **`usePriorityActions`** & **`useTacticalPlanner`** (`/src/api/priorityActions.ts`):
  - *Target Endpoints*: `GET /api/actions/priority`, `POST /api/actions/{id}/dispatch`
  - *Wiring*: Dynamic tactical intervention recommendations dispatched to field teams.
- **`useResources`** & **`useResourceReadiness`** (`/src/api/resources.ts`):
  - *Target Endpoints*: `GET /api/resources`, `GET /api/resources/readiness`
  - *Wiring*: Live telemetry on cooling centers, hydration posts, and mobile misting units.
- **`useReports`** (`/src/api/reports.ts`):
  - *Target Endpoint*: `GET /api/reports`
  - *Wiring*: Agent-generated automated PDF and GeoJSON assessment downloads.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Local Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000/`.

### 3. Production Build
```bash
npm run build
npm run preview
```
