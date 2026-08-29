"""
HeatSentinel AI - Agent Tool Registry & Dispatcher (Phase 8 / Step 33)
Central dispatcher mapping tool names to schemas and executing Python wrappers:
- Dispatches tool executions asynchronously with parameter validation
- Exports schemas in Anthropic Tool-Use, Gemini Function Declaration, and OpenAI formats
- Provides clean error payloads so that agent orchestration loops remain resilient
"""

import inspect
from typing import Dict, Any, List, Callable, Optional

from app.logging_config import logger
from jsonschema import validate, ValidationError as JsonSchemaValidationError
from app.agent.tools import (
    ALL_TOOL_SCHEMAS,
    SCAN_CITY_SCHEMA,
    QUERY_FORTYGUARD_HEAT_SCHEMA,
    REFINE_HOTSPOT_SCHEMA,
    GET_VULNERABILITY_DATA_SCHEMA,
    GET_RESOURCES_SCHEMA,
    CALCULATE_RISK_METRICS_SCHEMA,
    CALCULATE_RESPONSE_GAP_SCHEMA,
    RECOMMEND_ACTION_SCHEMA,
    EXPLAIN_PRIORITY_SCHEMA,
    FINALIZE_HEAT_HUNT_SCHEMA,
    run_scan_city,
    run_query_fortyguard_heat,
    run_refine_hotspot,
    run_get_vulnerability_data,
    run_get_resources,
    run_calculate_risk_metrics,
    run_calculate_response_gap,
    run_recommend_action,
    run_explain_priority,
    run_finalize_heat_hunt,
)


class ToolRegistry:
    """Central registry and execution dispatcher for all HeatSentinel agent tools."""

    def __init__(self):
        self._schemas: Dict[str, Dict[str, Any]] = {
            s["name"]: s for s in ALL_TOOL_SCHEMAS
        }
        self._handlers: Dict[str, Callable] = {
            "scan_city": run_scan_city,
            "query_fortyguard_heat": run_query_fortyguard_heat,
            "refine_hotspot": run_refine_hotspot,
            "get_vulnerability_data": run_get_vulnerability_data,
            "get_resources": run_get_resources,
            "calculate_risk_metrics": run_calculate_risk_metrics,
            "calculate_response_gap": run_calculate_response_gap,
            "recommend_action": run_recommend_action,
            "explain_priority": run_explain_priority,
            "finalize_heat_hunt": run_finalize_heat_hunt,
        }

    def list_tools(self) -> List[str]:
        """Returns the list of registered tool names."""
        return list(self._handlers.keys())

    def get_tool_schema(self, name: str) -> Optional[Dict[str, Any]]:
        """Returns the Anthropic JSON schema for a tool by name."""
        return self._schemas.get(name)

    def get_all_schemas(self, schema_format: str = "anthropic") -> List[Dict[str, Any]]:
        """
        Returns all registered tool schemas formatted for the requested LLM provider:
        - 'anthropic': standard Anthropic tool definition (name, description, input_schema)
        - 'openai': OpenAI tool definition ({type: 'function', function: {name, description, parameters}})
        - 'gemini': Gemini function declaration format
        """
        schemas = list(self._schemas.values())

        if schema_format.lower() == "anthropic":
            return schemas
        elif schema_format.lower() == "openai":
            return [
                {
                    "type": "function",
                    "function": {
                        "name": s["name"],
                        "description": s["description"],
                        "parameters": s["input_schema"],
                    }
                }
                for s in schemas
            ]
        elif schema_format.lower() == "gemini":
            return [
                {
                    "name": s["name"],
                    "description": s["description"],
                    "parameters": s["input_schema"],
                }
                for s in schemas
            ]
        else:
            raise ValueError(f"Unsupported schema format: '{schema_format}'. Use 'anthropic', 'openai', or 'gemini'.")

    async def execute_tool(self, tool_name: str, arguments: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Dispatches a tool call to its implementing Python service function.
        Catches exceptions and returns a structured error payload to keep the agent loop resilient.
        """
        args = arguments or {}

        if tool_name not in self._handlers:
            logger.error(f"Tool '{tool_name}' not found in registry.")
            return {
                "status": "error",
                "tool": tool_name,
                "error": f"Tool '{tool_name}' is not registered. Available tools: {self.list_tools()}",
            }

        handler = self._handlers[tool_name]
        logger.info(f"Agent executing tool '{tool_name}' with arguments: {list(args.keys())}")

        # HSA-06: Validate arguments against declared input_schema before dispatch
        schema_def = self._schemas.get(tool_name, {})
        input_schema = schema_def.get("input_schema")
        if input_schema:
            try:
                validate(instance=args, schema=input_schema)
            except JsonSchemaValidationError as ve:
                logger.warning(f"Tool '{tool_name}' argument validation failed: {ve.message}")
                return {
                    "status": "error",
                    "tool": tool_name,
                    "error": f"Invalid arguments: {ve.message}",
                }
        else:
            logger.warning(f"Tool '{tool_name}' has no input_schema defined — skipping validation.")
        try:
            if inspect.iscoroutinefunction(handler):
                result = await handler(args)
            else:
                result = handler(args)

            return {
                "status": "success",
                "tool": tool_name,
                "data": result,
            }
        except Exception as e:
            logger.error(f"Error executing tool '{tool_name}': {str(e)}", exc_info=True)
            return {
                "status": "error",
                "tool": tool_name,
                "error": str(e),
            }


# Singleton registry instance
_GLOBAL_REGISTRY: Optional[ToolRegistry] = None


def get_tool_registry() -> ToolRegistry:
    """Returns the singleton ToolRegistry instance."""
    global _GLOBAL_REGISTRY
    if _GLOBAL_REGISTRY is None:
        _GLOBAL_REGISTRY = ToolRegistry()
    return _GLOBAL_REGISTRY
