import asyncio
import httpx
from typing import Dict, Any, Optional

from app.config import get_settings
from app.models.fortyguard import HeatmapRequest, StatusResponse
from app.logging_config import logger
from app.errors import FortyGuardAPIError

class FortyGuardClient:
    """
    Centralized client for interacting with the FortyGuard API.
    Handles the asynchronous submit -> poll -> result workflow.
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
    def _headers(self) -> Dict[str, str]:
        # Do not log this header dictionary anywhere!
        return {
            "api-key": getattr(self.settings, "fortyguard_api_key", ""),
            "accept": "application/json",
            "content-type": "application/json"
        }

    async def submit_heatmap(self, request: HeatmapRequest) -> str:
        """Submits a heatmap request with bounded retry and returns the activity_id."""
        url = f"{self.base_url}/v1/heatmap"
        payload = request.model_dump(mode="json", exclude_none=True)
        
        logger.info(f"Submitting heatmap request: {payload.get('analytic_type')} at {payload.get('granularity')}m")
        
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
        url = f"{self.base_url}/v1/heat_intelligence"
        payload = {
            "latitude": float(latitude),
            "longitude": float(longitude),
            "temperature": float(temperature),
            "date": date,
            "analysis": analysis
        }
        
        logger.info(f"Submitting heat intelligence request for {latitude}, {longitude}")
        
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
        url = f"{self.base_url}/v1/status/{activity_id}"
        
        resp = await self.http_client.get(url, headers=self._headers)
        
        if resp.status_code != 200:
            logger.error(f"FortyGuard status poll failed: HTTP {resp.status_code}", extra={"resp_body": resp.text})
            raise FortyGuardAPIError(f"Failed to poll status: {resp.status_code}", status_code=resp.status_code)
            
        # Parse into our strict Pydantic model
        return StatusResponse.model_validate(resp.json())

    async def poll_until_complete(
        self, activity_id: str, timeout_seconds: Optional[int] = None, interval_seconds: float = 2.0
    ) -> StatusResponse:
        """Polls the status endpoint until it succeeds or fails, with resilient retry against transient network blips."""
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
        """
        Normalizes the raw FortyGuard status response into a stable internal GeoJSON FeatureCollection.
        As agreed in the architectural plan, we keep it as a standard GeoJSON FeatureCollection 
        so it can be directly piped to the frontend mapping libraries (Mapbox/Leaflet).
        """
        if not raw.data.result or not raw.data.result.map_data:
            logger.warning(f"No map_data found in completed result for {raw.data.activity_id}")
            return {"type": "FeatureCollection", "features": []}
            
        # We ensure it returns a pure dict representing the GeoJSON
        return raw.data.result.map_data

    async def run_heatmap(
        self, request: HeatmapRequest, timeout_seconds: int = 120, interval_seconds: float = 2.0
    ) -> Dict[str, Any]:
        """Convenience method: Submits request, polls until complete, and returns normalized GeoJSON."""
        activity_id = await self.submit_heatmap(request)
        final_status = await self.poll_until_complete(activity_id, timeout_seconds, interval_seconds)
        return self.normalize_heatmap_result(final_status)
