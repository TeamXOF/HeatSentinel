# Step 12: Heat Layer Visualization on the Map

## Overview
This plan focuses on wiring the backend FortyGuard test-scan endpoint to the frontend and rendering real heat data on the MapLibre map. It will use React Query for data fetching, handle loading/error states, and render the GeoJSON as a colored `fill` layer (choropleth grid). A "Load Heat Data" button in the header will trigger the fetch, and the map will display a badge indicating if the data is LIVE or CACHED.

## Project Type
**FRONTEND / MAP RENDERING**

## Success Criteria
- Frontend can call `POST /api/fortyguard/test-scan`.
- MapLibre correctly renders the returned GeoJSON as a colored `fill` layer based on cell temperature.
- "Load Heat Data" button exists in the header to trigger the fetch.
- Loading indicator and error handling are implemented.
- A small badge indicates `mode: "live" | "cached"`.
- A simple legend indicates the temperature color scale.

## Tech Stack
- **React (Vite)**: Frontend framework.
- **TanStack React Query**: Data fetching and state management.
- **MapLibre GL JS**: Map rendering engine.
- **Lucide React**: For icons.

## File Structure
- `[NEW]` `/frontend/src/api/fortyguard.ts` (API client functions)
- `[MODIFY]` `/frontend/src/components/Map/HeatMap.tsx` (Add MapLibre sources/layers)
- `[MODIFY]` `/frontend/src/components/Layout/Header.tsx` (Add Load button)
- `[MODIFY]` `/frontend/src/App.tsx` (Wrap with React Query provider if not already there, and manage shared state)

## Task Breakdown

### 1. Build the API Client
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-architecture`
- **INPUT:** Step 11 API response format.
- **OUTPUT:** `src/api/fortyguard.ts` with `fetchTestScan()` using `fetch` or `axios`.
- **VERIFY:** Types map correctly to the backend response (`request_hash`, `mode`, `data`).

### 2. Add Header Controls
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **INPUT:** `Header.tsx`.
- **OUTPUT:** Add a "Load Heat Data" button. This will likely require lifting the trigger state to `App.tsx` or using a simple Zustand store/React Context to tell the Map component to fetch. Let's use a simple global state (Zustand or Context) so the Header can trigger the Map's query, OR just fetch it in `App.tsx` and pass the data down to `HeatMap`.
- **DESIGN DECISION:** Fetch the data at the `App.tsx` (or an intermediate wrapper) level using `useQuery`, and pass `heatData`, `isLoading`, and `refetch` down to Header and Map.

### 3. Render MapLibre Layer & Legend
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **INPUT:** `HeatMap.tsx`, `heatData`.
- **OUTPUT:** 
  - Add a MapLibre `GeoJSONSource` and a `fill` layer.
  - Implement a color interpolation step (`['interpolate', ['linear'], ['get', 'value'], ...]`) mapping temperatures (e.g. 80F -> Blue, 100F -> Yellow, 120F -> Red). *Note: We must inspect the FortyGuard output to see exactly which property name holds the temperature (often `value` or `temp`).*
  - Build a simple Legend overlay in the bottom corner of the map.
- **VERIFY:** Polygons render correctly without crashing WebGL.

### 4. Implement Status Badge & Error States
- **Agent:** `frontend-specialist`
- **INPUT:** Query status.
- **OUTPUT:** Display "LIVE DATA" or "CACHED" on the map UI based on `heatData.mode`. Display a toast or inline error if the request fails.

## Phase X: Verification (Mandatory Checklist)
- [ ] Ensure MapLibre `addSource` safely updates if data changes.
- [ ] Verify the FortyGuard GeoJSON property used for coloring matches the actual API output (we will log the first feature's properties to check).
- [ ] Socratic Gate was respected (Verified via `/grill-me`).
