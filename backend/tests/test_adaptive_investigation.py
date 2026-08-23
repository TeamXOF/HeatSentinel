"""
HeatSentinel AI - Adaptive Investigation Verification Suite (Phase 8 / Step 35)
Tests:
- SYSTEM_PROMPT adherence, non-causal language, and 7-phase workflow definitions
- Trace sample fixture generation and schema validation
- End-to-end multi-step adaptive investigation execution
"""

import json
import os
import pytest
from pathlib import Path
from typing import Dict, Any, List

from app.agent.orchestrator import (
    HeatHuntOrchestrator,
    SYSTEM_PROMPT,
    SUPPORTED_GEMINI_MODELS,
    DEFAULT_GEMINI_MODEL,
)
from app.services.priority_engine import DISCLAIMER_TEXT

PROHIBITED_WORDS = ["causes", "caused by", "clinically validated", "forecast"]


def test_system_prompt_structure_and_mandates():
    """Verify system prompt contains all critical safety, anti-hallucination, and workflow rules."""
    # 1. Anti-hallucination & role definitions
    assert "ORCHESTRATOR, NOT A CALCULATOR" in SYSTEM_PROMPT
    assert "never invent, estimate, calculate, or hallucinate" in SYSTEM_PROMPT

    # 2. Non-causal language constraints
    assert "NON-CAUSAL" in SYSTEM_PROMPT
    assert "empirically aligns with" in SYSTEM_PROMPT

    # Check that prohibited words are explicitly barred in prompt text
    for word in PROHIBITED_WORDS:
        assert word in SYSTEM_PROMPT

    # 3. 7-phase workflow coverage
    assert "Phase 1 [Coarse Corridor Scan]" in SYSTEM_PROMPT
    assert "Phase 2 [Candidate Hotspot Selection]" in SYSTEM_PROMPT
    assert "Phase 3 [Spatial Refinement & Localized Thermal Query]" in SYSTEM_PROMPT
    assert "Phase 4 [Multi-Source Contextual Layer Ingestion]" in SYSTEM_PROMPT
    assert "Phase 5 [Response Gap Priority Calculation]" in SYSTEM_PROMPT
    assert "Phase 6 [Tactical Action Dispatch & Evidence Generation]" in SYSTEM_PROMPT
    assert "Phase 7 [Structured Finalization]" in SYSTEM_PROMPT

    # 4. Abstract tool-call trajectory guide
    assert "ABSTRACT TOOL-CALL TRAJECTORY GUIDE" in SYSTEM_PROMPT
    assert "scan_city" in SYSTEM_PROMPT
    assert "refine_hotspot" in SYSTEM_PROMPT
    assert "query_fortyguard_heat" in SYSTEM_PROMPT
    assert "get_vulnerability_data" in SYSTEM_PROMPT
    assert "get_resources" in SYSTEM_PROMPT
    assert "calculate_risk_metrics" in SYSTEM_PROMPT
    assert "calculate_response_gap" in SYSTEM_PROMPT
    assert "recommend_action" in SYSTEM_PROMPT
    assert "explain_priority" in SYSTEM_PROMPT
    assert "finalize_heat_hunt" in SYSTEM_PROMPT


def test_gemini_model_registry_defaults():
    """Verify Gemini model registry and default configuration."""
    assert DEFAULT_GEMINI_MODEL == "gemini-3.5-flash-lite"
    assert "gemini-3.5-flash-lite" in SUPPORTED_GEMINI_MODELS
    assert "gemini-3.5-flash" in SUPPORTED_GEMINI_MODELS
    assert "gemini-3.7-flash" in SUPPORTED_GEMINI_MODELS
    assert "gemini-2.0-flash" in SUPPORTED_GEMINI_MODELS


@pytest.mark.asyncio
async def test_adaptive_investigation_trace_generation_and_schema():
    """
    Executes a full live/deterministic investigation run, records the full trace,
    saves the trace fixture to backend/tests/fixtures/heat_hunt_trace_sample.json,
    and validates trace schema.
    """
    orch = HeatHuntOrchestrator(provider="deterministic", max_steps=20)

    events: List[Dict[str, Any]] = []

    async def step_listener(event: Dict[str, Any]):
        events.append(event)

    result = await orch.run(
        target_area_geojson=None,
        date_str="2026-08-23",
        time_str="14:00",
        on_step=step_listener,
    )

    # Validate output
    assert result["status"] == "completed"
    assert "ranked_zones" in result
    assert len(result["ranked_zones"]) >= 1
    assert "recommended_dispatches" in result
    assert "executive_briefing" in result
    assert "disclaimer" in result

    # Check event sequence
    assert len(events) >= 6
    assert events[0]["tool_name"] == "orchestrator_init"
    
    tool_names = [e["tool_name"] for e in events]
    assert "scan_city" in tool_names
    assert "refine_hotspot" in tool_names
    assert "query_fortyguard_heat" in tool_names
    assert "get_vulnerability_data" in tool_names
    assert "get_resources" in tool_names
    assert "calculate_risk_metrics" in tool_names
    assert "calculate_response_gap" in tool_names
    assert "recommend_action" in tool_names
    assert "explain_priority" in tool_names
    assert "finalize_heat_hunt" in tool_names

    # Construct trace sample
    fixture_data = {
        "metadata": {
            "trial_id": "phoenix_corridor_trial_01",
            "provider": orch.provider,
            "model_name": orch.model_name,
            "total_steps": len(events),
            "generated_at": events[-1]["timestamp"],
            "total_elapsed_ms": events[-1]["elapsed_ms"],
        },
        "step_events": events,
        "final_result": result,
    }

    # Save to fixtures
    fixtures_dir = Path(__file__).parent / "fixtures"
    fixtures_dir.mkdir(parents=True, exist_ok=True)
    fixture_path = fixtures_dir / "heat_hunt_trace_sample.json"

    with open(fixture_path, "w", encoding="utf-8") as f:
        json.dump(fixture_data, f, indent=2, default=str)

    assert fixture_path.exists()
    assert fixture_path.stat().st_size > 500


def test_trace_fixture_reproducibility():
    """Verify saved trace fixture is readable and matches expected UI Activity Panel format."""
    fixture_path = Path(__file__).parent / "fixtures" / "heat_hunt_trace_sample.json"
    if not fixture_path.exists():
        pytest.skip("Trace fixture not yet generated")

    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "metadata" in data
    assert "step_events" in data
    assert "final_result" in data
    assert len(data["step_events"]) >= 5
    assert data["final_result"]["status"] == "completed"
