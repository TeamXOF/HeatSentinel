# FortyGuard API — Complete Reference

> **Source:** Scraped from all pages listed in `API - Docx .txt` on 2026-08-22.  
> **Purpose:** Permanent reference so we never need to re-scrape. Use this instead of visiting the docs during development.  
> **Official docs:** https://docs-api.fortyguard.com

---

## Base URL & Authentication

```
Base URL:      https://api.fortyguard.com
Auth header:   api-key: YOUR_API_KEY
Content-Type:  application/json
```

> ⚠️ **Security rules:** Store key in `.env` as `FORTYGUARD_API_KEY`. Never hardcode it. Never commit it to any public repo.  
> The `.env.example` in this project already has the variable name defined.

---

## Critical Constraints (Shape Every Architecture Decision)

| Constraint | Detail | Impact on HeatSentinel |
|-----------|--------|----------------------|
| **US-only** | All endpoints operate inside the United States only. Non-US polygons return errors or empty results. | Phoenix is primary (✅), NYC is secondary validation (✅). No other cities. |
| **Date range** | 2021-01-01 to present | Historical analysis OK back to 2021 |
| **Forecast** | `/v1/heatmap` supports up to **+12 hours** beyond current time | ✅ We CAN show near-future heat risk. **This corrects the Context Handoff which said "no forecast".** |
| **Area cap** | Basic: 10 mi² per heatmap call. This is why we tile Phoenix into AOIs. | Spatial Engine tiles Phoenix into ≤10 mi² AOIs before any FortyGuard call |
| **Async only** | All analysis POSTs return `activity_id`. You must poll status until terminal. | FortyGuard client needs submit→poll→normalize pattern |
| **Credits** | Only deducted on success. Failed tasks cost nothing. | Safe to retry on transient failures |

> 📝 **Note added 2026-08-22:** The Context Handoff (§11, §18, §28) incorrectly stated FortyGuard has "no forecast capability." The actual API and the Participant Handbook (§7.2) confirm `/v1/heatmap` supports **forecasting up to +12 hours** from now. Use this to show near-future heat risk in the WHY panel and response planner. All other endpoints (env_params, satellite, heat_intelligence) should use dates matching the heatmap's time window.

---

## Async Flow (Every Analysis Endpoint)

```
POST /v1/heatmap  (or other analysis endpoint)
      ↓
Returns: { "activity_id": "abc-123" }
      ↓
GET /v1/status/abc-123   ← poll every ~2s
      ↓
Status: "pending" | "processing" → keep polling
Status: "succeeded" | "completed" → data.result has your output
Status: "failed" | "error" → task failed (no credits charged), check error
```

---

## Endpoint Overview

| Endpoint | Method | Plan | Returns | Quickstart Notebook |
|----------|--------|------|---------|-------------------|
| `/v1/heatmap` | POST | All plans | Tile-by-tile thermal map over a polygon AOI | 01 |
| `/v1/env_params` | POST | All plans | Heat index, AQI, solar irradiance, humidity at a point | 02 |
| `/v1/satellite` | POST | **Premium** | Land-cover segmentation of satellite tile (greenery, roads, buildings) | 03 |
| `/v1/streetview` | POST | **Premium** | Segmentation of ground-level street view image | 04 |
| `/v1/heat_intelligence` | POST | **Premium** | Multi-dimensional heat analysis as structured PDF report | 05 |
| `/v1/system/fetch-api-key-usage` | POST | All plans | Credit balance and billing-cycle usage | 00 |
| `/v1/status/{activity_id}` | GET | All plans | Status and result of any submitted analysis task | — |

> ℹ️ **HeatSentinel uses Premium plan** (hackathon credits). All endpoints are available to us including `/v1/satellite`, `/v1/streetview`, and `/v1/heat_intelligence`.

---

## Endpoint Details

### `POST /v1/heatmap` — Create Heatmap ⭐ PRIMARY

Creates a tile-by-tile thermal heatmap over a polygon Area of Interest (AOI).

**Request:**

```json
{
  "polygon_aoi": {
    "type": "Polygon",
    "coordinates": [
      [
        [-112.09, 33.44],
        [-112.06, 33.44],
        [-112.06, 33.46],
        [-112.09, 33.46],
        [-112.09, 33.44]
      ]
    ]
  },
  "start_date": "2026-08-22",
  "start_time": "14:00",
  "end_date": "2026-08-22",
  "end_time": "18:00",
  "analytic_type": "tcm",
  "granularity": 60,
  "filter_type": "all"
}
```

**Key Parameters:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `polygon_aoi` | GeoJSON Polygon | ✅ | **[longitude, latitude] order** — NOT lat/lon. ≤10 mi² for Basic plan. |
| `start_date` | string | ✅ | Format: `YYYY-MM-DD`. Min: `2021-01-01` |
| `start_time` | string | ✅ | Format: `HH:MM` (24h) |
| `end_date` | string | Optional | For time-series analysis |
| `end_time` | string | Optional | Max: `current_time + 12h` (forecast window) |
| `analytic_type` | enum | ✅ | `tcm` \| `time_of_measure` \| `exceedance` \| `persistence` |
| `granularity` | int | ✅ | `60` \| `80` \| `100` (meters). 60 = finest, most credits |
| `filter_type` | string | ✅ | Use `"all"` for standard requests |
| `threshold` | number | Conditional | Required when `analytic_type` is `exceedance` or `persistence` |
| `direction` | string | Conditional | Required with `threshold` for `exceedance`/`persistence` |

**`analytic_type` values:**
- `tcm` — Temperature Comfort Model (standard heat map, use this most often)
- `time_of_measure` — Raw observed temperature at measurement time
- `exceedance` — Hours where temperature exceeded a threshold (requires `threshold` + `direction`)
- `persistence` — Consecutive hours above threshold (requires `threshold` + `direction`) — **maps directly to our "Heat Persistence" metric**

> ✅ **For HeatSentinel:** Use `tcm` for baseline scans, `persistence` for Heat Persistence metric (native, no custom math needed), and forecast capability (end_time up to now+12h) for near-future risk in WHY panel.

**Response (via `/v1/status/{activity_id}`):**

```json
{
  "status": "succeeded",
  "data": {
    "result": {
      "tiles": [
        {
          "lon": -112.075,
          "lat": 33.455,
          "temperature": 42.3,
          "analytic_value": 42.3
        }
      ]
    }
  }
}
```

---

### `POST /v1/env_params` — Environmental Parameters ⭐ SECONDARY

Returns environmental data at a single point: heat index, AQI, solar irradiance, humidity, wind speed, etc.

**Request:**

```json
{
  "point": {
    "type": "Point",
    "coordinates": [-112.074, 33.448]
  },
  "date_time": "2026-08-22T14:00:00",
  "parameters": ["heat_index", "aqi", "solar_irradiance"]
}
```

> ⚠️ **Basic plan limit:** Max 3 parameters per request. **HeatSentinel has Premium** — more parameters allowed.

**Available Parameters:** `heat_index`, `aqi` (Air Quality Index), `solar_irradiance`, `humidity`, `wind_speed`, `wind_direction`, `dew_point`, `feels_like`, `uv_index`

**Use in HeatSentinel:** Feed into the Deterministic Analysis Engine for the vulnerability + environmental correlation. Great for the Data Analysis & Correlation track requirement.

---

### `POST /v1/satellite` — Satellite Segmentation (Premium) ✨

Land-cover segmentation from satellite imagery: greenery %, impervious surface %, buildings %, water %, bare soil %.

**Request:**

```json
{
  "point": {
    "type": "Point",
    "coordinates": [-112.074, 33.448]
  },
  "date_time": "2026-08-22T14:00:00"
}
```

**Response includes:** `greenery_pct`, `impervious_pct`, `building_pct`, `water_pct`, `bare_soil_pct`

> ✅ **Critical for HeatSentinel:** Tree canopy / greenery % is a direct input to the vulnerability score and the "tree cover ↔ heat" correlation analysis. This makes our Data Analysis track stronger.

---

### `POST /v1/streetview` — Street View Segmentation (Premium) ✨

Ground-level segmentation from street-view imagery: identifies walkable surfaces, shade, vegetation, buildings at human height.

> **Use in HeatSentinel:** Optional enhancement for the WHY panel — "Zone X has low shade coverage at pedestrian level."

---

### `POST /v1/heat_intelligence` — Heat Intelligence Report (Premium) ✨

Multi-dimensional heat analysis delivered as a structured report (PDF). Combines temperature with contextual layers (geographic, environmental, urban dynamics).

**Request:**

```json
{
  "point": {
    "type": "Point",
    "coordinates": [-112.074, 33.448]
  },
  "date_time": "2026-08-22T14:00:00"
}
```

> ✅ **Key for HeatSentinel's WHY panel:** Each high-priority zone can have a Heat Intelligence report generated. This directly powers the "WHY is this zone critical?" explanation — pairs temperature with context (urban dynamics, environmental layers). **This is a premium-only feature and we have access.**

---

### `POST /v1/system/fetch-api-key-usage` — Credits Check

Check remaining credit balance and usage for the current billing cycle.

```json
{}
```

**Response:** `{ "credits_remaining": 1500, "credits_used": 200, "billing_cycle_start": "2026-08-01" }`

> **Use first:** Run this at backend startup in dev mode to confirm the API key is valid and report credit balance.

---

### `GET /v1/status/{activity_id}` — Poll Status

Poll any submitted analysis task.

**Terminal statuses:**
- `succeeded` / `completed` → `data.result` contains output
- `failed` / `error` → task failed, no credits charged

**Recommended polling interval:** 2 seconds with exponential backoff up to 10s. Timeout after 120 seconds.

---

## HeatSentinel-Specific Usage Plan

| HeatSentinel Feature | FortyGuard Endpoint(s) | Notes |
|---------------------|----------------------|-------|
| City coarse scan | `/v1/heatmap` (analytic_type=tcm) | Tile Phoenix into ≤10 mi² AOIs |
| Heat Persistence metric | `/v1/heatmap` (analytic_type=persistence) | Native — no custom formula needed |
| Heat Anomaly metric | `/v1/heatmap` (tcm current) vs. `/v1/heatmap` (tcm historical same period) | Current vs. 2021-2025 baseline |
| Near-future risk (+12h) | `/v1/heatmap` (end_time = now + 12h) | ✅ Confirmed forecast support |
| Environmental correlation | `/v1/env_params` | AQI, solar irradiance, humidity for Data Analysis track |
| Greenery / tree cover | `/v1/satellite` | Greenery % for vulnerability score + correlation |
| WHY panel explanation | `/v1/heat_intelligence` | Per-zone contextual report (Premium) |
| Refine hotspot AOIs | `/v1/heatmap` on subdivided polygon | Adaptive Polygon Refinement (agent decides) |
| API health check | `/v1/system/fetch-api-key-usage` | At backend startup |

---

## Where to Add Your API Key

When ready to connect the backend:

1. Copy `d:\[Project]\HeatSentinel\.env.example` → `.env` (in root)
2. Add your key: `FORTYGUARD_API_KEY="your_key_here"`
3. The backend `config.py` (to be built) will load it via Pydantic Settings
4. The key is in `.gitignore` via `.env.*` rule — it will never be committed

> **Never** add the key to any file that gets committed. The `.env` is gitignored.

---

## Documentation Links

| Topic | URL |
|-------|-----|
| Introduction | https://docs-api.fortyguard.com/docs/introduction |
| Quickstart | https://docs-api.fortyguard.com/docs/quickstart |
| Authentication | https://docs-api.fortyguard.com/docs/authentication |
| Create Heatmap | https://docs-api.fortyguard.com/docs/create-heatmap |
| Satellite Segmentation | https://docs-api.fortyguard.com/docs/satellite-view-segmentation |
| Street View Segmentation | https://docs-api.fortyguard.com/docs/street-view-segmentation |
| Heat Intelligence | https://docs-api.fortyguard.com/docs/heat-intelligence |
| Environmental Parameters | https://docs-api.fortyguard.com/docs/environmental-parameters |
| Check Status | https://docs-api.fortyguard.com/docs/check-status |
| Credits Usage | https://docs-api.fortyguard.com/docs/credits-usage |
| Limitations | https://docs-api.fortyguard.com/docs/limitations |
| Release Notes | https://docs-api.fortyguard.com/docs/release-notes |
