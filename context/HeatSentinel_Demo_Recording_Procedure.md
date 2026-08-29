# HeatSentinel AI — Demo Video Recording Guide

**Final video: 3–5 minutes (minimum 3 min)**

This is an **edited video, not one continuous take**. You film separate clips and stitch them together later. The PDF step takes ~7 minutes in the background — that wait is never shown on screen.

---

## Before You Start — Setup Checklist

- [ ] Backend running: `uvicorn app.main:app --host 127.0.0.1 --port 8000`
- [ ] Frontend running: `npm run dev` → opens at `http://localhost:3000`
- [ ] Both load correctly in the browser — click through a few pages
- [ ] Screen resolution set to **1440×900** (this is the tested viewport)
- [ ] Stable internet — the PDF and Heat Hunt need live FortyGuard calls
- [ ] Do one **dry run** — trigger the PDF job once beforehand to confirm it works and check how long it takes today

---

## The Golden Rule

> **Do NOT start the video on the Overview page with KPI cards.**
> Every other team will do that. It looks like a dashboard.
>
> **Start on the Agent Insights page with the Heat Hunt running live.**
> The SSE stream with tool calls flying by immediately tells judges this is different.

---

## Shot List — Film These Separately

Film each clip on its own. The order you film them doesn't matter — you'll arrange them in editing.

### Clip 1 — The Hook (0:00 → 0:30 in final video)

**What to film:** The Agent Activity Panel mid-stream — the Heat Hunt agent running, tool names populating, zones being ranked in real time.

**What to say (voiceover, add in editing):**
> *"Extreme urban heat kills more Americans each year than hurricanes, tornadoes, and floods combined. Cities rely on airport weather stations miles away — missing the 15-degree surface spikes that turn specific blocks into danger zones. This is HeatSentinel AI. It's not a heat map — it's an autonomous heat-response intelligence system, and right now it's investigating a heat emergency in Phoenix."*

**Why this works:** Judges see an AI working, not a dashboard. You've hooked them in 15 seconds.

---

### Clip 2 — The Heat Map (0:30 → 0:50 in final video)

**What to film:** Switch to Heat Map page → click a district preset (Maryvale or Downtown) to trigger the 3D camera fly-in → click anywhere on the map to drop a custom AOI polygon.

**What to say:**
> *"FortyGuard's 60-meter satellite thermal mesh gives us over 16,000 hyperlocal grid cells across Phoenix. Instead of one city temperature, we see exact micro-heat islands. Emergency operators can click any district or draw custom areas to inspect specific blocks."*

---

### Clip 3 — The Agent In Action (0:50 → 1:30 in final video)

**What to film:** Go to Agent Insights → click **Run Heat Hunt** → let the SSE stream run for 30–45 seconds → capture the most interesting tool calls and the final zone ranking.

**What to say:**
> *"Our autonomous agent partitions the city, runs DBSCAN clustering, queries FortyGuard thermal persistence, joins US Census vulnerability data, checks cooling center coverage — and ranks every neighborhood by Response Gap score. All streaming live, no hallucinations, fully deterministic math."*

**Important moment to capture:** When the agent decides to subdivide a zone and re-query at higher resolution. If you see this in the stream, pause and highlight it:
> *"Notice the agent just decided Zone 17 needs closer investigation — it's subdividing the area and re-querying FortyGuard at finer resolution. This is real agentic behavior: the AI decides what to look at next."*

---

### Clip 4 — WHY Evidence + Validation (1:30 → 2:15 in final video)

**What to film:** Go to Risk Zones → click on Zone 1 (Maryvale) → the WHY drawer slides open → show the 3-component score breakdown → show the data sources.

**What to say:**
> *"Temperature alone doesn't cause deaths — demographic vulnerability and resource gaps do. Our Response Gap formula weighs 40% Thermal Exposure, 35% Census demographics, and 25% Cooling Resource Deficit. Every score is fully explainable — click WHY and see the exact census tracts, senior percentages, and distance to the nearest cooling center."*

**Then add this key line (put it as a text overlay too):**
> *"We validated our formula against New York City's official Heat Vulnerability Index from the NYC Department of Health. Our rankings show a statistically significant Spearman rank correlation — confirming HeatSentinel's scores match real public health assessments across a completely different city."*

**Why this matters:** No other team will have cross-city validation against a government health index. This is your ace.

---

### Clip 5 — Response Planner + PDF (2:15 → 2:45 in final video)

**What to film (Part A — dispatch):** Go to Response Planner → show the automated dispatch tasks (hydration vans, misting stations, senior wellness checks).

**What to say:**
> *"HeatSentinel converts satellite intelligence into immediate dispatch orders — directing hydration units and mobile shade to the exact blocks that need them most."*

**What to film (Part B — PDF trigger):** In the WHY drawer, trigger the Heat Intelligence PDF job → capture the "Generating..." state for a few seconds → **STOP recording** → wait for it to finish (7 min) → **START recording again** → click the download link → show the PDF opening.

**What to say (over the edited cut):**
> *"With one click, HeatSentinel generates a full Heat Intelligence Report — the kind of document a city emergency director hands to the mayor. Geographic analysis, urban heat island assessment, event correlation — all powered by FortyGuard's premium intelligence, directly in the operator's workflow."*

---

### Clip 6 — The Human Story + Closing (2:45 → 3:00 in final video)

**What to film:** Show the map zoomed into Maryvale with Zone 1 highlighted. Add a text overlay in editing.

**Text overlay:**
> *Maria Gonzalez, 74, lives alone in Maryvale.*
> *31% elderly residents. Nearest cooling center: 2.3 miles away.*
> *Pavement outside her apartment will reach 167°F today.*
> *Without HeatSentinel, the city doesn't know Maria exists.*
> *With HeatSentinel, a hydration van reaches her block by 10 AM.*

**What to say:**
> *"HeatSentinel AI doesn't just measure heat — it predicts vulnerability and saves lives. Team XOF. Thank you."*

---

## Filming Order — Do It This Way

This order saves you the most time because the PDF processes in the background:

1. **First:** Trigger the PDF job (Clip 5, Part B trigger). Start the 7-minute clock.
2. **While waiting:** Film Clips 1, 2, 3, and 4 in any order.
3. **Once PDF is ready:** Film Clip 5, Part B (the link opening). Don't wait — the S3 link expires in ~10 minutes.
4. **Anytime:** Film Clip 5 Part A (Response Planner) and Clip 6 (closing).

---

## If Something Goes Wrong

- **PDF job fails or link doesn't work:** Don't panic on camera. Stop recording, retrigger the job, wait, and re-film just that clip once you have a working link.
- **"Today" returns real hotspots:** Great — skip the Historic 7D switch and go straight into those live results. Even better for the demo.
- **Heat Hunt agent takes too long:** Film the start (first 15 seconds of SSE streaming) and the end (final ranked zones). Cut the middle in editing.
- **Internet drops mid-recording:** The system has a 3-tier fallback (Live → Cached → Demo). If it switches, mention it:
  > *"HeatSentinel's reliability shield automatically switched to cached data — the system never crashes, never shows a blank screen."*
  This turns a failure into a feature demo.

---

## Editing Tips

- **Total finished video:** 3:00 to 3:30 is the sweet spot. Tight and punchy beats long and slow.
- **The PDF wait:** Cut it out completely — jump from "generating..." straight to the report opening.
- **Background music:** Add subtle, low instrumental music. Nothing distracting — just enough to make it feel produced, not a raw screen recording.
- **Text overlays:** Use them for key numbers (16,568 cells, 114°F, NYC validation stat, Maria's story). Judges skim videos — overlays let them catch key points even if they're not fully listening.
- **Silence is powerful:** After showing the NYC validation number, hold for 2 seconds of silence. Let it land. Same after Maria's story.
- **If running short:** Extend Clip 3 (Heat Hunt agent) — it has the most interesting footage.
- **If running long:** Trim Clip 2 (Heat Map) to 15 seconds — one fly-in, one click, done.

---

## Key Lines the Judges Must Hear

These are the exact phrases that separate first place from "impressive but forgettable." Make sure at least 3 of these make it into the final video:

1. *"It's not a heat map — it's an autonomous heat-response intelligence system."*
2. *"The agent decides what to investigate next."* (said while showing adaptive polygon refinement)
3. *"Validated against New York City's official Heat Vulnerability Index."*
4. *"Without HeatSentinel, the city doesn't know Maria exists."*
5. *"HeatSentinel doesn't just measure heat — it predicts vulnerability and saves lives."*
