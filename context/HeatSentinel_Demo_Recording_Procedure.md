# HeatSentinel AI — Demo Video Recording Procedure

**Target: 3–5 minutes, minimum 3 minutes (final edited video)**

This will be an **edited video, not one continuous take**. The Heat
Intelligence PDF alone takes ~7 minutes to generate — longer than the
entire finished video — so segments are filmed separately and cut
together. The 7-minute wait never appears on screen.

---

## Before You Start (Setup Checklist)

- [ ] Backend running: `uvicorn app.main:app --host 127.0.0.1 --port 8000`
- [ ] Frontend running: `npm run dev` (usually `http://localhost:3000`)
- [ ] Confirm both load correctly in the browser before filming
- [ ] Screen recording resolution set to **1440×900** — the tested/QA'd
      viewport
- [ ] Stable internet connection — the PDF step is a real live call to
      FortyGuard and can't be faked or sped up
- [ ] Do a **quick dry run** of triggering the PDF job once beforehand,
      so you know today's actual generation time and confirm nothing's
      broken

---

## Shot List & Time Budget

Film each of these as a **separate short clip**. Order of filming does
not need to match the final video order — film in whatever order is
convenient, then assemble in editing.

| # | Segment | Target final length | What to capture |
|---|---|---|---|
| 1 | Live check | 15–20s | "Today" scenario, live scan, 0 hotspots on screen |
| 2 | Switch to Historic 7D | 20–30s | Click "Load Demo / Historic 7D," live scan returns real hotspots |
| 3 | Heat Hunt agent | 45–60s | Trigger the agent, capture the most interesting streaming moments — don't film the full run |
| 4 | Response Planner + Resources | 30–40s | Quick pass through dispatch recs and cooling center coverage |
| 5 | Heat Intelligence PDF | 30–40s | Trigger the job (a few seconds), then — after the real wait — the link opening and report on screen |
| 6 | Intro / closing (optional) | 15–20s | Brief framing or wrap-up |

**Total edited runtime: ~3–3.5 minutes.** Trim segments tighter to stay
near the 3-minute floor, or let 3–4 run a little longer to reach 4–5.

---

## How to Film Segment 5 (the PDF) Specifically

1. Trigger the Heat Intelligence job on camera — a few seconds of
   "Generating the full intelligence report..." is enough footage.
2. **Stop recording.** Don't film the 7-minute wait.
3. While it processes in the background, film Segments 1–4 (any order).
4. Once the job finishes (check back around the 7-minute mark), **start
   recording again** and immediately show the link opening — you have
   roughly 2–3 minutes before the S3 link expires, so don't delay this
   step once the job is ready.
5. In the edit: cut directly from "job triggered" to "PDF opens." A
   clean jump cut, not a countdown or loading screen held for 7 minutes.

---

## Filming Order (Suggested)

1. Trigger the PDF job first (Segment 5, part 1) so the 7-minute clock
   starts running in the background.
2. While it processes, film Segments 1–4.
3. Once the job is ready, film Segment 5, part 2 (the link opening).
4. Film Segment 6 (intro/closing) whenever convenient — it doesn't
   depend on the PDF timing.

---

## If Something Goes Wrong

- **PDF job errors or the link doesn't work:** don't retry live on
  camera. Cut, retrigger the job fresh, and re-film just that clip once
  you have a working link.
- **"Today" unexpectedly returns real hotspots:** fine — skip the "Load
  Demo" narration in Segment 2 and go straight into those live results.

---

## Editing Notes

- Keep each clip trimmed to only its listed target length — the raw
  footage will run longer than the final video, especially around the
  PDF wait; that gap is cut out entirely in the edit.
- Total finished video should land between 3 and 5 minutes. If it's
  running short, extend Segment 3 (Heat Hunt) with more agent activity,
  since that segment has the most naturally interesting footage to draw
  from.
