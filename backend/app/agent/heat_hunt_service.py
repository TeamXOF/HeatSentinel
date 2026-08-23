"""
HeatSentinel AI - Heat Hunt Job Model & Async Execution (Phase 9 / Step 36)
Wraps the autonomous HeatHuntOrchestrator in an asynchronous, pollable, and streamable
background job service backed by durable SQLite storage and in-memory asyncio event queues.
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, AsyncGenerator
from pydantic import BaseModel, Field

from app.db import get_db_connection, init_db
from app.agent.orchestrator import HeatHuntOrchestrator
from app.logging_config import logger


# ==========================================
# 1. PYDANTIC DATA MODELS
# ==========================================

# Human-readable display labels for each agent tool — judges see these in the Activity Panel.
TOOL_DISPLAY_NAMES: dict[str, str] = {
    "agent_init":             "Autonomous agent initialized — starting Phoenix Heat Hunt",
    "scan_city":              "Dividing Phoenix target area / Scanning thermal conditions",
    "identify_hotspots":      "Identifying heat hotspots from thermal scan",
    "refine_hotspot":         "Refining priority AOI boundary",
    "get_vulnerability_data": "Joining Census ACS vulnerability data",
    "get_resources":          "Checking cooling centers & protective resources",
    "calculate_response_gap": "Calculating Response Gap score",
    "recommend_action":       "Generating response recommendation",
    "explain_priority":       "Composing empirical evidence trail",
    "finalize_heat_hunt":     "Finalizing Heat Hunt — compiling ranked zones",
    "agent_completed":        "Investigation complete",
}


class ProgressEvent(BaseModel):
    id: str = Field(default_factory=lambda: f"evt-{uuid.uuid4().hex[:8]}")
    step_number: int
    tool_name: str
    message: str
    display_name: Optional[str] = None  # Human-readable label; backend populates via TOOL_DISPLAY_NAMES
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%H:%M:%S"))
    type: str = "info"  # "info" | "warning" | "success" | "error"


class HeatHuntJob(BaseModel):
    job_id: str
    status: str = "pending"  # "pending" | "running" | "completed" | "failed"
    mode: str = "live"       # "live" | "demo" | "cached"
    provider: str = "auto"
    model_name: str = "gemini-3.5-flash-lite"
    progress_events: List[ProgressEvent] = Field(default_factory=list)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None


# ==========================================
# 2. IN-MEMORY PUB/SUB EVENT BROKER
# ==========================================

# Active listener queues keyed by job_id for sub-millisecond SSE push
_active_listeners: Dict[str, List[asyncio.Queue]] = {}
_running_tasks: Dict[str, asyncio.Task] = {}


def _register_listener(job_id: str) -> asyncio.Queue:
    """Registers an event queue listener for a specific job."""
    q: asyncio.Queue = asyncio.Queue()
    if job_id not in _active_listeners:
        _active_listeners[job_id] = []
    _active_listeners[job_id].append(q)
    return q


def _unregister_listener(job_id: str, q: asyncio.Queue):
    """Unregisters an event queue listener."""
    if job_id in _active_listeners:
        if q in _active_listeners[job_id]:
            _active_listeners[job_id].remove(q)
        if not _active_listeners[job_id]:
            del _active_listeners[job_id]


async def _broadcast_event(job_id: str, event: ProgressEvent):
    """Broadcasts a progress event to all active listener queues for a job."""
    if job_id in _active_listeners:
        for q in list(_active_listeners[job_id]):
            await q.put(event)


# ==========================================
# 3. CORE BACKGROUND EXECUTION WORKER
# ==========================================

async def _execute_heat_hunt_background(
    job_id: str,
    target_area: Optional[Dict[str, Any]],
    date_str: Optional[str],
    time_str: Optional[str],
    provider: str,
    model_name: str,
    mode: str,
    orchestrator: Optional[HeatHuntOrchestrator] = None,
):
    """
    Executes the orchestrator tool-calling loop in the background,
    persisting incremental progress events to SQLite and broadcasting to listeners.
    """
    logger.info(f"HeatHuntService: Starting background execution for job {job_id} ({provider}/{model_name}).")
    
    # 1. Update status to 'running'
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE heat_hunt_jobs SET status = 'running' WHERE job_id = ?",
            (job_id,)
        )

    # In-memory accumulator for this job's events
    events: List[ProgressEvent] = []

    async def on_step_callback(step_num: int, tool_name: str, message: str):
        evt_type = "success" if tool_name in ("finalize_heat_hunt", "agent_completed") else "info"
        event = ProgressEvent(
            step_number=step_num,
            tool_name=tool_name,
            message=message,
            display_name=TOOL_DISPLAY_NAMES.get(tool_name),
            type=evt_type
        )
        events.append(event)

        # Incrementally persist to SQLite
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE heat_hunt_jobs SET progress_events_json = ? WHERE job_id = ?",
                    (json.dumps([e.model_dump() for e in events], default=str), job_id)
                )
        except Exception as db_err:
            logger.error(f"HeatHuntService: Failed to persist progress event for job {job_id}: {db_err}")

        # Broadcast to real-time listeners (SSE / websocket)
        await _broadcast_event(job_id, event)

    try:
        # Emit initial start event
        await on_step_callback(0, "agent_init", "Autonomous Heat Hunt agent initialized — commencing investigation.")

        # Instantiate orchestrator if not injected
        agent_orchestrator = orchestrator or HeatHuntOrchestrator(
            provider=provider,
            model_name=model_name,
        )

        # Run multi-turn tool calling loop
        final_result = await agent_orchestrator.run(
            target_area_geojson=target_area,
            date_str=date_str,
            time_str=time_str,
            on_step=on_step_callback,
        )

        completed_at = datetime.now(timezone.utc).isoformat()

        # Update SQLite with success and full result
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE heat_hunt_jobs
                SET status = 'completed',
                    result_json = ?,
                    completed_at = ?,
                    progress_events_json = ?
                WHERE job_id = ?
                """,
                (
                    json.dumps(final_result, default=str),
                    completed_at,
                    json.dumps([e.model_dump() for e in events], default=str),
                    job_id
                )
            )

        logger.info(f"HeatHuntService: Job {job_id} completed successfully with {len(events)} events.")

    except Exception as exc:
        logger.error(f"HeatHuntService: Job {job_id} failed with error: {exc}", exc_info=True)
        completed_at = datetime.now(timezone.utc).isoformat()
        err_msg = str(exc)

        # Emit failure event
        fail_event = ProgressEvent(
            step_number=len(events) + 1,
            tool_name="execution_error",
            message=f"Investigation halted due to execution error: {err_msg}",
            type="error"
        )
        events.append(fail_event)
        await _broadcast_event(job_id, fail_event)

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE heat_hunt_jobs
                SET status = 'failed',
                    error = ?,
                    completed_at = ?,
                    progress_events_json = ?
                WHERE job_id = ?
                """,
                (
                    err_msg,
                    completed_at,
                    json.dumps([e.model_dump() for e in events], default=str),
                    job_id
                )
            )
    finally:
        _running_tasks.pop(job_id, None)


# ==========================================
# 4. PUBLIC SERVICE INTERFACE
# ==========================================

async def start_heat_hunt(
    target_area: Optional[Dict[str, Any]] = None,
    date_str: Optional[str] = None,
    time_str: Optional[str] = None,
    provider: str = "auto",
    model_name: Optional[str] = None,
    mode: str = "live",
    orchestrator: Optional[HeatHuntOrchestrator] = None,
) -> str:
    """
    Creates a new HeatHuntJob and schedules asynchronous background execution.
    Returns the job_id immediately without blocking the request loop.
    """
    init_db()
    job_id = str(uuid.uuid4())
    resolved_model = model_name or "gemini-3.5-flash-lite"
    created_at = datetime.now(timezone.utc).isoformat()

    # 1. Insert initial job row into SQLite
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO heat_hunt_jobs (
                job_id, status, mode, provider, model_name,
                progress_events_json, result_json, error, created_at
            ) VALUES (?, 'pending', ?, ?, ?, '[]', NULL, NULL, ?)
            """,
            (job_id, mode, provider, resolved_model, created_at)
        )

    # 2. Spawn background task
    task = asyncio.create_task(
        _execute_heat_hunt_background(
            job_id=job_id,
            target_area=target_area,
            date_str=date_str,
            time_str=time_str,
            provider=provider,
            model_name=resolved_model,
            mode=mode,
            orchestrator=orchestrator,
        )
    )
    _running_tasks[job_id] = task

    logger.info(f"HeatHuntService: Job {job_id} scheduled.")
    return job_id


def get_heat_hunt_job(job_id: str) -> Optional[HeatHuntJob]:
    """
    Retrieves the current state of a HeatHuntJob from SQLite.
    Returns None if the job does not exist.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT job_id, status, mode, provider, model_name,
                   progress_events_json, result_json, error, created_at, completed_at
            FROM heat_hunt_jobs
            WHERE job_id = ?
            """,
            (job_id,)
        )
        row = cursor.fetchone()
        if not row:
            return None

        events_raw = json.loads(row["progress_events_json"] or "[]")
        progress_events = [ProgressEvent(**e) for e in events_raw]
        result = json.loads(row["result_json"]) if row["result_json"] else None

        return HeatHuntJob(
            job_id=row["job_id"],
            status=row["status"],
            mode=row["mode"],
            provider=row["provider"],
            model_name=row["model_name"],
            progress_events=progress_events,
            result=result,
            error=row["error"],
            created_at=row["created_at"],
            completed_at=row["completed_at"],
        )


def list_heat_hunt_jobs(limit: int = 20) -> List[HeatHuntJob]:
    """
    Lists recent HeatHuntJobs ordered by creation time descending.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT job_id, status, mode, provider, model_name,
                   progress_events_json, result_json, error, created_at, completed_at
            FROM heat_hunt_jobs
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,)
        )
        rows = cursor.fetchall()
        jobs: List[HeatHuntJob] = []
        for row in rows:
            events_raw = json.loads(row["progress_events_json"] or "[]")
            progress_events = [ProgressEvent(**e) for e in events_raw]
            result = json.loads(row["result_json"]) if row["result_json"] else None
            jobs.append(
                HeatHuntJob(
                    job_id=row["job_id"],
                    status=row["status"],
                    mode=row["mode"],
                    provider=row["provider"],
                    model_name=row["model_name"],
                    progress_events=progress_events,
                    result=result,
                    error=row["error"],
                    created_at=row["created_at"],
                    completed_at=row["completed_at"],
                )
            )
        return jobs


async def subscribe_job_events(
    job_id: str,
    timeout_seconds: float = 120.0
) -> AsyncGenerator[ProgressEvent, None]:
    """
    Async generator yielding real-time ProgressEvents for a job.
    Yields all previously persisted events first, then streams live events until completion/failure.
    """
    # 1. Yield any existing persisted events first
    current_job = get_heat_hunt_job(job_id)
    if not current_job:
        return

    for evt in current_job.progress_events:
        yield evt

    if current_job.status in ("completed", "failed"):
        return

    # 2. Subscribe to live in-memory queue
    q = _register_listener(job_id)
    seen_ids = {e.id for e in current_job.progress_events}

    try:
        start_time = asyncio.get_event_loop().time()
        while True:
            # Check elapsed timeout
            elapsed = asyncio.get_event_loop().time() - start_time
            if elapsed > timeout_seconds:
                break

            try:
                event = await asyncio.wait_for(q.get(), timeout=2.0)
                if event.id not in seen_ids:
                    seen_ids.add(event.id)
                    yield event

                # Check if job concluded
                job_check = get_heat_hunt_job(job_id)
                if job_check and job_check.status in ("completed", "failed"):
                    # Drain any remaining in queue
                    while not q.empty():
                        extra_evt = q.get_nowait()
                        if extra_evt.id not in seen_ids:
                            seen_ids.add(extra_evt.id)
                            yield extra_evt
                    break

            except asyncio.TimeoutError:
                # Periodic check on database status in case worker finished without queue notification
                job_check = get_heat_hunt_job(job_id)
                if job_check and job_check.status in ("completed", "failed"):
                    break
                continue

    finally:
        _unregister_listener(job_id, q)
