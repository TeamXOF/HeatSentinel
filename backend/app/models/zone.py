"""
Pydantic models for Heat Zones, evidence, and spatial geometry.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class LatLng(BaseModel):
    lat: float
    lng: float


class ZoneEvidence(BaseModel):
    primary_driver: str = Field(description="Dominant factor driving heat risk (e.g. Surface Temperature, High SVI, Low Tree Canopy)")
    heat_score_explanation: str
    vulnerability_explanation: str
    resource_gap_explanation: str
    data_sources: List[str] = Field(default_factory=list)


class HeatZone(BaseModel):
    zone_id: str
    name: str
    city: str = "Phoenix"
    coordinates: List[List[float]] = Field(description="Polygon coordinates in [lng, lat] format")
    center: LatLng
    mean_temp_c: float
    mean_temp_f: float
    persistence_score: float
    svi_score: float
    response_gap_score: float
    priority_level: str = "medium"  # critical, high, medium, low
    evidence: Optional[ZoneEvidence] = None
