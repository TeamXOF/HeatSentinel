"""
Pydantic models for cooling resources (MAG Heat Relief Network, cooling centers, hydration stations).
"""

from pydantic import BaseModel
from typing import Optional


class CoolingResource(BaseModel):
    id: str
    name: str
    resource_type: str  # cooling_center, hydration_station, respite_center
    lat: float
    lng: float
    address: str
    capacity: Optional[int] = None
    is_active: bool = True
