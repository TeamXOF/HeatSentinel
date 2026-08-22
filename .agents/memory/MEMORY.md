# Memory Index

## Project
- [project] Always create a new dedicated branch for major code changes → project-conventions.md
- [project] AG Kit only supports Gemini CLI and Google Antigravity (not other AI coding tools) → project-conventions.md
- [project] Component metadata uses SemVer while toolkit releases use CalVer → tech-decisions.md

## HeatSentinel AI (FortyGuard Hackathon '26)
- [status] Full project state, phase tracking, resume instructions → heatsentinel-project.md
- [status] Frontend UI complete (10 pages, 13 components, mock data layer) — backend not started → heatsentinel-project.md
- [status] Active branch: feature/backend-phase1-foundation (local only, not pushed) → heatsentinel-project.md
- [status] Next step: Build /backend/ FastAPI skeleton (Steps 2–5) → heatsentinel-project.md
- [api] FortyGuard API is PREMIUM plan for hackathon — all endpoints available including satellite, streetview, heat_intelligence → heatsentinel-project.md
- [api] FortyGuard auth is header 'api-key: KEY' (NOT Bearer token) → context/fortyguard-api-reference.md
- [api] FortyGuard polygon coordinates are [longitude, latitude] — validate before every call → context/fortyguard-api-reference.md
- [api] FortyGuard DOES support forecast up to +12h — Context Handoff §11/18/19/28 was wrong about 'no forecast' → context/fortyguard-api-reference.md
- [api] FortyGuard persistence metric is native analytic_type=persistence — no custom formula needed → context/fortyguard-api-reference.md
- [api] FortyGuard area cap is 10 mi² per request for ALL plans — spatial engine must tile Phoenix → context/fortyguard-api-reference.md
- [api] Full API reference (scraped, permanent) → context/fortyguard-api-reference.md (do not re-scrape)
- [api] Hackathon handbook (PDF converted) → context/fortyguard-participant-handbook.md
- [arch] LLM = orchestrator only, never calculator. All math in deterministic Python → context/HeatSentinel_AI_System_Design.md
- [arch] SQLite (file-based, zero-ops) for persistence. No Postgres for 6-day MVP → heatsentinel-project.md
- [arch] Modular monolith (not microservices) for 6-day constraint → heatsentinel-project.md
- [arch] In-process dict job store initially — Redis only if needed Day 5-6 → heatsentinel-project.md
- [question] LLM for agent layer: .env.example has GEMINI_API_KEY but roadmap says Anthropic — team must decide → heatsentinel-project.md
- [docs] Master tracker (67 build steps): context/heatsentinel_antigravity_roadmap.md → heatsentinel-project.md
- [docs] gitignore protects .agents/skills, workflows, rules — only memory/ is tracked → project-conventions.md
