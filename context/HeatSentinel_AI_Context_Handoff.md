# HeatSentinel AI — Context / Handoff File for Another LLM

## Purpose of this file

This file is a complete working context for continuing the FortyGuard Hackathon'26 project in another LLM/agent. Read this file before making recommendations so you do not restart ideation or accidentally change decisions that have already been made.

## Update log

**2026-08-21 revision:** demo city decision resolved (Phoenix primary, NYC secondary/validation — Section 30), FortyGuard API details verified against the official hackathon quickstart repo (Section 16), and one prior assumption corrected — FortyGuard has no forecast capability, historical + current-day only (Sections 11, 16, 18, 19, 28 updated accordingly). Treat anything marked **Update** or **Correction** below as superseding earlier text in the same section. [CORRECTED 2026-08-26: FortyGuard DOES support +12h forecasting via end_time. See context/fortyguard-api-reference.md.]

---

# 1. Current project

## Project name
**HeatSentinel AI**

## Working subtitle
**Autonomous Hyperlocal Heat Response Intelligence**

## Core one-line pitch
> HeatSentinel is not another heat-risk map; it is an agentic heat-response system that uses FortyGuard's hyperlocal data to decide where to investigate, combine heat with human vulnerability and resource gaps, and determine what the city should prioritize next.

## Simple explanation for the team
We are building an AI system that helps a city answer:

> **Where is extreme heat going to be a serious problem for people, and what should the city do about it?**

A normal heat application may say:
> This area is 42°C.

HeatSentinel should go further and say:
> This area is going to reach about 42°C, stay dangerously hot for several hours, has a high concentration of vulnerable people, has limited protective resources nearby, and therefore should be one of the city's highest-priority intervention areas.

The core idea is **not just finding hot places**. It is finding **where heat is likely to hurt people most and what should happen next**.

---

# 2. Hackathon context

## Hackathon
**FortyGuard Hackathon'26**

## Theme
Urban heat and hyperlocal temperature intelligence.

## Tagline
> Design cooler, smarter cities using hyperlocal temperature intelligence.

## Selected tracks
1. Agentic AI
2. Data Analysis & Correlation

## Team
3 members:
- AI/LLM engineer
- Backend developer
- Frontend/data-visualization developer

## Constraints
- Software only
- No hardware
- No sensors
- No IoT
- No paid commercial datasets
- No heavy ML training from scratch
- About 6 days to build/deploy MVP
- Must be visually compelling and demoable in 3–5 minutes
- FortyGuard's data coverage is confirmed U.S.-only across every endpoint (verified via the official hackathon quickstart repo) — this ruled out Abu Dhabi and Dubai outright
- **Target cities locked: Phoenix, AZ (primary build/demo city) and New York City (secondary — validation and possible stretch-goal AOI). See Section 30 for the full reasoning and the scoping split between the two.**

## Judging criteria provided by user
- Impact & Relevance: **40%**
- Technical Execution: **35%**
- Innovation: **15%**
- Communication: **10%**

Impact + Technical = **75%**, so the project must solve a real urban heat problem and have strong technical implementation.

The FortyGuard team screens to a top 10 first, then judges score the top 10.

---

# 3. Why we pivoted to this project

The team originally considered a rural agriculture idea, but the hackathon is explicitly urban-focused and the selected tracks are Agentic AI + Data Analysis & Correlation.

Any agriculture angle, if used at all, must be urban/peri-urban agriculture, rooftop farming, or food supply into cities. The current HeatSentinel concept does **not** depend on agriculture and should remain urban-heat focused.

---

# 4. Original HeatGuardian idea and why it evolved

Original concept:
**HeatGuardian AI — Hyperlocal Vulnerability Advisor**

Original idea:
- Combine FortyGuard temperature data with demographic/socioeconomic data.
- Identify neighborhoods with high heat exposure + vulnerability.
- Let an AI assistant answer questions like “Which neighborhoods will see the hottest days next week?”
- Recommend cooling centers/hydration stations.

This was considered strong but around a 9.3-level concept because a judge could perceive it as:

> heat map + demographic overlays + chatbot

The concept was then strengthened into HeatSentinel.

---

# 5. Key strategic insight

The project should **not** try to claim that temperature + vulnerability analysis itself is novel.

Existing solutions already do parts of that. For example, the CDC Heat & Health Index already combines historical heat, health burden, sociodemographic factors, and natural/built-environment characteristics to characterize heat vulnerability.

Likewise, FortyGuard itself already provides advanced temperature analytics beyond a simple map.

Therefore, the defensible innovation is the **agentic decision layer on top of hyperlocal heat intelligence**.

The project should be positioned as:

> Existing systems are good at measuring or mapping heat vulnerability. HeatSentinel focuses on the next layer: dynamically investigating hyperlocal heat risk and turning it into prioritized, evidence-backed response decisions.

Do **not** claim that there is no existing solution like HeatSentinel.

---

# 6. What makes HeatSentinel unique

## Primary differentiator
### Adaptive Agentic Spatial Investigation + Response Gap Analysis

The strongest technical/product differentiator is:

> The AI agent actively decides where to investigate next using hyperlocal FortyGuard data, then combines heat exposure with population vulnerability and protective-resource gaps to prioritize actions.

### The project loop

```text
FortyGuard hyperlocal heat data
        ↓
Detect hotspots / suspicious zones
        ↓
Agent investigates high-interest zones
        ↓
Query/refine additional polygons
        ↓
Combine vulnerability + environmental + resource data
        ↓
Calculate Heat Exposure / Persistence / Anomaly
        ↓
Calculate Response Gap
        ↓
Rank priority zones
        ↓
Recommend response
        ↓
Re-check / re-evaluate
```

This is much stronger than simply:

```text
FortyGuard → Heatmap → Dashboard
```

---

# 7. Core product concept

## HeatSentinel should behave like an AI heat-response analyst

It should be able to:

1. Scan a city or set of zones.
2. Pull FortyGuard hyperlocal temperature intelligence.
3. Find hotspots or unusual patterns.
4. Decide which areas deserve deeper investigation.
5. Query smaller/refined polygons for those areas.
6. Pull open demographic/vulnerability data.
7. Pull resource/location data such as cooling centers, hospitals, parks, etc., where available.
8. Calculate deterministic heat metrics.
9. Calculate vulnerability/resource-gap metrics.
10. Rank priority zones.
11. Explain why each zone is high priority.
12. Recommend a practical action.
13. Re-check priority areas when new data is available.

---

# 8. Signature feature: Heat Hunt

The main interactive feature should be:

## `RUN HEAT HUNT`

Instead of a passive dashboard, the user triggers an autonomous investigation.

Expected experience:

```text
RUN HEAT HUNT
      ↓
Scan city zones
      ↓
FortyGuard analysis
      ↓
Find hot / abnormal areas
      ↓
Agent investigates important zones
      ↓
Vulnerability + resource correlation
      ↓
Rank critical response gaps
      ↓
Recommend action
```

Example system output:

```text
HEAT HUNT STARTED

✓ Scanning 36 zones
✓ FortyGuard current data
✓ Historical comparison
✓ Persistence / exceedance analysis
✓ Vulnerability correlation
✓ Resource-gap analysis

⚠ 5 priority zones detected

1. Zone 17 — CRITICAL
2. Zone 09 — CRITICAL
3. Zone 24 — HIGH
4. Zone 31 — HIGH
5. Zone 12 — HIGH
```

The exact number of zones is an implementation choice, not a requirement.

---

# 9. Signature feature: Adaptive Polygon Refinement

This is one of the strongest technical ideas.

Instead of analyzing every location at maximum detail immediately:

```text
Whole city
   ↓
Coarse set of polygons
   ↓
FortyGuard scan
   ↓
Top hotspots / highest-interest areas
   ↓
Subdivide those areas into smaller polygons
   ↓
Re-query FortyGuard
   ↓
Find micro-hotspots
```

The agent effectively says:

> “Something interesting is happening here; I need to investigate this area at finer spatial resolution.”

This should be framed as a major example of real agentic behavior because the agent influences the next data-acquisition step.

---

# 10. Response Gap concept

## Why it matters

A neighborhood may be extremely hot but have strong protective resources. Another may be slightly less hot but have many vulnerable people and almost no protection.

Therefore the system should not only measure heat or generic vulnerability.

It should estimate a **Response Gap**.

Conceptual structure:

```text
Heat exposure
      ×
Population vulnerability
      ×
Protective-resource deficit
      =
Response Gap / Priority
```

This is a project-derived metric and should be presented as a transparent, explainable analytical framework, not as an official medical/public-health index.

Suggested interpretation:
- high heat + high vulnerability + low protection = high response gap
- high heat + high vulnerability + many resources = still risky but lower unmet-response priority

---

# 11. Core derived metrics

Avoid heavy ML. Use deterministic/statistical calculations.

## A. Heat Exposure

Conceptual measure:

```text
Heat Exposure = cumulative temperature above a selected threshold
```

Example implementation:

```text
degree_hours = Σ max(T_hour - threshold, 0)
```

Use a threshold appropriate to the scenario and document it.

## B. Heat Persistence

```text
number of consecutive hours above threshold
```

**Update:** this is now a native FortyGuard `analytic_type` (`persistence`) — no custom calculation needed, just the right API call with `threshold` and `direction` set. See Section 16.

Example:
> Zone 17 remains above 35°C for 11 hours.

## C. Heat Anomaly

```text
Current/recent temperature − historical reference
```

**Correction:** FortyGuard does not provide forecast data (confirmed — see Section 16). Anomaly must be built as current-day (or recent-window) reading vs. a historical baseline for the same location and time of year, both pulled from the `tcm` heatmap layer. Drop "forecast" language everywhere in the pitch and demo.

Example:
> 42.3°C current reading versus 39.2°C historical reference = +3.1°C anomaly.

Important: exact historical-baseline construction must be implemented and validated against actual available FortyGuard temporal data.

## D. Population Exposure

Potential concept:

```text
Population × normalized heat exposure
```

## E. Vulnerability Score

Can combine normalized variables such as:
- elderly population percentage
- population density
- socioeconomic vulnerability
- selected environmental variables

Use open sources where feasible.

## F. Resource Deficit

Potential factors:
- cooling centers nearby
- hospitals / emergency facilities nearby
- parks/green resources where useful
- other public heat-response infrastructure

Availability depends on city/open datasets.

## G. Response Gap

Combine heat exposure, vulnerability, and resource deficit into a transparent project score.

The exact final weighting should be chosen and documented before the demo.

---

# 12. Correlation analysis

The selected Data Analysis & Correlation track should be visible in the product.

Potential analyses:

- tree canopy ↔ heat exposure
- population density ↔ heat exposure
- elderly percentage ↔ heat exposure
- socioeconomic vulnerability ↔ heat exposure

Possible metrics:
- Pearson correlation for approximately linear numeric relationships
- Spearman rank correlation for ordinal/nonlinear monotonic relationships

Important scientific communication rule:

Say:
> “These variables are associated with heat exposure.”

Do not say:
> “This proves that variable X causes heat.”

unless causal identification is actually justified.

---

# 13. Agentic AI architecture

## Important philosophy
The LLM is **not the calculator**.

Quantitative calculations should be deterministic and reproducible.

The LLM should primarily:
- choose tools
- decide what to investigate next
- coordinate workflow
- interpret structured results
- generate human-readable explanations/recommendations

Conceptual flow:

```text
FortyGuard / external data
       ↓
Analysis engine
       ↓
Structured metrics
       ↓
Agent
       ↓
Tool selection / investigation decision
       ↓
Recommendation + explanation
```

This is much more defensible than asking the LLM to invent risk scores.

---

# 14. Agent tool concepts

Exact implementation can use OpenAI function/tool calling, LangChain, CrewAI, or AutoGen. Do not use a framework simply for branding; choose the simplest robust option.

Recommended conceptual tools:

## `scan_city`
Purpose:
- run a coarse city scan across polygons/AOIs

Inputs:
- city/region identifier
- polygon list or polygon generator parameters
- time window
- threshold/analysis settings

Output:
- per-zone structured metrics

## `query_fortyguard_heat`
Purpose:
- call FortyGuard with a polygon AOI and temporal settings

Inputs:
- GeoJSON polygon
- temporal parameters
- desired spatial resolution/heatmap parameters where supported

Output:
- structured FortyGuard response + metadata

## `refine_hotspot`
Purpose:
- split a hotspot into smaller polygons for deeper inspection

Inputs:
- hotspot polygon
- refinement strategy

Output:
- child polygons

## `get_vulnerability_data`
Purpose:
- retrieve/lookup demographic and socioeconomic data

## `get_resources`
Purpose:
- retrieve cooling centers / hospitals / parks / other available response resources

## `calculate_risk_metrics`
Purpose:
- calculate exposure, persistence, anomaly, vulnerability, resource deficit

## `calculate_response_gap`
Purpose:
- produce transparent priority score

## `recommend_action`
Purpose:
- convert evidence into prioritized response recommendation

## `explain_priority`
Purpose:
- return evidence trail for why a zone ranked where it did

---

# 15. High-level architecture

```text
                    ┌─────────────────────┐
                    │ City Official / User│
                    └──────────┬──────────┘
                               │
                         Run Heat Hunt
                               │
                               ▼
                    ┌─────────────────────┐
                    │ HeatSentinel Agent  │
                    │    Orchestrator     │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼──────────────────┐
             │                 │                  │
             ▼                 ▼                  ▼
       FortyGuard         Vulnerability        Resources
        Tool(s)              Tool(s)             Tool(s)
             │                 │                  │
             └─────────────────┼──────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Analysis Engine     │
                    │                     │
                    │ exposure            │
                    │ persistence         │
                    │ anomaly             │
                    │ vulnerability       │
                    │ resource deficit    │
                    │ response gap        │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Priority Ranking    │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Action Recommendation│
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │ City Command Center │
                    └─────────────────────┘
```

---

# 16. FortyGuard API strategy

## Verified-vs-assumption rule

Do not invent FortyGuard endpoint names.

**Update:** the endpoints below are now verified against FortyGuard's official hackathon quickstart repo (`github.com/FortyGuard-Tech/temperature-api-quickstart`), which ships a working Python client and runnable notebooks for every endpoint. This supersedes the earlier assumption-based research. One correction: the earlier note that the API supports "near-term forecast" was **wrong** — the temperature catalog only covers 2021 through the current day, and future dates fail outright. Forecast language has been removed from Sections 11, 18, and 19.

## Confirmed endpoints

| Endpoint | Method | Tier | Purpose |
|---|---|---|---|
| `/v1/system/fetch-api-key-custom-usage` | POST | Both | Usage/credit check |
| `/v1/heatmap` | POST | Both | Thermal map over a polygon AOI — the core endpoint |
| `/v1/env_params` | POST | Both | Heat index, AQI, solar irradiance at a point |
| `/v1/satellite` | POST | Premium | Land-cover classes from satellite imagery |
| `/v1/streetview` | POST | Premium | Segmentation of a ground-level view |
| `/v1/heat_intelligence` | POST | Premium | Multi-dimensional PDF report |
| `/v1/status/{activity_id}` | GET | Both | Poll for async task completion |

Base URL: `https://api.fortyguard.com`. All analysis endpoints are asynchronous: submit → get `activity_id` → poll status until `Completed`. The official Python client (`fortyguard/client.py` in the quickstart repo) handles this polling for you.

## `/v1/heatmap` request shape (confirmed)

- `polygon_aoi`: GeoJSON FeatureCollection, coordinates as **[longitude, latitude]** — not the intuitive order
- `start_date` / `start_time`, optional `end_date`
- `filter_type`: 1 = single hour, 2 = range of hours, 3 = single day, 4 = range of days (capped ~31 days)
- `granularity`: 60, 80, or 100 meters — 60m is the finest tile size available
- `analytic_type`: `tcm` (default snapshot temperature), `time_of_measure`, `exceedance`, `persistence`
  - **`exceedance` and `persistence` are native to the API** — count of hours past a threshold, and longest continuous run past it. This covers two of our three planned heat metrics (Section 11) without custom calculation.
  - `threshold` (°C) and `direction` (`above`/`below`) are required for `exceedance`/`persistence`

## Tier and area limits

- Basic tier covers `/v1/heatmap` and `/v1/env_params` — enough for the core MVP loop
- **Basic tier caps heatmaps at 10 mi² per call** — a citywide scan will likely need multiple tiled calls, not one
- Satellite/street-view segmentation and the full `heat_intelligence` PDF report require Premium — treat as nice-to-have enrichment, not required for MVP
- Date range: 2021 to today only, no future dates

## What we want to achieve with FortyGuard

Use it much more deeply than a simple map:

1. **Multi-polygon analysis**
   - compare many AOIs in the same city

2. **Historical + current-day analysis**
   - combine `tcm`, `exceedance`, and `persistence` over the same AOI (no forecast layer exists — corrected from earlier assumption) [CORRECTED 2026-08-26: FortyGuard DOES support +12h forecasting via end_time. See context/fortyguard-api-reference.md.]

3. **Agent-driven dynamic polygon querying**
   - the agent chooses which areas deserve deeper queries

4. **Derived metrics**
   - exposure (`tcm`)
   - persistence (native `analytic_type`)
   - anomaly (current vs. historical baseline — Section 11)

5. **Adaptive refinement**
   - coarse scan → hotspot → smaller polygons → re-query
   - note: refining below the 60m tile floor doesn't reveal new tile-level detail, only a better area-weighted mean over the tiles a smaller polygon overlaps

6. **Re-evaluation / monitoring**
   - recheck high-priority areas when new data is available

These are the target advanced patterns. The final MVP should demonstrate at least 3 clearly, ideally 5+.

## Reference implementation to study, not rebuild

The quickstart repo's use-case notebooks are close analogues of our own loop:
- `urban_planner_bus_stop_prioritization.ipynb` — ranks points by heat risk into an intervention list (maps to our priority-ranking step)
- `public_parks_heat_resilience_audit.ipynb` — threshold-triggered recommendations citing real programs like EPA/USDA (maps to our `recommend_action` tool)

Use "Use this template" on the repo to spin up a working copy rather than re-implementing the client wrapper from scratch.

---

# 17. Existing-solution positioning

Do not argue that HeatSentinel is the first heat-risk system.

Instead use this positioning:

### Existing categories
- heat maps / monitoring
- heat vulnerability indices
- public-health risk maps
- heat action plans
- weather dashboards

### HeatSentinel's layer
**Agentic operational decision support on top of hyperlocal heat intelligence.**

The strongest wording:

> “Existing systems are very good at measuring or mapping heat vulnerability. HeatSentinel focuses on the next layer: dynamically investigating hyperlocal heat risk and turning it into prioritized, evidence-backed response decisions.”

---

# 18. UI / product concept

The main screen should feel like a **City Heat Command Center**.

## Main components

### Top summary
- Critical zones
- High-risk zones
- Moderate zones
- Low-risk zones

### Interactive map
- hyperlocal heat visualization
- risk overlay
- selected priority zone

### Priority panel
Example:

```text
ZONE 17 — CRITICAL

42.3°C current reading
11h heat persistence
+3.1°C anomaly
18% elderly population
5% tree cover
0 cooling centers

Recommended action:
Deploy mobile cooling support during peak heat window.
```

### “WHY?” / evidence panel
Show:
- score breakdown
- data sources
- FortyGuard evidence
- external-data evidence
- explanation of ranking

### Agent activity panel
Show steps such as:
- scanning zones
- investigating hotspot
- refining polygon
- querying additional data
- calculating response gap
- generating recommendation

This makes the agent visibly active during the demo.

---

# 19. Demo narrative

Target 3–5 minutes.

## Opening line
> “Cities already know when a heatwave is coming. The problem is that they don't always know where it will hurt people the most.”

Then:
> “This is HeatSentinel.”

Click `RUN HEAT HUNT`.

Show autonomous scanning.

Then show a critical zone.

Example evidence:
- ~42°C current reading
- heat persistence
- heat anomaly
- elderly population
- tree/resource deficit
- cooling resources

Then show:
> `Zone 17 is the highest-priority intervention area.`

Click `WHY?`.

Show evidence trail.

Then show action recommendation.

Closing line:
> **“HeatSentinel doesn't just tell cities where it's hot. It tells them where heat will hurt people most — and what to do next.”**

---

# 20. Judging strategy

## Impact & Relevance — 40%
Strong story:
- urban heat is a real public-health problem
- risk is unevenly distributed
- cities have finite resources
- HeatSentinel helps prioritize limited interventions
- target users: city officials, emergency management, public health, NGOs

## Technical Execution — 35%
Must demonstrate:
- real FortyGuard API calls
- multiple AOIs
- temporal analysis
- deterministic calculations
- external data integration
- working agent/tool loop
- adaptive investigation
- explainability

## Innovation — 15%
Focus on:
- agentic spatial investigation
- adaptive polygon refinement
- response gap metric
- turning heat intelligence into action prioritization

## Communication — 10%
Keep the demo visually simple:

```text
Scan → Detect → Investigate → Prioritize → Act
```

---

# 21. Team responsibilities

## Member 1 — AI/LLM engineer
Own:
- agent orchestration
- tool calling
- prompts
- agent state
- dynamic investigation
- recommendation logic

Main question:
> How does the AI decide what to investigate and what action to recommend?

## Member 2 — Backend developer
Own:
- FortyGuard integration
- external APIs/data
- processing
- database
- GeoJSON handling
- scoring engine
- caching/background tasks

Main question:
> How do we get and process data reliably?

## Member 3 — Frontend/data visualization developer
Own:
- command center UI
- map
- heat/risk layers
- charts
- ranking panel
- evidence panel
- agent activity visualization

Main question:
> How do we make the intelligence understandable immediately?

## Project manager role
- keep scope under control
- make sure the core loop works first
- coordinate integration
- verify API/data assumptions
- keep the demo narrative simple
- prevent unnecessary features from consuming the 6-day schedule

---

# 22. 6-day MVP schedule

## Day 1 — Foundation
Goal: prove FortyGuard works.

Deliverables:
- Phoenix AOI confirmed against live FortyGuard data (city already locked — see Section 30)
- API credentials confirmed
- one polygon query working
- raw response parsed
- minimal map visualization

## Day 2 — Heat analytics
Build:
- multiple polygon scanning
- heat exposure
- persistence
- anomaly/reference comparison
- structured zone metrics

## Day 3 — Correlation + vulnerability
Build:
- selected open demographic dataset
- socioeconomic/elderly data
- environmental/resource data as feasible
- vulnerability score
- resource deficit
- response gap

## Day 4 — Agent
Build:
- tool calling
- Heat Hunt workflow
- adaptive hotspot investigation
- polygon refinement
- explanation/evidence generation

## Day 5 — UI + integration
Build:
- command center
- map
- priority list
- evidence panel
- agent activity panel
- recommendation display

## Day 6 — hardening + demo
Do not add large new features.

Focus on:
- bug fixes
- API failure handling
- caching
- demo dataset fallback
- latency
- visual polish
- pitch rehearsal
- screen recording

---

# 23. Definition of Done

The MVP is considered complete when the team can demonstrate this exact chain end-to-end:

```text
User clicks Run Heat Hunt
        ↓
City zones are scanned
        ↓
Real FortyGuard data is retrieved
        ↓
High-interest areas are identified
        ↓
Agent investigates/refines at least one area
        ↓
External vulnerability/resource data is joined
        ↓
Heat exposure/persistence/anomaly calculated
        ↓
Response gap calculated
        ↓
Top priority zone selected
        ↓
Recommendation generated
        ↓
Evidence shown in UI
```

If this chain works reliably, the project is already a strong hackathon MVP.

---

# 24. Risks and mitigations

## Risk 1: FortyGuard coverage / access issue
Mitigation:
- verify the Phoenix AOI on Day 1 with the real API key
- do not assume any city or sub-area is covered until confirmed live
- San Jose is a documented fallback if Phoenix data access is a problem — it's FortyGuard's own bundled quickstart demo city, with verified sample data and offline-replay notebooks (lowest technical risk, weaker heat narrative)
- use recorded/cacheable responses for demo resilience where rules permit

## Risk 2: API endpoint mismatch
Mitigation:
- use current official documentation
- do not invent endpoint names
- implement a small wrapper around verified endpoints

## Risk 3: External data not available for chosen city
Mitigation:
- pick a city with strong open-data availability
- reduce external features rather than weakening FortyGuard integration

## Risk 4: Agent too slow or unreliable
Mitigation:
- keep agent tool set small
- deterministic analysis engine
- cache expensive FortyGuard queries
- precompute baseline grids where allowed

## Risk 5: Too many features
Mitigation:
- prioritize Heat Hunt + response gap + evidence trail
- treat everything else as optional

## Risk 6: Overclaiming causal relationships
Mitigation:
- use association language for correlation
- show methodology and assumptions

## Risk 7: Demo API/network failure
Mitigation:
- cache valid responses where permitted
- keep a deterministic fallback demo scenario
- clearly label cached/fallback mode if used

---

# 25. What NOT to build

Do not spend the 6 days on:
- custom foundation models
- training deep-learning models from scratch
- a mobile app
- a complex user-management system
- full production-grade microservice architecture
- generic chatbot features
- fancy UI without working agent/tool logic
- generic weather APIs replacing FortyGuard
- agriculture features that dilute the urban-heat story

---

# 26. Recommended technology direction

Keep the stack simple.

Possible stack:
- Python backend
- FastAPI or similar lightweight backend
- GeoJSON/geospatial processing
- pandas/numpy/scipy as needed for analytics
- LLM with tool/function calling
- Streamlit, React + Leaflet, Mapbox, or similar frontend
- simple database/cache such as SQLite/PostgreSQL/Redis depending on team familiarity

For a 6-day hackathon, optimize for **working integration**, not architectural complexity.

---

# 27. Open-data candidates discussed

Potential sources to investigate:
- US Census / ACS
- CDC Heat & Health Index / Heat & Health Tracker resources
- OpenStreetMap
- NASA SEDAC
- local government open-data portals
- tree canopy / land-cover sources
- cooling-center / public-facility datasets
- population and age demographics

## Verified sources for locked target cities

**Phoenix, AZ**
- Maricopa Association of Governments (MAG) Heat Relief Network — public map of 200+ cooling/hydration/respite locations
- ASU Resilience GIS Data hub (`resilience.asu.edu`) — downloadable shapefiles, including a cooling-centers layer
- Maricopa County Dept of Public Health annual Heat Deaths Report — real mortality data for the impact narrative
- US Census / ACS at tract level for elderly %, poverty rate, housing/AC access

**New York City**
- NYC DOHMH Heat Vulnerability Index (HVI) — published, downloadable, neighborhood-level (UHF34), built from surface temperature, green space, income, and AC access. Usable both as a data source and as a **validation benchmark** for our own Response Gap score.
- NYC Open Data portal for cooling-center locations and park/green-space boundaries

Use only datasets that are actually accessible, legal to use, and practical for the selected demo city(ies).

---

# 28. Important factual/verification notes

**Update:** the FortyGuard official hackathon quickstart repo (`github.com/FortyGuard-Tech/temperature-api-quickstart`) has now been reviewed directly, which confirms most of this section and corrects one item.

Confirmed:
- FortyGuard provides hyperlocal heatmap capability using polygon AOIs, centered on `POST /v1/heatmap` with async retrieval via `GET /v1/status/{activity_id}`.
- `exceedance` and `persistence` are real, native `analytic_type` options on the heatmap endpoint — not something we need to build ourselves.
- Coverage is confirmed **U.S.-only** across every endpoint.

Corrected:
- **No forecast capability exists.** The temperature catalog covers 2021 through today only; future dates fail. Earlier notes describing "near-term forecast use" were wrong and have been corrected throughout this document (Sections 11, 16, 18, 19). [CORRECTED 2026-08-26: FortyGuard DOES support +12h forecasting via end_time. See context/fortyguard-api-reference.md.]

Still outstanding:
- The quickstart repo's README is the primary documentation reviewed so far. A separate, more formal API reference (a hosted docs site or OpenAPI spec with full error codes and edge-case parameters) hasn't been confirmed to exist yet — check for one inside the hackathon's actual dev portal.
- Exact request/response behavior should still be confirmed live with the real hackathon API key before final implementation — a README is strong evidence, not a substitute for a live call.
- Never fabricate current endpoints or fields.

CDC HHI and NYC's own HVI are both examples of existing heat-vulnerability solutions. This matters because our novelty claim must be about the **agentic operational layer**, not merely "we combine temperature and vulnerability." NYC's HVI in particular gives us a real, published benchmark to validate our own Response Gap score against — a technical-execution asset, not just a positioning risk.

---

# 29. What we are doing now

Current state of the project:

### Concept stage complete
We have:
- selected the main concept
- named it HeatSentinel AI
- strengthened it from HeatGuardian
- defined its differentiator
- defined the Response Gap idea
- defined Heat Hunt
- defined adaptive polygon refinement
- defined agentic/data-analysis architecture
- defined a team-facing explanation
- created a detailed technical/product blueprint document

### Current conceptual position
We are aiming for a roughly **9.7+ judging profile** by improving the existing 9.3 idea through real technical capabilities, not by superficial naming or “AI” additions.

Approximate target scoring discussion (not official judging):
- Impact & Relevance: ~10
- Technical Execution: ~9.7–9.8
- Innovation: ~9.5–9.7
- Communication: ~9.5–9.7

This is an aspiration, not a guaranteed score.

---

# 30. What should happen next

The next LLM/agent should continue from here rather than generating new generic ideas.

## Next immediate task 1 — Verify FortyGuard: MOSTLY RESOLVED
Verified via the official quickstart repo (`github.com/FortyGuard-Tech/temperature-api-quickstart`) — see Section 16 for full detail:
- ✅ endpoint names and the async submit/poll pattern
- ✅ exact POST body shape for `/v1/heatmap`
- ✅ how temporal parameters are expressed — historical + current-day only, **no forecast** (this corrects an earlier wrong assumption) [CORRECTED 2026-08-26: FortyGuard DOES support +12h forecasting via end_time. See context/fortyguard-api-reference.md.]
- ✅ output structure for both `tcm` and the analysis (`exceedance`/`persistence`) response shapes
- ✅ supported AOI granularity (60/80/100m) and Basic-tier area cap (10 mi²)
- ✅ coverage is U.S.-only

Still needs a live check once the real hackathon API key is active:
- exact quota/rate limits for the hackathon's specific key/tier
- confirm the Phoenix AOI actually returns clean data (a README confirms the schema, not that a specific location has good tile coverage)

## Next immediate task 2 — Demo city: RESOLVED
**Locked: Phoenix, AZ (primary) + New York City (secondary).**

Reasoning:
- FortyGuard is confirmed U.S.-only, which ruled out Abu Dhabi and Dubai outright.
- Phoenix has the strongest Impact & Relevance story: real heat mortality data, a documented homelessness/heat-death disparity, and an already-mapped 200+ location cooling/hydration network (MAG Heat Relief Network, ASU GIS shapefiles) — see Section 27.
- NYC has a published, downloadable Heat Vulnerability Index we can use as an external validation benchmark for our own Response Gap score — a genuine Technical Execution differentiator, not just a data source.

**Scoping split (important — don't let this quietly become two full builds):**
- Phoenix is the primary build and the one shown in the live demo.
- NYC is used for (a) sourcing/validating methodology against a published index, and (b) a stretch-goal second AOI only if the Phoenix build is solid with time to spare. If the 6-day schedule is tight, NYC stays validation-only. Section 5 (Scope) still says "one demo city" for a reason — don't cut something else from scope without the whole team agreeing to it first.

Still to confirm before Day 1 coding starts:
- FortyGuard actually returns clean tile data for the specific Phoenix AOI chosen, once someone has the real hackathon API key
- Which Phoenix sub-area to scope to, given the Basic tier's 10 mi² per-heatmap cap (Section 16) — likely a district or cluster of high-risk neighborhoods rather than the full metro

## Next immediate task 3 — Lock data sources
For the chosen city, define:
- population source
- elderly population source
- socioeconomic vulnerability source
- tree/green cover source
- cooling-center/resource source
- optional emergency/health dataset if legally and practically available

## Next immediate task 4 — Define scoring formulas
Lock and document:
- heat exposure
- persistence
- anomaly
- vulnerability score
- resource deficit
- response gap / priority formula

Keep the formulas simple, explainable, and reproducible.

## Next immediate task 5 — Build the narrowest end-to-end vertical slice
The first working version should be:

```text
1 city
→ 5–20 polygons
→ FortyGuard query
→ heat metrics
→ one vulnerability dataset
→ response gap
→ agent ranking
→ map result
```

Do not start with a large architecture.

## Next immediate task 6 — Build the demo before overbuilding
The core demo must always remain:

```text
RUN HEAT HUNT
→ scan
→ investigate
→ rank
→ explain
→ recommend
```

---

# 31. Key messages to preserve

The team should consistently use these concepts:

### Product identity
> **HeatSentinel — Autonomous Hyperlocal Heat Response Intelligence**

### Main problem
> Knowing where it is hot is not enough. Cities need to know where heat will hurt people most and where protective resources are insufficient.

### Agentic idea
> The agent does not merely summarize heat data; it decides where deeper investigation is needed and uses tools to perform that investigation.

### FortyGuard differentiator
> FortyGuard is not just a visualization layer. It is a core data/decision engine used repeatedly across multiple polygons and temporal contexts.

### Product differentiator
> **Response Gap** combines heat, vulnerability, and protective-resource deficits to support action prioritization.

### Strongest technical differentiator
> **Adaptive Agentic Spatial Investigation** — coarse scan → identify hotspot → refine polygon → re-query → identify micro-hotspot.

### LLM philosophy
> The LLM orchestrates and explains. The deterministic analysis engine calculates.

### Demo line
> **“HeatSentinel doesn't just tell cities where it's hot. It tells them where heat will hurt people most — and what to do next.”**

---

# 32. Existing blueprint artifact

A detailed technical/product blueprint was previously created:

`/mnt/data/HeatSentinel_AI_Technical_Product_Blueprint.docx`

This handoff file is intended to be read first, then the blueprint can be used for more detailed implementation planning.

---

# 33. Instruction to the next LLM

You are taking over an already-defined hackathon project.

Do **not**:
- restart generic idea generation
- rename the product without a strong reason
- turn it back into a generic dashboard
- claim novelty that cannot be defended
- invent FortyGuard API endpoints
- make the LLM responsible for numerical scoring
- add unnecessary ML or infrastructure

You should:
- preserve HeatSentinel's core identity
- verify all current FortyGuard details before coding
- improve the project through concrete, buildable technical steps
- prioritize the 6-day MVP
- keep the agent loop real and tool-driven
- keep the quantitative logic deterministic
- make FortyGuard central to the product
- focus on the judging weights: Impact + Technical first
- keep the demo visually obvious and operationally meaningful

The next best response from a new agent should usually be a **verified implementation plan for Day 1–2**, beginning with FortyGuard API validation and demo-city selection, unless the user asks for a different task.
