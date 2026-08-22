from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(prefix="/api/heat-hunt", tags=["Heat Hunt"])

class StartHeatHuntRequest(BaseModel):
    # Depending on what frontend sends, e.g., a polygon or mode
    mode: str = "demo"

@router.post("/start")
async def start_heat_hunt(request: StartHeatHuntRequest):
    # Stub that immediately returns a jobId
    job_id = str(uuid.uuid4())
    return {"jobId": job_id}

@router.get("/{job_id}/status")
async def get_heat_hunt_status(job_id: str):
    # Stub status
    return {
        "status": "processing",
        "progress": 50,
        "current_step": "Acquiring heat data"
    }

@router.get("/{job_id}/results")
async def get_heat_hunt_results(job_id: str):
    # Stub results
    return {
        "status": "completed",
        "zones": []
    }
