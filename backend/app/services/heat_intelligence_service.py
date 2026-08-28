"""
HeatSentinel AI - Heat Intelligence Service
Handles async generation of FortyGuard Heat Intelligence PDF reports.
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any

from app.db import get_db_connection, init_db
from app.models.heat_intelligence import HeatIntelligenceJob
from app.services.fortyguard_client import FortyGuardClient
from app.logging_config import logger

_running_tasks: Dict[str, asyncio.Task] = {}

def get_heat_intelligence_job(job_id: str) -> Optional[HeatIntelligenceJob]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT job_id, zone_id, activity_id, status, download_link, error, created_at, expires_at
            FROM heat_intelligence_jobs
            WHERE job_id = ?
            """,
            (job_id,)
        )
        row = cursor.fetchone()
        if not row:
            return None

        status = row["status"]
        expires_at = row["expires_at"]
        
        # Auto-detect if it expired
        if status == "completed" and expires_at:
            # Parse expires_at (ISO format)
            try:
                dt_expires = datetime.fromisoformat(expires_at)
                if datetime.now(timezone.utc) >= dt_expires:
                    status = "expired"
            except Exception:
                pass
                
        return HeatIntelligenceJob(
            job_id=row["job_id"],
            zone_id=row["zone_id"],
            activity_id=row["activity_id"],
            status=status,
            download_link=row["download_link"],
            error=row["error"],
            created_at=row["created_at"],
            expires_at=row["expires_at"]
        )

async def _execute_heat_intelligence_background(
    job_id: str,
    zone_id: str,
    latitude: float,
    longitude: float,
    temperature: float,
    date: str,
    client: Optional[FortyGuardClient] = None
):
    logger.info(f"HeatIntelligenceService: Starting background execution for job {job_id} (zone {zone_id}).")
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE heat_intelligence_jobs SET status = 'processing' WHERE job_id = ?",
            (job_id,)
        )
        
    client = client or FortyGuardClient()
    
    try:
        # Submit the async request
        activity_id = await client.submit_heat_intelligence(
            latitude=latitude,
            longitude=longitude,
            temperature=temperature,
            date=date,
            analysis=["geographic", "environmental", "urban", "events", "anthropogenic"]
        )
        
        # Update DB with activity_id
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE heat_intelligence_jobs SET activity_id = ? WHERE job_id = ?",
                (activity_id, job_id)
            )
            
        # Poll for completion with a 150s timeout (since we saw it take ~52s)
        final_status = await client.poll_until_complete(activity_id, timeout_seconds=150, interval_seconds=2.0)
        
        # Extract download_link
        download_link = None
        if final_status.data and final_status.data.result:
            result_obj = final_status.data.result
            if isinstance(result_obj, dict):
                download_link = result_obj.get("download_link")
            else:
                download_link = getattr(result_obj, "download_link", None)
                if not download_link and hasattr(result_obj, "model_extra") and result_obj.model_extra:
                    download_link = result_obj.model_extra.get("download_link")
                if not download_link and hasattr(result_obj, "model_dump"):
                    download_link = result_obj.model_dump(exclude_unset=True).get("download_link")
                    
        if not download_link:
            raise ValueError("No download_link in the completed response")
            
        # S3 links expire in 600s
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=580)).isoformat()
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE heat_intelligence_jobs
                SET status = 'completed',
                    download_link = ?,
                    expires_at = ?
                WHERE job_id = ?
                """,
                (download_link, expires_at, job_id)
            )
        logger.info(f"HeatIntelligenceService: Job {job_id} completed successfully.")
        
    except Exception as exc:
        logger.error(f"HeatIntelligenceService: Job {job_id} failed: {exc}", exc_info=True)
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE heat_intelligence_jobs
                SET status = 'failed',
                    error = ?
                WHERE job_id = ?
                """,
                (str(exc), job_id)
            )
    finally:
        _running_tasks.pop(job_id, None)


def start_heat_intelligence(
    zone_id: str,
    latitude: float,
    longitude: float,
    temperature: float,
    date: str,
    client: Optional[FortyGuardClient] = None
) -> str:
    """
    Creates a new HeatIntelligenceJob and schedules asynchronous background execution.
    Returns the job_id immediately without blocking the request loop.
    """
    init_db()
    job_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    # 1. Insert initial job row into SQLite
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO heat_intelligence_jobs (
                job_id, zone_id, status, created_at
            ) VALUES (?, ?, 'pending', ?)
            """,
            (job_id, zone_id, created_at)
        )

    # 2. Spawn background task
    task = asyncio.create_task(
        _execute_heat_intelligence_background(
            job_id=job_id,
            zone_id=zone_id,
            latitude=latitude,
            longitude=longitude,
            temperature=temperature,
            date=date,
            client=client
        )
    )
    _running_tasks[job_id] = task

    logger.info(f"HeatIntelligenceService: Job {job_id} scheduled.")
    return job_id
