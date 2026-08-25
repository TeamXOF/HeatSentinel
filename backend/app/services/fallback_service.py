"""
HeatSentinel AI - Fallback & Reliability Service (Phase 13 / Step 43)
Provides a robust three-tier fallback architecture:
  Tier 1: Live autonomous pipeline (external FortyGuard, Census ACS, MAG)
  Tier 2: Valid recent cached run from SQLite (<24 hours old)
  Tier 3: Deterministic curated Phoenix demo scenario (demo_scenario_phoenix.json)

Ensures zero-crash demos, graceful degradation on network/API timeouts,
and honest mode labeling across the entire system.
"""

import os
import json
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Callable
from pathlib import Path

from app.db import get_db_connection
from app.logging_config import logger


# Human-readable display labels for tool fallback events
FALLBACK_TOOL_NAMES: Dict[str, str] = {
    "fallback_notice": "Reliability Shield — Activating Fallback Pipeline",
    "cached_replay":   "Replaying verified cached investigation trace",
    "demo_scenario":   "Streaming deterministic Phoenix heat benchmark",
}


def get_demo_scenario_path() -> Path:
    """Returns absolute path to the canonical Phoenix demo scenario file."""
    app_dir = Path(__file__).parent.parent
    return app_dir / "data" / "demo_scenario_phoenix.json"


def load_demo_scenario() -> Dict[str, Any]:
    """
    Loads and validates the deterministic Phoenix demo scenario dataset.
    Raises FileNotFoundError or ValueError if invalid.
    """
    path = get_demo_scenario_path()
    if not path.exists():
        raise FileNotFoundError(f"Demo scenario file not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if "final_result" not in data or "step_events" not in data:
        raise ValueError("Invalid demo scenario structure: missing 'final_result' or 'step_events'.")

    return data


def get_recent_cached_heat_hunt(max_age_hours: float = 24.0) -> Optional[Dict[str, Any]]:
    """
    Queries SQLite for the most recent completed Heat Hunt run within the given age window.
    Returns None if no qualifying recent run exists.
    """
    cutoff_dt = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    cutoff_iso = cutoff_dt.isoformat()

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # Find the newest completed job that has valid result_json and was created after cutoff
            cursor.execute(
                """
                SELECT job_id, mode, provider, model_name, progress_events_json,
                       result_json, created_at, completed_at
                FROM heat_hunt_jobs
                WHERE status = 'completed'
                  AND result_json IS NOT NULL
                  AND (completed_at >= ? OR created_at >= ?)
                ORDER BY completed_at DESC, created_at DESC
                LIMIT 1
                """,
                (cutoff_iso, cutoff_iso)
            )
            row = cursor.fetchone()
            if not row:
                return None

            result_obj = json.loads(row["result_json"])
            events_raw = json.loads(row["progress_events_json"] or "[]")

            return {
                "job_id": row["job_id"],
                "original_mode": row["mode"],
                "provider": row["provider"],
                "model_name": row["model_name"],
                "created_at": row["created_at"],
                "completed_at": row["completed_at"],
                "step_events": events_raw,
                "final_result": result_obj,
            }
    except Exception as err:
        logger.warning(f"FallbackService: Error checking recent cached heat hunt: {err}")
        return None


async def resolve_heat_hunt_fallback(
    job_id: str,
    on_step_callback: Optional[Callable] = None,
    failure_reason: Optional[str] = None,
    force_mode: Optional[str] = None,
    replay_delay_ms: int = 150,
) -> Dict[str, Any]:
    """
    Resolves a Heat Hunt execution via the three-tier fallback hierarchy:
    1. Forced Mode (demo/cached) if requested.
    2. Tier 2 (Cached): Recent valid SQLite run (<24h).
    3. Tier 3 (Demo): Deterministic calibrated Phoenix scenario.

    Smoothly streams progress events over on_step_callback if provided.
    Returns the final structured result dictionary with updated 'mode' field.
    """
    logger.info(
        f"FallbackService: Resolving fallback for job {job_id} "
        f"(force_mode={force_mode}, reason={failure_reason})"
    )

    resolved_mode = "demo"
    fallback_payload: Optional[Dict[str, Any]] = None
    source_description = ""

    # 1. Check if force_mode == "cached" or if in auto mode and a fresh cache exists
    if force_mode == "cached" or (force_mode is None):
        cached_run = get_recent_cached_heat_hunt(max_age_hours=24.0)
        if cached_run:
            resolved_mode = "cached"
            fallback_payload = cached_run
            source_description = f"cached live run from {cached_run.get('completed_at', 'recently')}"

    # 2. If no valid cache or force_mode == "demo", use demo scenario
    if fallback_payload is None:
        resolved_mode = "demo"
        demo_data = load_demo_scenario()
        fallback_payload = demo_data
        source_description = "deterministic Phoenix historic heat scenario (2024-08-01 14:00)"

    # 3. Emit upfront fallback notice event
    if on_step_callback:
        reason_text = f" ({failure_reason})" if failure_reason else ""
        notice_msg = (
            f"Reliability Shield: Active mode '{resolved_mode.upper()}'. "
            f"Streaming {source_description}{reason_text}."
        )
        try:
            await on_step_callback({
                "step_number": 1,
                "tool_name": "agent_init",
                "display_name": f"Autonomous Agent ({resolved_mode.upper()} MODE)",
                "status": notice_msg,
                "type": "warning" if failure_reason else "info"
            })
        except Exception as cb_err:
            logger.warning(f"FallbackService: Error in initial callback: {cb_err}")

    # 4. Stream intermediate progress events smoothly
    step_events = fallback_payload.get("step_events", [])
    if on_step_callback and step_events:
        for i, raw_evt in enumerate(step_events):
            if replay_delay_ms > 0:
                await asyncio.sleep(replay_delay_ms / 1000.0)

            # Ensure proper schema
            step_num = raw_evt.get("step_number", i + 2)
            t_name = raw_evt.get("tool_name", "agent_step")
            d_name = raw_evt.get("display_name")
            msg = raw_evt.get("message") or raw_evt.get("status", "")
            evt_type = raw_evt.get("type", "info")

            try:
                await on_step_callback({
                    "step_number": step_num,
                    "tool_name": t_name,
                    "display_name": d_name,
                    "status": msg,
                    "type": evt_type,
                })
            except Exception as cb_err:
                logger.warning(f"FallbackService: Error streaming event {step_num}: {cb_err}")

    # 5. Extract and format final result
    final_res = fallback_payload.get("final_result", {})
    # Ensure mode is stamped accurately
    final_res["mode"] = resolved_mode
    if "ranked_zones" in final_res:
        for z in final_res["ranked_zones"]:
            if "empirical_evidence" in z and "thermal_metrics" in z["empirical_evidence"]:
                z["empirical_evidence"]["thermal_metrics"]["mode"] = resolved_mode

    logger.info(f"FallbackService: Fallback resolved successfully as mode='{resolved_mode}' for job {job_id}.")
    return final_res
