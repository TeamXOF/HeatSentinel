# Run Heat Hunt Real Wiring (Step 38)

## Goal
Replace the temporary synchronous "RUN ANALYSIS" button and mock timer simulation with the live, asynchronous, agent-driven "RUN HEAT HUNT" start, SSE streaming, and result synchronization flow.

## Tasks
- [ ] Task 1: Refactor `frontend/src/api/heatHunt.tsx` to invoke `POST /api/heat-hunt/start` and stream events via `EventSource` on `/api/heat-hunt/{jobId}/stream` → Verify: Click Run Heat Hunt and inspect network tab for SSE connection.
- [ ] Task 2: Implement automatic `/api/heat-hunt/{jobId}/results` retrieval upon agent completion and sync result to React Query cache → Verify: On job complete, global zones and KPIs update automatically.
- [ ] Task 3: Update `frontend/src/components/Header.tsx` to make "RUN HEAT HUNT" the primary prominent button with active loading spinner and step counter → Verify: UI indicates active autonomous investigation.
- [ ] Task 4: Implement failure and retry handling in `HeatHuntProvider` and Header → Verify: Simulated error renders non-technical alert with functional 1-click retry.
- [ ] Task 5: End-to-end verification via Playwright MCP Browser → Verify: Full live Heat Hunt run executed, streamed, and validated on `localhost:3000`.

## Done When
- [ ] Clicking "RUN HEAT HUNT" in the frontend initiates real background execution on the FastAPI backend.
- [ ] Real agent tool execution events stream live into the app via SSE.
- [ ] Final ranked zones and WHY evidence dynamically update the Command Center map and tables.
- [ ] Playwright E2E verification completes successfully.
