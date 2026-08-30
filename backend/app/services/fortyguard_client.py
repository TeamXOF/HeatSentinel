import asyncio
import httpx
import hashlib
import json
from contextvars import ContextVar
from typing import Dict, Any, Optional, List

from app.config import get_settings
from app.models.fortyguard import HeatmapRequest, StatusResponse, StatusData, HeatmapResult, HeatmapSubmitData
from app.logging_config import logger
from app.errors import FortyGuardAPIError, redact_sensitive_headers


class RunBudgetTracker:
    """
    Thread-safe & asyncio-coroutine-safe budget tracker.
    When stored in a ContextVar, child tasks spawned via asyncio.gather or asyncio.create_task
    receive shallow copies of the context holding the exact same RunBudgetTracker reference,
    ensuring that concurrent branches atomically decrement from the single shared run budget.
    """
    def __init__(self, max_allowed: int = 12):
        self.max_allowed = max_allowed
        self.calls_count = 0
        self._lock = asyncio.Lock()

    async def acquire_call_slot(self) -> int:
        """
        Atomically checks remaining budget and claims a call slot.
        Raises FortyGuardAPIError(429) if budget limit is reached.
        Returns the 1-based call sequence index for this run.
        """
        async with self._lock:
            if self.calls_count >= self.max_allowed:
                logger.critical(
                    f"[FORTYGUARD BUDGET GUARD] 🛑 HARD STOP ENFORCED: Maximum allowed live API calls per run "
                    f"({self.max_allowed}) reached across concurrent branches. "
                    f"Refusing further live FortyGuard API calls to protect credit budget."
                )
                raise FortyGuardAPIError(
                    f"Budget guard limit reached ({self.max_allowed} live calls in current run). "
                    f"Live API call blocked to prevent credit overconsumption.",
                    status_code=429
                )
            self.calls_count += 1
            return self.calls_count

    @property
    def current_count(self) -> int:
        return self.calls_count


# Context-scoped live budget tracker instance (shared across concurrent asyncio tasks within a run)
_DEFAULT_RUN_TRACKER = RunBudgetTracker(max_allowed=12)
_CURRENT_RUN_TRACKER: ContextVar[RunBudgetTracker] = ContextVar("current_run_tracker", default=_DEFAULT_RUN_TRACKER)

# Global process telemetry tracker (cumulative across server uptime for diagnostic logging only)
_CUMULATIVE_PROCESS_CALL_COUNT: int = 0
_CUMULATIVE_PROCESS_CREDITS_SPENT: int = 0


def reset_run_budget(max_allowed: Optional[int] = None) -> RunBudgetTracker:
    """
    Explicitly initializes a new shared RunBudgetTracker for the current execution context and its child tasks.
    If max_allowed is None, 0, or negative, safely defaults to fortyguard_max_calls_per_run from config.
    """
    default_limit = int(getattr(get_settings(), "fortyguard_max_calls_per_run", 12))
    limit = max_allowed if (max_allowed is not None and max_allowed > 0) else default_limit
    tracker = RunBudgetTracker(max_allowed=limit)
    _CURRENT_RUN_TRACKER.set(tracker)
    return tracker


def get_current_run_tracker() -> RunBudgetTracker:
    """Returns the shared RunBudgetTracker for the current run context."""
    return _CURRENT_RUN_TRACKER.get()


def get_run_live_call_count() -> int:
    """Returns the number of live FortyGuard API calls made in the current run context."""
    return _CURRENT_RUN_TRACKER.get().current_count


def reset_budget_guard(max_allowed: Optional[int] = None) -> None:
    """Resets both per-run and process cumulative counters (used in unit tests / test isolation)."""
    global _CUMULATIVE_PROCESS_CALL_COUNT, _CUMULATIVE_PROCESS_CREDITS_SPENT
    reset_run_budget(max_allowed)
    _CUMULATIVE_PROCESS_CALL_COUNT = 0
    _CUMULATIVE_PROCESS_CREDITS_SPENT = 0


def _generate_mock_thermal_features(polygon_aoi: Dict[str, Any], analytic_type: str = "tcm") -> List[Dict[str, Any]]:
    """Generates deterministic synthetic 60m thermal grid features within the requested AOI bounds."""
    try:
        coords = polygon_aoi.get("coordinates", [[]])[0]
        lons = [c[0] for c in coords if len(c) >= 2]
        lats = [c[1] for c in coords if len(c) >= 2]
        min_lon, max_lon = min(lons), max(lons)
        min_lat, max_lat = min(lats), max(lats)
    except Exception:
        min_lon, max_lon = -112.095, -112.030
        min_lat, max_lat = 33.375, 33.465

    features = []
    step = 0.003  # ~300m grid cell spacing for fast lightweight mock
    lat = min_lat
    idx = 0
    while lat <= max_lat:
        lon = min_lon
        while lon <= max_lon:
            # Create a realistic micro-climate heat signature
            dist_downtown = ((lon - (-112.074)) ** 2 + (lat - 33.448) ** 2) ** 0.5
            dist_maryvale = ((lon - (-112.185)) ** 2 + (lat - 33.488) ** 2) ** 0.5
            
            if dist_downtown < 0.02:
                temp = 45.5 + (idx % 5) * 0.4
            elif dist_maryvale < 0.02:
                temp = 43.8 + (idx % 4) * 0.3
            else:
                temp = 39.5 + (idx % 7) * 0.4

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [round(lon, 5), round(lat, 5)],
                        [round(lon + step, 5), round(lat, 5)],
                        [round(lon + step, 5), round(lat + step, 5)],
                        [round(lon, 5), round(lat + step, 5)],
                        [round(lon, 5), round(lat, 5)],
                    ]]
                },
                "properties": {
                    "value": round(temp, 2),
                    "temp": round(temp, 2),
                    "temperature": round(temp, 2),
                    "cell_id": f"cell_mock_{idx}",
                    "tile_id": f"tile_mock_{int(lat * 100) % 4}",
                    "analytic_type": analytic_type
                }
            })
            lon += step
            idx += 1
        lat += step
    return features


class FortyGuardClient:
    """
    Centralized client for interacting with the FortyGuard API.
    Handles the asynchronous submit -> poll -> result workflow,
    with built-in dry-run mock mode and atomic per-run Request Budget Guard hard stop.
    """
    def __init__(self, http_client: Optional[httpx.AsyncClient] = None):
        self.settings = get_settings()
        timeout_val = getattr(self.settings, "fortyguard_request_timeout_seconds", 30.0)
        timeout_sec = float(timeout_val) if isinstance(timeout_val, (int, float)) else 30.0
        self.http_client = http_client or httpx.AsyncClient(
            timeout=httpx.Timeout(timeout_sec)
        )
        self.base_url = "https://api.fortyguard.com"
        
    @property
    def is_mock_mode(self) -> bool:
        return getattr(self.settings, "fortyguard_mode", "mock") == "mock"

    @property
    def _headers(self) -> Dict[str, str]:
        # Do not log this header dictionary anywhere!
        return {
            "api-key": getattr(self.settings, "fortyguard_api_key", ""),
            "accept": "application/json",
            "content-type": "application/json"
        }

    @property
    def _safe_headers(self) -> Dict[str, str]:
        """Returns redacted headers safe for logging."""
        return redact_sensitive_headers(self._headers)

    async def submit_heatmap(self, request: HeatmapRequest) -> str:
        """Submits a heatmap request with bounded retry and returns the activity_id."""
        payload = request.model_dump(mode="json", exclude_none=True)
        
        # 1. DRY-RUN MOCK MODE (Zero Credit Spend)
        if self.is_mock_mode:
            payload_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()[:12]
            activity_id = f"mock-heatmap-{payload_hash}"
            logger.info(f"FortyGuardClient [MOCK MODE]: Simulating heatmap submission -> {activity_id} (0 credits)")
            return activity_id

        # 2. LIVE MODE - Per-Run Concurrency-Safe Request Budget Guard Hard Stop
        tracker = get_current_run_tracker()
        run_call_idx = await tracker.acquire_call_slot()

        global _CUMULATIVE_PROCESS_CALL_COUNT, _CUMULATIVE_PROCESS_CREDITS_SPENT
        _CUMULATIVE_PROCESS_CALL_COUNT += 1
        est_credits = 4000 if payload.get("granularity") == 60 else 2000
        _CUMULATIVE_PROCESS_CREDITS_SPENT += est_credits
        
        url = f"{self.base_url}/v1/heatmap"
        logger.warning(
            f"[FORTYGUARD BUDGET GUARD] 🚨 LIVE PAID API CALL (Run Call #{run_call_idx}/{tracker.max_allowed}, "
            f"Process Total #{_CUMULATIVE_PROCESS_CALL_COUNT}): endpoint={url}, analytic={payload.get('analytic_type')}, "
            f"granularity={payload.get('granularity')}, est_credits=+{est_credits} "
            f"(Cumulative Session: ~{_CUMULATIVE_PROCESS_CREDITS_SPENT:,} credits)"
        )
        
        retries_val = getattr(self.settings, "fortyguard_max_retries", 2)
        max_retries = int(retries_val) if isinstance(retries_val, int) else 2
        max_attempts = max_retries + 1
        last_err = None
        for attempt in range(1, max_attempts + 1):
            try:
                resp = await self.http_client.post(url, headers=self._headers, json=payload)
                if resp.status_code in (200, 201, 202):
                    data = resp.json()
                    activity_id = data.get("data", {}).get("activity_id")
                    if not activity_id:
                        raise FortyGuardAPIError("Missing activity_id in FortyGuard response", status_code=502)
                    logger.info(f"Heatmap submitted successfully. Activity ID: {activity_id}")
                    return activity_id
                elif resp.status_code >= 500 and attempt < max_attempts:
                    logger.warning(f"FortyGuard transient 5xx ({resp.status_code}), retrying attempt {attempt+1}...")
                    await asyncio.sleep(1.0 * attempt)
                    continue
                else:
                    logger.error(f"FortyGuard submission failed: HTTP {resp.status_code}", extra={"resp_body": resp.text})
                    raise FortyGuardAPIError(f"Failed to submit heatmap: {resp.status_code}", status_code=resp.status_code)
            except httpx.TimeoutException as te:
                last_err = te
                if attempt < max_attempts:
                    logger.warning(f"FortyGuard timeout on attempt {attempt}, retrying...")
                    await asyncio.sleep(1.0 * attempt)
                    continue
                raise FortyGuardAPIError("FortyGuard request timed out after retries", status_code=504)
            except Exception as e:
                if isinstance(e, FortyGuardAPIError):
                    raise
                if attempt < max_attempts:
                    logger.warning(f"FortyGuard error on attempt {attempt}: {e}, retrying...")
                    await asyncio.sleep(1.0 * attempt)
                    continue
                raise FortyGuardAPIError(f"FortyGuard request failed: {e}", status_code=502)

    async def submit_heat_intelligence(self, latitude: float, longitude: float, temperature: float, date: str, analysis: list[str]) -> str:
        """Submits a heat intelligence PDF request and returns the activity_id."""
        payload = {
            "latitude": float(latitude),
            "longitude": float(longitude),
            "temperature": float(temperature),
            "date": date,
            "analysis": analysis
        }
        
        # 1. DRY-RUN MOCK MODE
        if self.is_mock_mode:
            payload_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()[:12]
            activity_id = f"mock-hi-{payload_hash}"
            logger.info(f"FortyGuardClient [MOCK MODE]: Simulating heat intelligence submission -> {activity_id} (0 credits)")
            return activity_id

        # 2. LIVE MODE - Per-Run Concurrency-Safe Request Budget Guard Hard Stop
        tracker = get_current_run_tracker()
        run_call_idx = await tracker.acquire_call_slot()

        global _CUMULATIVE_PROCESS_CALL_COUNT, _CUMULATIVE_PROCESS_CREDITS_SPENT
        _CUMULATIVE_PROCESS_CALL_COUNT += 1
        est_credits = 5000
        _CUMULATIVE_PROCESS_CREDITS_SPENT += est_credits
        
        url = f"{self.base_url}/v1/heat_intelligence"
        logger.warning(
            f"[FORTYGUARD BUDGET GUARD] 🚨 LIVE PAID API CALL (Run Call #{run_call_idx}/{tracker.max_allowed}, "
            f"Process Total #{_CUMULATIVE_PROCESS_CALL_COUNT}): endpoint={url}, zone_coords=({latitude}, {longitude}), "
            f"est_credits=+{est_credits} (Cumulative Session: ~{_CUMULATIVE_PROCESS_CREDITS_SPENT:,} credits)"
        )
        
        retries_val = getattr(self.settings, "fortyguard_max_retries", 2)
        max_retries = int(retries_val) if isinstance(retries_val, int) else 2
        max_attempts = max_retries + 1
        last_err = None
        
        for attempt in range(1, max_attempts + 1):
            try:
                resp = await self.http_client.post(url, headers=self._headers, json=payload)
                if resp.status_code in (200, 201, 202):
                    data = resp.json()
                    activity_id = data.get("data", {}).get("activity_id")
                    if not activity_id:
                        raise FortyGuardAPIError("Missing activity_id in FortyGuard response", status_code=502)
                    logger.info(f"Heat intelligence submitted successfully. Activity ID: {activity_id}")
                    return activity_id
                elif resp.status_code >= 500 and attempt < max_attempts:
                    logger.warning(f"FortyGuard transient 5xx ({resp.status_code}), retrying attempt {attempt+1}...")
                    await asyncio.sleep(1.0 * attempt)
                    continue
                else:
                    logger.error(f"FortyGuard submission failed: HTTP {resp.status_code}", extra={"resp_body": resp.text})
                    raise FortyGuardAPIError(f"Failed to submit heat intelligence: {resp.status_code}", status_code=resp.status_code)
            except httpx.TimeoutException as te:
                last_err = te
                if attempt < max_attempts:
                    logger.warning(f"FortyGuard timeout on attempt {attempt}, retrying...")
                    await asyncio.sleep(1.0 * attempt)
                    continue
                raise FortyGuardAPIError("FortyGuard request timed out after retries", status_code=504)
            except Exception as e:
                if isinstance(e, FortyGuardAPIError):
                    raise
                last_err = e
                if attempt < max_attempts:
                    logger.warning(f"FortyGuard error on attempt {attempt}: {e}, retrying...")
                    await asyncio.sleep(1.0 * attempt)
                    continue
                raise FortyGuardAPIError(f"FortyGuard request failed: {e}", status_code=502)

    async def get_status(self, activity_id: str) -> StatusResponse:
        """Fetches the current status of an activity_id."""
        if activity_id.startswith("mock-"):
            if "mock-hi-" in activity_id:
                return StatusResponse(
                    error=False,
                    status_code=200,
                    message="Completed",
                    data=StatusData(
                        activity_id=activity_id,
                        status="completed",
                        result=HeatmapResult(
                            download_link="https://docs.fortyguard.com/sample_heat_intelligence_report.pdf"
                        )
                    )
                )
            # Mock heatmap status
            mock_features = _generate_mock_thermal_features({})
            return StatusResponse(
                error=False,
                status_code=200,
                message="Completed",
                data=StatusData(
                    activity_id=activity_id,
                    status="completed",
                    result=HeatmapResult(
                        map_data={"type": "FeatureCollection", "features": mock_features}
                    )
                )
            )

        url = f"{self.base_url}/v1/status/{activity_id}"
        resp = await self.http_client.get(url, headers=self._headers)
        
        if resp.status_code != 200:
            logger.error(f"FortyGuard status poll failed: HTTP {resp.status_code}", extra={"resp_body": resp.text})
            raise FortyGuardAPIError(f"Failed to poll status: {resp.status_code}", status_code=resp.status_code)
            
        return StatusResponse.model_validate(resp.json())

    async def poll_until_complete(
        self, activity_id: str, timeout_seconds: Optional[int] = None, interval_seconds: float = 2.0,
        request_context: Optional[HeatmapRequest] = None
    ) -> StatusResponse:
        """Polls the status endpoint until it succeeds or fails."""
        if activity_id.startswith("mock-"):
            if "mock-hi-" in activity_id:
                return StatusResponse(
                    error=False,
                    status_code=200,
                    message="Completed",
                    data=StatusData(
                        activity_id=activity_id,
                        status="completed",
                        result=HeatmapResult(
                            download_link="https://docs.fortyguard.com/sample_heat_intelligence_report.pdf"
                        )
                    )
                )
            
            poly = request_context.polygon_aoi.model_dump() if request_context else {}
            mock_features = _generate_mock_thermal_features(poly)
            return StatusResponse(
                error=False,
                status_code=200,
                message="Completed",
                data=StatusData(
                    activity_id=activity_id,
                    status="completed",
                    result=HeatmapResult(
                        map_data={"type": "FeatureCollection", "features": mock_features}
                    )
                )
            )

        timeout = timeout_seconds or int(self.settings.fortyguard_poll_timeout_seconds)
        logger.info(f"Starting polling for activity_id: {activity_id} (timeout={timeout}s)")
        
        start_time = asyncio.get_running_loop().time()
        attempt = 1
        consecutive_errors = 0
        
        while True:
            current_time = asyncio.get_running_loop().time()
            if (current_time - start_time) > timeout:
                logger.error(f"Polling timed out for {activity_id} after {timeout}s")
                raise FortyGuardAPIError(f"Polling timeout for {activity_id}", status_code=504)
                
            try:
                status_resp = await self.get_status(activity_id)
                consecutive_errors = 0
            except Exception as poll_err:
                consecutive_errors += 1
                if consecutive_errors >= 5:
                    logger.error(f"Failed to poll status after 5 consecutive errors: {poll_err}")
                    raise
                logger.warning(f"Transient error polling {activity_id} (attempt {attempt}): {poll_err}. Retrying...")
                await asyncio.sleep(interval_seconds)
                attempt += 1
                continue
                
            status = status_resp.data.status.lower() if status_resp.data.status else None
            
            logger.debug(f"Poll attempt {attempt} for {activity_id}: {status}")
            
            if status in ("completed", "succeeded"):
                logger.info(f"Activity {activity_id} completed successfully.")
                return status_resp
                
            if status in ("failed", "error"):
                logger.error(f"Activity {activity_id} failed on FortyGuard's side.")
                raise FortyGuardAPIError(f"FortyGuard activity failed: {status}", status_code=502)
                
            attempt += 1
            await asyncio.sleep(interval_seconds)

    def normalize_heatmap_result(self, raw: StatusResponse) -> Dict[str, Any]:
        """Normalizes raw FortyGuard status response into GeoJSON FeatureCollection."""
        if not raw.data.result:
            return {"type": "FeatureCollection", "features": []}
            
        if isinstance(raw.data.result, dict):
            map_data = raw.data.result.get("map_data")
        else:
            map_data = raw.data.result.map_data
            
        if not map_data:
            return {"type": "FeatureCollection", "features": []}
            
        return map_data

    async def run_heatmap(
        self, request: HeatmapRequest, timeout_seconds: int = 120, interval_seconds: float = 2.0
    ) -> Dict[str, Any]:
        """Submits request, polls until complete, and returns normalized GeoJSON."""
        activity_id = await self.submit_heatmap(request)
        final_status = await self.poll_until_complete(activity_id, timeout_seconds, interval_seconds, request_context=request)
        return self.normalize_heatmap_result(final_status)
