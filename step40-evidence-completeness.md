# Step 40 — Recommendation Display & Evidence Completeness Pass

## Overview

A completeness audit pass ensuring every field in the product spec's evidence block is either
real and rendered, or honestly labeled as unavailable. Based on codebase inspection, three
critical gaps were found — none requiring new data ingestion. All fixes are in existing files.

---

## Pre-Flight Audit Results

| Field | Current State | Gap |
|---|---|---|
| `treeCoverPct` | Hardcoded `6.5` in `analysis.ts:197` | **FABRICATED** — no tree canopy data in pipeline |
| `recommendedAction` | Frontend-fabricated in `transformBackendZoneToZoneData()` | Not from agent tool |
| Backend `recommend_action` field | Absent from `ZoneEvidence` model | Never persisted |
| `explain_priority` agent trail | Absent from `WhyPanel` | No source citations or call IDs |
| Response Gap disclaimer in WhyPanel | Already present | No action needed |
| Disclaimer on AgentInsightsPage hotspot rail | Missing | Add one-liner |

---

## Decision: Tree Canopy

Tree canopy was never integrated (grep: zero hits for `tree_cover`, `canopy` in backend).
Integrating a real dataset is Phase 5-level work, out of scope for Step 40.

**Decision:** Set `treeCoverPct: null`. Render "Not available in this analysis".

> WARNING: The current `6.5` value is fabricated. A judge checking the data chain will find
> no tree canopy dataset in the backend. This MUST be fixed before the demo.

---

## Decision: recommend_action

The `recommend_action` tool produces real text during Heat Hunt, but output is never persisted
to `HeatZone`. The frontend generates a plausible string independently.

**Decision:** Add `recommend_action: Optional[str]` to `ZoneEvidence`. Persist agent output there.
For basic scan (no agent), fall back to the existing deterministic string.

---

## Proposed Changes

### TASK 1 — Backend: Fix `ZoneEvidence` model
**File:** `backend/app/models/zone.py`

Add to `ZoneEvidence`:
```python
tree_cover_pct: Optional[float] = None
recommend_action: Optional[str] = None
recommend_action_category: Optional[str] = None
```

Add to `HeatZone`:
```python
recommend_action: Optional[str] = None
```

**INPUT:** zone.py (2 Pydantic models)
**OUTPUT:** New optional fields, defaults all None
**VERIFY:** `python -c "from app.models.zone import ZoneEvidence; z = ZoneEvidence(current_temp_c=42,current_temp_f=107,persistence_hours=4,exceedance_hours=2); print(z.tree_cover_pct, z.recommend_action)"`  →  `None None`

---

### TASK 2 — Backend: Wire `recommend_action` in `heat_hunt_service.py`
**File:** `backend/app/agent/heat_hunt_service.py`

In `on_step_callback`, when `tool_name == "recommend_action"`, extract `action_text` and
`action_category` from tool output and stash them in a `pending_recommendations` dict on the
job (keyed by zone_id). In `finalize_heat_hunt` handler, apply them to zone objects before
final storage.

**INPUT:** `on_step_callback`, `finalize_heat_hunt` logic
**OUTPUT:** `zone.evidence.recommend_action` populated from real tool output after Heat Hunt
**VERIFY:** After a live Heat Hunt, job result zones have non-null `recommend_action`

---

### TASK 3 — Frontend: Fix `treeCoverPct` fabricated value
**File:** `frontend/src/api/analysis.ts`

- Line 197: `treeCoverPct: 6.5` → `treeCoverPct: ev.tree_cover_pct ?? null`
- Add `tree_cover_pct?: number | null` to `BackendZoneEvidence` interface
- Add `recommend_action?: string | null` and `recommend_action_category?: string | null` to `BackendZone` interface

**INPUT:** `analysis.ts` (BackendZoneEvidence + BackendZone interfaces + transform function)
**OUTPUT:** `treeCoverPct` is null for all zones until a dataset is integrated
**VERIFY:** TypeScript compiles; `useZones()` returns `treeCoverPct: null`

---

### TASK 4 — Frontend: Wire `recommendedAction` from backend field
**File:** `frontend/src/api/analysis.ts`

In `transformBackendZoneToZoneData`, update `recommendedAction` to prefer `bz.recommend_action`:

```typescript
recommendedAction: {
  category: bz.recommend_action_category
    || (bz.priority_level === 'CRITICAL' ? 'Immediate Tactical Response' : ...),
  actionText: bz.recommend_action
    || (ev.cooling_resources_in_1mi === 0
      ? `Deploy Mobile Hydration & Cooling Unit to ${bz.name}`
      : `Expand operational capacity at ...`),
  ...
}
```

**INPUT:** `transformBackendZoneToZoneData` function
**OUTPUT:** Real agent text when available, deterministic fallback otherwise
**VERIFY:** TypeScript compiles; `ZoneData.evidence.recommendedAction.actionText` is non-empty

---

### TASK 5 — Frontend: Add tree cover + data sources to `WhyPanel`
**Files:** `WhyPanel.tsx`, `types.ts`, `analysis.ts`

**5a — types.ts:** Add to `ZoneEvidenceDetail`:
```typescript
treeCoverPct?: number | null;
dataSources?: string[];
```

**5b — analysis.ts transform:** Wire:
```typescript
treeCoverPct: ev.tree_cover_pct ?? null,
dataSources: ev.data_sources || [],
```

**5c — WhyPanel.tsx:** In Section A (Heat & Thermal Metrics 2×2 grid), add 5th cell:
```tsx
<div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex flex-col col-span-2">
  <span className="text-[10px] uppercase font-bold text-slate-400">Tree Canopy Cover</span>
  <span className="text-xs font-bold text-slate-900 mt-0.5">
    {evidence.treeCoverPct != null
      ? `${evidence.treeCoverPct.toFixed(1)}%`
      : <em className="text-slate-400 font-normal text-[11px]">Not available in this analysis</em>
    }
  </span>
</div>
```

**5d — WhyPanel.tsx:** Add collapsible audit trail section between Section 2 and Section 3:
```tsx
{evidence.dataSources && evidence.dataSources.length > 0 && (
  <details id="why-panel-data-sources" className="bg-slate-50/70 border border-slate-200/70 rounded-2xl overflow-hidden">
    <summary className="p-3.5 cursor-pointer text-xs font-bold text-slate-600 flex items-center gap-2 select-none">
      <Database size={13} className="text-slate-400" />
      Evidence Sources & Audit Trail
    </summary>
    <div className="px-4 pb-3 space-y-1 border-t border-slate-200/60">
      {evidence.dataSources.map((src, i) => (
        <p key={i} className="text-[11px] text-slate-500 leading-snug">{src}</p>
      ))}
    </div>
  </details>
)}
```

**INPUT:** `types.ts` (ZoneEvidenceDetail), `analysis.ts` (transform), `WhyPanel.tsx` (Section A + new section)
**OUTPUT:** Tree cover cell shows honest "Not available"; data sources audit trail expandable
**VERIFY:** WhyPanel renders without TS errors; tree canopy visible; data sources section present

---

### TASK 6 — Frontend: Inline disclaimer on AgentInsightsPage hotspot rail
**File:** `frontend/src/pages/AgentInsightsPage.tsx`

Below the "Launch Response Planner" button in the right rail Identified Risk Hotspots card:
```tsx
<p className="text-[10px] text-slate-400 italic text-center mt-2 leading-snug">
  Response Gap is a composite risk indicator, not an official public-health index.
</p>
```

**INPUT:** `AgentInsightsPage.tsx` — right rail hotspots card (after Link to /response-planner)
**OUTPUT:** Disclaimer visible inline with displayed Response Gap scores
**VERIFY:** Disclaimer renders in browser

---

## Files Changed (6 total)

| File | Change | Type |
|---|---|---|
| `backend/app/models/zone.py` | +tree_cover_pct, +recommend_action, +recommend_action_category | MODIFY |
| `backend/app/agent/heat_hunt_service.py` | Wire recommend_action tool output → zone field | MODIFY |
| `frontend/src/api/analysis.ts` | treeCoverPct: null, wire bz.recommend_action, +dataSources | MODIFY |
| `frontend/src/types.ts` | +treeCoverPct, +dataSources on ZoneEvidenceDetail | MODIFY |
| `frontend/src/components/WhyPanel.tsx` | Tree cover cell + data sources audit trail | MODIFY |
| `frontend/src/pages/AgentInsightsPage.tsx` | Inline Response Gap disclaimer | MODIFY |

---

## Execution Order

```
TASK 1 (zone.py)              — do first, backend model
TASK 3 (analysis.ts types)    — independent of Task 2
TASK 4 (analysis.ts transform) — after Task 3
TASK 5 (types.ts + WhyPanel)  — after Task 3
TASK 6 (AgentInsightsPage)    — independent, fastest
TASK 2 (heat_hunt_service.py) — most complex, do last
```

---

## Verification Plan

### Automated
```powershell
# Backend model smoke
Set-Location -LiteralPath "d:\[Project]\HeatSentinel\backend"
python -c "from app.models.zone import ZoneEvidence; z = ZoneEvidence(current_temp_c=42,current_temp_f=107,persistence_hours=4,exceedance_hours=2); print(z.tree_cover_pct, z.recommend_action)"

# TypeScript (0 new errors from Step 40)
Set-Location -LiteralPath "d:\[Project]\HeatSentinel\frontend"
npx tsc --noEmit --skipLibCheck 2>&1 | Select-Object -Last 15
```

### Manual
1. Open Agent Insights → confirm Response Gap disclaimer visible in hotspot rail
2. Click WHY on any zone → confirm:
   - Tree Canopy: "Not available in this analysis" (not 6.5%)
   - Data Sources section expandable with real Census/MAG source strings
   - Recommended Action renders with non-empty text
3. Run full Heat Hunt → after completion → click WHY on top zone → confirm `recommend_action` text traces to agent tool output, not fabricated

---

## Phase X — Verification Checklist

- [ ] Backend: `tree_cover_pct` and `recommend_action` optional fields exist on ZoneEvidence
- [ ] Frontend: `treeCoverPct: null` everywhere (no fabricated 6.5)
- [ ] Frontend: WhyPanel tree canopy cell renders "Not available in this analysis"
- [ ] Frontend: WhyPanel data sources audit trail expandable
- [ ] Frontend: AgentInsightsPage hotspot rail has inline disclaimer
- [ ] Frontend: TypeScript compile — 0 new errors
- [ ] Manual: Recommended action text renders in WHY panel
- [ ] Manual: After real Heat Hunt — recommend_action traces to agent tool

