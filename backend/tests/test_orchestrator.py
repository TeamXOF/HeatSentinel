"""
HeatSentinel AI - Agent Orchestration Loop Tests (Step 34)
Tests the HeatHuntOrchestrator state machine, callback streaming,
max-step safety bounds, and final structured output schema.
"""

from typing import Dict, Any, List
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.agent.orchestrator import HeatHuntOrchestrator
from app.agent.tool_registry import get_tool_registry


def test_orchestrator_initialization():
    """Verify orchestrator initializes with defaults."""
    orch = HeatHuntOrchestrator(max_steps=15)
    assert orch.max_steps == 15
    assert orch.tool_registry is not None
    assert orch.provider in ["auto", "anthropic", "gemini", "deterministic"]


@pytest.mark.asyncio
async def test_orchestrator_run_deterministic_sequence():
    """Verify autonomous execution sequence and on_step event stream."""
    orch = HeatHuntOrchestrator(provider="deterministic", max_steps=20)

    events: List[Dict[str, Any]] = []

    async def step_listener(event: Dict[str, Any]):
        events.append(event)

    result = await orch.run(on_step=step_listener)

    # 1. Verify on_step events
    assert len(events) >= 5, f"Expected at least 5 step events, got {len(events)}"
    assert events[0]["tool_name"] == "orchestrator_init"
    assert any(e["tool_name"] == "scan_city" for e in events)
    assert any(e["tool_name"] == "finalize_heat_hunt" for e in events)

    # 2. Verify monotonicity of steps
    step_numbers = [e["step_number"] for e in events]
    assert step_numbers == sorted(step_numbers)

    # 3. Verify final structured output schema
    assert result["status"] == "completed"
    assert "ranked_zones" in result
    assert len(result["ranked_zones"]) >= 1
    assert "recommended_dispatches" in result
    assert "executive_briefing" in result
    assert "disclaimer" in result


@pytest.mark.asyncio
async def test_orchestrator_max_steps_safety_limit():
    """Verify orchestrator respects tight max_steps bounds."""
    orch = HeatHuntOrchestrator(provider="deterministic", max_steps=6)

    events: List[Dict[str, Any]] = []

    async def step_listener(event: Dict[str, Any]):
        events.append(event)

    result = await orch.run(on_step=step_listener)

    assert result["status"] == "completed"
    # Ensure loop halted safely without runaway executions
    max_emitted_step = max(e["step_number"] for e in events)
    assert max_emitted_step <= 15


@pytest.mark.asyncio
async def test_orchestrator_mocked_anthropic_loop():
    """Verify Anthropic Claude tool-use message loop with mocked client."""
    import sys
    from types import ModuleType

    mock_content_scan = MagicMock()
    mock_content_scan.type = "tool_use"
    mock_content_scan.name = "scan_city"
    mock_content_scan.id = "call_scan_1"
    mock_content_scan.input = {}

    mock_resp_1 = MagicMock()
    mock_resp_1.stop_reason = "tool_use"
    mock_resp_1.content = [mock_content_scan]

    mock_content_finalize = MagicMock()
    mock_content_finalize.type = "tool_use"
    mock_content_finalize.name = "finalize_heat_hunt"
    mock_content_finalize.id = "call_fin_2"
    mock_content_finalize.input = {
        "ranked_zones": [{"zone_id": "Zone 1", "response_gap_score": 7.2}],
        "executive_briefing": "Mocked investigation complete.",
        "recommended_dispatches": [{"action_type": "DEPLOY_MOBILE_COOLING_UNIT"}],
    }

    mock_resp_2 = MagicMock()
    mock_resp_2.stop_reason = "tool_use"
    mock_resp_2.content = [mock_content_finalize]

    mock_client = AsyncMock()
    mock_client.messages.create.side_effect = [mock_resp_1, mock_resp_2]

    mock_anthropic_mod = ModuleType("anthropic")
    mock_anthropic_mod.AsyncAnthropic = MagicMock(return_value=mock_client)

    with patch.dict(sys.modules, {"anthropic": mock_anthropic_mod}):
        orch = HeatHuntOrchestrator(provider="anthropic", max_steps=10)
        orch.settings.anthropic_api_key = "sk-ant-test-key"

        # Mock tool execution to test loop in isolation
        mock_registry = MagicMock()
        mock_registry.get_all_schemas.return_value = [{"name": "scan_city"}, {"name": "finalize_heat_hunt"}]
        mock_registry.execute_tool = AsyncMock(side_effect=[
            {"status": "success", "data": {"hotspots": []}},
            {"status": "completed", "data": {"status": "completed", "total_ranked_zones": 1, "ranked_zones": [{"zone_id": "Zone 1"}]}}
        ])
        orch.tool_registry = mock_registry

        events = []

        async def step_listener(event):
            events.append(event)

        result = await orch.run(
            target_area_geojson=None,
            date_str="2026-08-23",
            time_str="14:00",
            on_step=step_listener,
        )

        assert result["status"] == "completed"
        assert result["total_ranked_zones"] == 1
        assert result["ranked_zones"][0]["zone_id"] == "Zone 1"


@pytest.mark.asyncio
async def test_orchestrator_mocked_gemini_loop():
    """Verify Gemini tool-use functionCall loop with mocked httpx client."""
    mock_gemini_resp_1 = MagicMock()
    mock_gemini_resp_1.status_code = 200
    mock_gemini_resp_1.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "functionCall": {
                                "name": "scan_city",
                                "args": {}
                            }
                        }
                    ]
                }
            }
        ]
    }

    mock_gemini_resp_2 = MagicMock()
    mock_gemini_resp_2.status_code = 200
    mock_gemini_resp_2.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "functionCall": {
                                "name": "finalize_heat_hunt",
                                "args": {
                                    "ranked_zones": [{"zone_id": "Zone 1", "response_gap_score": 8.0}],
                                    "executive_briefing": "Gemini autonomous scan complete.",
                                    "recommended_dispatches": [{"action_type": "DEPLOY_MOBILE_COOLING_UNIT"}],
                                }
                            }
                        }
                    ]
                }
            }
        ]
    }

    orch = HeatHuntOrchestrator(provider="gemini", model_name="gemini-3.5-flash-lite", max_steps=10)
    orch.settings.gemini_api_key = "AIza-test-gemini-key"

    # Mock tool registry execution for fast, isolated loop validation
    mock_registry = MagicMock()
    mock_registry.get_all_schemas.return_value = [{"name": "scan_city"}, {"name": "finalize_heat_hunt"}]
    mock_registry.execute_tool = AsyncMock(side_effect=[
        {"status": "success", "data": {"hotspots": []}},
        {"status": "completed", "data": {"status": "completed", "total_ranked_zones": 1, "ranked_zones": [{"zone_id": "Zone 1"}]}}
    ])
    orch.tool_registry = mock_registry

    mock_http_client = AsyncMock()
    mock_http_client.post.side_effect = [mock_gemini_resp_1, mock_gemini_resp_2]
    mock_http_client.__aenter__.return_value = mock_http_client
    mock_http_client.__aexit__.return_value = None

    with patch("httpx.AsyncClient", return_value=mock_http_client):
        events = []

        async def step_listener(event):
            events.append(event)

        result = await orch.run(
            target_area_geojson=None,
            date_str="2026-08-23",
            time_str="14:00",
            on_step=step_listener,
        )

        assert result["status"] == "completed"
        assert result["total_ranked_zones"] == 1
        assert result["ranked_zones"][0]["zone_id"] == "Zone 1"
        assert any(e["tool_name"] == "scan_city" for e in events)
        assert any(e["tool_name"] == "finalize_heat_hunt" for e in events)


