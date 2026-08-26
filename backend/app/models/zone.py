"""
Pydantic models for Heat Zones, evidence, and spatial geometry.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class LatLng(BaseModel):
    lat: float
    lng: float

    def to_geojson_coords(self) -> List[float]:
        return [self.lng, self.lat]

    @classmethod
    def from_geojson_coords(cls, coords: List[float]) -> "LatLng":
        return cls(lng=coords[0], lat=coords[1])

class ZoneEvidence(BaseModel):
    primary_driver: str = Field(default="Thermal Intensity", description="Dominant factor driving heat risk")
    heat_score_explanation: Optional[str] = None
    vulnerability_explanation: Optional[str] = None
    resource_gap_explanation: Optional[str] = None
    
    # Thermal Metrics
    current_temp_c: float
    current_temp_f: float
    persistence_hours: float
    exceedance_hours: float
    anomaly_c: Optional[float] = None
    baseline_available: bool = False
    
    # Demographics & Equity
    population_estimate: int = 0
    elderly_pct: float = 0.0
    socioeconomic_vulnerability: float = 0.0
    source_tracts: List[str] = Field(default_factory=list)
    
    # Cooling Infrastructure
    cooling_resources_in_1mi: int = 0
    cooling_resources_in_zone: int = 0
    nearest_resource_distance_m: Optional[float] = None
    nearest_resource_name: Optional[str] = None
    nearest_resource_type: Optional[str] = None
    total_cooling_capacity: int = 0
    
    # Full Citation & Audit Trail
    data_sources: List[str] = Field(default_factory=list)
    sources: Dict[str, Any] = Field(default_factory=dict)

    # Tree Canopy — no dataset integrated in this analysis; always None
    tree_cover_pct: Optional[float] = None

    # Recommendation from recommend_action tool (populated by Heat Hunt, null for basic scan)
    recommend_action: Optional[str] = None
    recommend_action_category: Optional[str] = None


class HeatZone(BaseModel):
    zone_id: str
    name: str
    city: str = "Phoenix"
    coordinates: List[List[float]] = Field(description="Polygon coordinates in [lng, lat] format")
    center: LatLng
    mean_temp_c: float
    mean_temp_f: float
    persistence_hours: float = 0.0
    exceedance_hours: float = 0.0
    heat_exposure_score: float = 0.0
    vulnerability_score: float = 0.0
    resource_deficit_score: float = 0.0
    response_gap_score: float
    display_score: float = 0.0
    priority_level: str = "MODERATE"  # CRITICAL, HIGH, MODERATE, LOW
    rank: int = 1
    evidence: Optional[ZoneEvidence] = None
    disclaimer: Optional[str] = None
    # Convenience accessor mirroring evidence.recommend_action (populated by Heat Hunt)
    recommend_action: Optional[str] = None
    recommend_action_category: Optional[str] = None


class HeatMetrics(BaseModel):
    current_temp_c: float
    persistence_hours: float
    exceedance_hours: float
    anomaly_c: Optional[float] = None
    baseline_available: bool
    data_sources: List[str] = Field(default_factory=list)
    computed_at: datetime
    mode: str = "live"


class BasicPipelineResult(BaseModel):
    status: str = "ok"
    city: str = "Phoenix"
    timestamp: datetime
    scan_summary: Dict[str, Any]
    ranked_zones: List[HeatZone]
    total_zones: int
    excluded_zones: List[Dict[str, Any]] = Field(default_factory=list)
    disclaimer: str
