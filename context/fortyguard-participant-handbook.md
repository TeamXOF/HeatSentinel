# FortyGuard Hackathon '26 — Participant Handbook

> **Source:** `FortyGuard_Hackathon_Participant_Handbook.pdf` (1.6 MB)  
> **Converted to Markdown:** 2026-08-22 for permanent reference.  
> **Purpose:** Key rules, judging criteria, timeline, API access details, and constraints extracted for HeatSentinel development.

---

## 1. Hackathon Overview

**Name:** FortyGuard Hackathon '26  
**Theme:** Design cooler, smarter cities using hyperlocal temperature intelligence.  
**Format:** Online / Remote  
**Duration:** 6 days (precise dates provided to registered participants via email)

### Mission Statement
> Build innovative solutions leveraging FortyGuard's hyperlocal heat intelligence to solve real urban challenges — from infrastructure planning to human health outcomes.

---

## 2. Tracks

Participants must declare their primary track at registration. Multiple tracks are allowed.

| # | Track Name | Description |
|---|-----------|-------------|
| 1 | **Agentic AI** | Build autonomous or semi-autonomous AI agents that make decisions using FortyGuard data |
| 2 | **Data Analysis & Correlation** | Extract insights by combining FortyGuard heat data with other datasets (census, environmental, etc.) |
| 3 | **Urban Planning** | Tools for city planners to use hyperlocal temperature data for infrastructure and policy decisions |
| 4 | **Climate Resilience** | Longer-horizon solutions addressing heat adaptation, vulnerability reduction, and preparedness |

> **HeatSentinel selected:** Track 1 (Agentic AI) + Track 2 (Data Analysis & Correlation)

---

## 3. Judging Criteria

| Criterion | Weight | What Judges Look For |
|-----------|--------|---------------------|
| **Impact & Relevance** | **40%** | Does it solve a real urban heat problem? Is the target population clearly defined? Is there measurable or explainable real-world value? |
| **Technical Execution** | **35%** | Is the implementation solid? Does the code actually work? Are FortyGuard APIs used meaningfully? |
| **Innovation** | **15%** | Novel approach, not just a dashboard on top of existing tools |
| **Communication** | **10%** | Is the solution clearly explained? Is the demo compelling and understandable in 3–5 minutes? |

**Impact + Technical = 75% of total score.** The project must work AND solve a real problem.

### Screening Process
1. FortyGuard team reviews all submissions
2. Top 10 are shortlisted
3. Shortlisted teams present to judges (3–5 minute demo + Q&A)
4. Judges score based on rubric above

---

## 4. API Access (Hackathon Credits)

> **This section is critical for HeatSentinel architecture.**

### Plan & Credits
- **All hackathon participants receive Premium plan access** for the duration of the hackathon
- Credit allocation is generous — designed to let teams build and demo without worrying about costs
- Credits are **only deducted on successful completions** — failed tasks cost nothing
- Check balance: `POST /v1/system/fetch-api-key-usage`

### API Key Distribution
- API keys are provided per-team at registration
- Key is sent to the team lead's registered email
- **One key per team** — all team members share the same key
- Store it in `.env` — never commit to GitHub

### Premium Plan Entitlements (Hackathon Edition)
| Feature | Availability |
|---------|-------------|
| `/v1/heatmap` | ✅ Full access, all analytic types |
| `/v1/env_params` | ✅ Full access, all parameters (no 3-param Basic limit) |
| `/v1/satellite` | ✅ Available (Premium) |
| `/v1/streetview` | ✅ Available (Premium) |
| `/v1/heat_intelligence` | ✅ Available (Premium) |
| Area cap | 10 mi² per request (applies to all plans) |
| Date range | 2021-01-01 to present + **up to +12h forecast** |
| Geographic coverage | US only |

---

## 5. Technical Constraints & Rules

### What's Required
- Project must use FortyGuard's API as a **central, non-optional data source**
- The API must be called meaningfully — not just a token call to qualify
- Source code must be submitted along with the demo

### What's Not Allowed
- Simulating or faking FortyGuard API responses in the final submission (mock mode OK for development, must show live demo)
- Using non-public proprietary datasets (open data only for supplemental layers)
- Hardware / IoT / physical sensors
- Paid commercial data that isn't the FortyGuard API itself

### Geographic Coverage
- **US only** — FortyGuard's data infrastructure covers the United States
- All endpoints (heatmap, env_params, satellite, street view, heat intelligence) are US-only
- Non-US polygons will either return empty results or API errors

### Area Limit
- **10 mi² per request** applies regardless of plan
- This is a data processing constraint, not a pricing tier limit
- Large city coverage requires tiling strategy (HeatSentinel uses ≤10 mi² AOI tiling)

---

## 6. Submission Requirements

### What to Submit
1. **GitHub repository link** (public or with judges added as collaborators)
2. **2-minute video pitch** (problem, solution, demo highlight)
3. **3–5 minute live demo** (for top-10 shortlisted teams)
4. **One-page project description** (optional but recommended)

### Demo Requirements
- Demo must use **live FortyGuard API** (not entirely pre-recorded or mocked)
- Show at least one meaningful FortyGuard API call in the demo
- Demo must be completeable in 3–5 minutes

---

## 7. Important Notes for HeatSentinel

### 7.1 FortyGuard API is the Star
Judges are the FortyGuard team. They know the API extremely well. Surface how you're using it:
- Show the map with real FortyGuard heatmap tiles
- Surface the `analytic_type` being used in the UI
- Show the agent activity log making real API calls
- Label data sources in the WHY panel with "Source: FortyGuard heatmap"

### 7.2 Forecast Is Supported ✅
The handbook confirms `/v1/heatmap` supports forward-looking analysis:
- `end_time` can be up to **12 hours beyond current time**
- This enables "what will it be like in 6 hours?" queries
- Use for the Response Planner page (pre-emptive resource positioning)
- **Correction to Context Handoff:** §11, §18, §19, §28 stated "no forecast" — this is incorrect. Forecasts are supported.

### 7.3 Agentic AI Track — What Judges Want to See
For the Agentic AI track, judges want to see:
- The agent making **real, observable decisions** (not just calling an LLM to describe data)
- **Tool use that changes what happens next** — e.g., the agent deciding to subdivide a polygon and re-querying FortyGuard at higher resolution
- **Real FortyGuard calls triggered by agent logic**, not pre-scripted
- Transparent agent activity log showing decision steps

This is exactly what HeatSentinel's "Heat Hunt" and "Adaptive Polygon Refinement" features provide.

### 7.4 Data Analysis & Correlation Track — What Judges Want to See
- Actual statistical correlation (Pearson/Spearman) between FortyGuard heat data and another dataset
- Named data sources (Census ACS, MAG Heat Relief Network, etc.)
- Visual representation of correlation findings
- Clear statement of what was found and what it means

### 7.5 Scoring Strategy
| Area | Our Advantage |
|------|--------------|
| Impact (40%) | Phoenix heat vulnerability is real and documented — use real census stats in pitch |
| Technical (35%) | Response Gap formula + adaptive polygon refinement = genuinely complex, not a dashboard |
| Innovation (15%) | Agentic investigation with adaptive spatial refinement is novel |
| Communication (10%) | The agent activity log + WHY panel + numbered zone ranking = demo-ready |

---

## 8. Support & Contact

- Hackathon Discord: provided at registration
- Technical support for API issues: support@fortyguard.com
- FortyGuard quickstart Jupyter notebooks: available in the official hackathon repo
