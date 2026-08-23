"""
HeatSentinel AI - Heat Hunt Router (Phase 10 / Step 37)
Exposes the autonomous Heat Hunt job management system via production REST and Server-Sent Events (SSE)
streaming endpoints:
- POST /api/heat-hunt/start (Launch asynchronous autonomous investigation)
- GET /api/heat-hunt/{job_id}/status (Poll job status & progress events)
- GET /api/heat-hunt/{job_id}/results & /result (Retrieve final ranked zones)
- GET /api/heat-hunt/{job_id}/stream (Real-time SSE event streaming)
- GET /api/heat-hunt/history (List recent investigations)
"""

import json
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Query, Body
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

from app.agent.heat_hunt_service import (
    start_heat_hunt as service_start_heat_hunt,
    get_heat_hunt_job,
    list_heat_hunt_jobs,
    subscribe_job_events,
    HeatHuntJob,
    ProgressEvent,
)
from app.logging_config import logger

router = APIRouter(prefix="/api/heat-hunt", tags=["Heat Hunt"])


# ==========================================
# 1. REQUEST & RESPONSE SCHEMAS
# ==========================================

class StartHeatHuntRequest(BaseModel):
    polygon_aoi: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional GeoJSON Polygon geometry override for the study area."
    )
    start_date: Optional[str] = Field(
        default=None,
        description="Observation date in YYYY-MM-DD format (defaults to yesterday)."
    )
    start_time: Optional[str] = Field(
        default="14:00",
        description="Observation time in HH:MM format (24-hour)."
    )
    provider: Optional[str] = Field(
        default="auto",
        description="LLM provider: 'auto', 'gemini', or 'anthropic'."
    )
    model_name: Optional[str] = Field(
        default="gemini-3.5-flash-lite",
        description="Specific model identifier to execute."
    )
    mode: Optional[str] = Field(
        default="live",
        description="Execution mode: 'live', 'cached', or 'demo'."
    )


class JobStartResponse(BaseModel):
    job_id: str
    jobId: str  # Frontend alias
    status: str
    mode: str
    message: str


class JobStatusResponse(BaseModel):
    job_id: str
    jobId: str  # Frontend alias
    status: str
    mode: str
    provider: str
    model_name: str
    progress_events: List[ProgressEvent]
    events_count: int
    created_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None


# ==========================================
# 2. ROUTE HANDLERS
# ==========================================

@router.post("/start", response_model=JobStartResponse)
async def start_heat_hunt(
    request: Optional[StartHeatHuntRequest] = Body(default=None)
):
    """
    Launches an asynchronous autonomous Heat Hunt investigation for Phoenix.
    Spawns background tool-calling loop and immediately returns a trackable job_id (<10ms latency).
    """
    req = request or StartHeatHuntRequest()
    try:
        job_id = await service_start_heat_hunt(
            target_area=req.polygon_aoi,
            date_str=req.start_date,
            time_str=req.start_time,
            provider=req.provider or "auto",
            model_name=req.model_name,
            mode=req.mode or "live",
        )
        return JobStartResponse(
            job_id=job_id,
            jobId=job_id,
            status="pending",
            mode=req.mode or "live",
            message="Autonomous Heat Hunt investigation initiated successfully."
        )
    except Exception as exc:
        logger.error(f"HeatHuntRouter: Failed to start heat hunt: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to start Heat Hunt: {str(exc)}")


@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_status(job_id: str):
    """
    Polls the real-time execution status and incremental progress events for a Heat Hunt job.
    """
    job = get_heat_hunt_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Heat Hunt job '{job_id}' not found.")

    return JobStatusResponse(
        job_id=job.job_id,
        jobId=job.job_id,
        status=job.status,
        mode=job.mode,
        provider=job.provider,
        model_name=job.model_name,
        progress_events=job.progress_events,
        events_count=len(job.progress_events),
        created_at=job.created_at,
        completed_at=job.completed_at,
        error=job.error,
    )


@router.get("/{job_id}/results")
@router.get("/{job_id}/result")
async def get_results(job_id: str):
    """
    Retrieves the final structured investigation results (ranked zones, evidence, dispatches).
    Returns 409 Conflict if the investigation is still in progress.
    """
    job = get_heat_hunt_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Heat Hunt job '{job_id}' not found.")

    if job.status in ("pending", "running"):
        return JSONResponse(
            status_code=409,
            content={
                "job_id": job.job_id,
                "jobId": job.job_id,
                "status": job.status,
                "message": "Heat Hunt investigation is still in progress.",
                "events_count": len(job.progress_events)
            }
        )

    if job.status == "failed":
        return JSONResponse(
            status_code=500,
            content={
                "job_id": job.job_id,
                "jobId": job.job_id,
                "status": "failed",
                "error": job.error,
                "completed_at": job.completed_at
            }
        )

    return {
        "status": "completed",
        "job_id": job.job_id,
        "jobId": job.job_id,
        "mode": job.mode,
        "provider": job.provider,
        "model_name": job.model_name,
        "completed_at": job.completed_at,
        "events_count": len(job.progress_events),
        "result": job.result,
    }


@router.get("/{job_id}/stream")
async def stream_job_events(
    job_id: str,
    timeout_seconds: float = Query(180.0, description="Max streaming duration in seconds")
):
    """
    Streams live agent tool calls and progress updates as Server-Sent Events (SSE).
    """
    job = get_heat_hunt_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Heat Hunt job '{job_id}' not found.")

    async def event_generator():
        async for event in subscribe_job_events(job_id, timeout_seconds=timeout_seconds):
            payload = json.dumps(event.model_dump())
            yield f"data: {payload}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/history", response_model=List[JobStatusResponse])
async def get_history(limit: int = Query(20, ge=1, le=100)):
    """
    Lists recent Heat Hunt investigations for history / audit logging.
    """
    jobs = list_heat_hunt_jobs(limit=limit)
    return [
        JobStatusResponse(
            job_id=j.job_id,
            jobId=j.job_id,
            status=j.status,
            mode=j.mode,
            provider=j.provider,
            model_name=j.model_name,
            progress_events=j.progress_events,
            events_count=len(j.progress_events),
            created_at=j.created_at,
            completed_at=j.completed_at,
            error=j.error,
        )
        for j in jobs
    ]
