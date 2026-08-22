"""
Pydantic models for Response Gap calculation and priority ranking.
"""

from pydantic import BaseModel, Field


class ResponseGapScore(BaseModel):
    zone_id: str
    heat_hazard_score: float = Field(ge=0.0, le=100.0)
    vulnerability_score: float = Field(ge=0.0, le=100.0)
    resource_deficit_score: float = Field(ge=0.0, le=100.0)
    composite_gap_score: float = Field(ge=0.0, le=100.0)
    rank: int = 1
