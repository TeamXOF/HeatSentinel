"""
HeatSentinel AI - FortyGuard API Client Service
Handles all interactions with FortyGuard's async and synchronous endpoints:
- Submitting heat raster/point queries
- Polling activity status (/v1/status/{activity_id})
- Retrieving and normalizing heat data
- Caching responses locally to conserve quota
"""

from typing import Dict, Any, Optional, List
from app.config import get_settings
from app.logging_config import logger


class FortyGuardClient:
    """Client for FortyGuard API (Premium hackathon tier)."""

    def __init__(self):
        self.settings = get_settings()
        self.base_url = "https://api.fortyguard.com"
        self.api_key = self.settings.fortyguard_api_key

    async def submit_heat_request(self, polygon_coords: List[List[float]], date_time: Optional[str] = None) -> str:
        """Submit an async heat calculation request for a bounded polygon (<= 10 mi²)."""
        logger.info("FortyGuardClient: submit_heat_request stub called")
        # Full implementation in Phase 2
        return "stub-activity-id"

    async def poll_activity_status(self, activity_id: str) -> Dict[str, Any]:
        """Poll FortyGuard activity status until completed or timed out."""
        logger.info(f"FortyGuardClient: polling status for {activity_id}")
        return {"status": "completed", "activity_id": activity_id}

    async def get_activity_results(self, activity_id: str) -> Dict[str, Any]:
        """Retrieve results payload for a completed activity."""
        logger.info(f"FortyGuardClient: retrieving results for {activity_id}")
        return {"activity_id": activity_id, "data": []}
