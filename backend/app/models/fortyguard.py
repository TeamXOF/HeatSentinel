"""
Pydantic models for FortyGuard API requests and async polling responses.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class FortyGuardAsyncSubmitResponse(BaseModel):
    activity_id: str
    status: str = "submitted"


class FortyGuardStatusResponse(BaseModel):
    activity_id: str
    status: str  # pending, processing, completed, failed
    progress: Optional[int] = 0
    error: Optional[str] = None


class HeatDataPoint(BaseModel):
    lng: float
    lat: float
    temperature_c: float
    surface_temp_c: Optional[float] = None
    humidity: Optional[float] = None
