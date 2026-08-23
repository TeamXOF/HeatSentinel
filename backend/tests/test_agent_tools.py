"""
HeatSentinel AI - Agent Tool Schemas & Registry Tests (Step 33)
Validates all 9 core agent tool schemas, multi-provider format conversions,
and deterministic execution dispatchers.
"""

import pytest
from app.agent.tools import ALL_TOOL_SCHEMAS
from app.agent.tool_registry import get_tool_registry, ToolRegistry


EXPECTED_TOOLS = [
    "scan_city",
    "query_fortyguard_heat",
    "refine_hotspot",
    "get_vulnerability_data",
    "get_resources",
    "calculate_risk_metrics",
    "calculate_response_gap",
    "recommend_action",
    "explain_priority",
    "finalize_heat_hunt",
]


def test_tool_schema_validity():
    """Verify all tool schemas conform to Anthropic / JSON Schema requirements."""
    assert len(ALL_TOOL_SCHEMAS) == 10

    for schema in ALL_TOOL_SCHEMAS:
        assert "name" in schema
        assert "description" in schema
        assert "input_schema" in schema
        assert len(schema["name"]) > 0
        assert len(schema["description"]) > 20
        assert schema["input_schema"]["type"] == "object"
        assert "properties" in schema["input_schema"]


def test_multi_provider_schema_export():
    """Verify schema conversion for Anthropic, OpenAI, and Gemini formats."""
    registry = get_tool_registry()

    anthropic_schemas = registry.get_all_schemas("anthropic")
    assert len(anthropic_schemas) == 10
    assert "input_schema" in anthropic_schemas[0]

    openai_schemas = registry.get_all_schemas("openai")
    assert len(openai_schemas) == 10
    assert openai_schemas[0]["type"] == "function"
    assert "parameters" in openai_schemas[0]["function"]

    gemini_schemas = registry.get_all_schemas("gemini")
    assert len(gemini_schemas) == 10
    assert "parameters" in gemini_schemas[0]

    with pytest.raises(ValueError):
        registry.get_all_schemas("unsupported_format")


def test_tool_registry_lists_all_9_tools():
    """Verify all 9 expected tools are registered and callable."""
    registry = get_tool_registry()
    registered = registry.list_tools()
    for expected in EXPECTED_TOOLS:
        assert expected in registered, f"Missing tool '{expected}' in registry!"


@pytest.mark.asyncio
async def test_calculate_response_gap_tool_execution():
    """Verify execution of calculate_response_gap tool through registry."""
    registry = get_tool_registry()
    res = await registry.execute_tool(
        "calculate_response_gap",
        {
            "heat_exposure_score": 80.0,
            "vulnerability_score": 75.0,
            "resource_deficit_score": 85.0,
        }
    )
    assert res["status"] == "success"
    data = res["data"]
    assert data["tier"] == "CRITICAL"
    assert data["display_score"] >= 7.5
    assert "components" in data


@pytest.mark.asyncio
async def test_recommend_action_tool_deterministic_rules():
    """Verify deterministic recommendation categories based on evidence thresholds."""
    registry = get_tool_registry()

    # Rule 1: CRITICAL + zero resources (>1000m) -> DEPLOY_MOBILE_COOLING_UNIT
    res_critical = await registry.execute_tool(
        "recommend_action",
        {
            "tier": "CRITICAL",
            "heat_score": 85.0,
            "vulnerability_score": 80.0,
            "resource_deficit_score": 90.0,
            "evidence": {"nearest_resource_distance_m": 2200.0}
        }
    )
    assert res_critical["status"] == "success"
    assert res_critical["data"]["action_type"] == "DEPLOY_MOBILE_COOLING_UNIT"
    assert res_critical["data"]["priority_urgency"] == "IMMEDIATE_DISPATCH"

    # Rule 2: High vulnerability (SVI/elderly) -> SENIOR_WELLNESS_CANVASSING
    res_vuln = await registry.execute_tool(
        "recommend_action",
        {
            "tier": "HIGH",
            "heat_score": 45.0,
            "vulnerability_score": 75.0,
            "resource_deficit_score": 40.0,
            "evidence": {"elderly_pct": 0.28}
        }
    )
    assert res_vuln["status"] == "success"
    assert res_vuln["data"]["action_type"] == "SENIOR_WELLNESS_CANVASSING"

    # Rule 3: Resource deficit -> EXPAND_HYDRATION_OUTPOST
    res_res = await registry.execute_tool(
        "recommend_action",
        {
            "tier": "MODERATE",
            "heat_score": 45.0,
            "vulnerability_score": 40.0,
            "resource_deficit_score": 65.0,
            "evidence": {}
        }
    )
    assert res_res["status"] == "success"
    assert res_res["data"]["action_type"] == "EXPAND_HYDRATION_OUTPOST"


@pytest.mark.asyncio
async def test_explain_priority_tool_execution():
    """Verify execution of explain_priority tool assembling empirical audit trail."""
    registry = get_tool_registry()
    res = await registry.execute_tool(
        "explain_priority",
        {
            "zone_id": "Zone 1",
            "zone_name": "Central Business Corridor",
            "response_gap_result": {"display_score": 6.8, "tier": "HIGH", "response_gap_score": 68.0},
            "heat_metrics": {"peak_temp_c": 41.5, "persistence_hours": 4.5},
            "vulnerability_data": {"population_estimate": 8500, "elderly_pct": 0.22},
            "resource_data": {"cooling_resources_in_1mi": 2, "nearest_resource_distance_m": 850.0},
            "recommendation": {"action_type": "EXPAND_HYDRATION_OUTPOST"},
        }
    )
    assert res["status"] == "success"
    data = res["data"]
    assert data["zone_id"] == "Zone 1"
    assert data["priority_tier"] == "HIGH"
    assert "disclaimer" in data
    assert "empirical_evidence" in data


@pytest.mark.asyncio
async def test_vulnerability_and_resources_tools_execution():
    """Verify get_vulnerability_data and get_resources tools against real Phoenix data."""
    registry = get_tool_registry()

    sample_poly = {
        "type": "Polygon",
        "coordinates": [
            [
                [-112.080, 33.440],
                [-112.065, 33.440],
                [-112.065, 33.455],
                [-112.080, 33.455],
                [-112.080, 33.440],
            ]
        ]
    }

    vuln_res = await registry.execute_tool("get_vulnerability_data", {"zone_polygon": sample_poly})
    assert vuln_res["status"] == "success"
    assert "population_estimate" in vuln_res["data"]
    assert "elderly_pct" in vuln_res["data"]

    res_res = await registry.execute_tool("get_resources", {"zone_polygon": sample_poly})
    assert res_res["status"] == "success"
    assert "cooling_resources_in_1mi" in res_res["data"]
    assert "nearest_resource_distance_m" in res_res["data"]


@pytest.mark.asyncio
async def test_tool_registry_error_handling():
    """Verify error handling for unregistered tools and missing arguments."""
    registry = get_tool_registry()

    # Unregistered tool
    err_res = await registry.execute_tool("non_existent_tool", {})
    assert err_res["status"] == "error"
    assert "not registered" in err_res["error"]

    # Missing required argument in calculate_response_gap
    err_arg_res = await registry.execute_tool("calculate_response_gap", {})
    assert err_arg_res["status"] == "error"
    assert "error" in err_arg_res
