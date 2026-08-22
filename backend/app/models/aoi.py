"""
Pydantic models for Area of Interest (AOI) and grid tiling (10 mi² limit enforcement).
"""

from pydantic import BaseModel, Field
from typing import List, Tuple


class BoundingBox(BaseModel):
    min_lng: float
    min_lat: float
    max_lng: float
    max_lat: float


class AOITile(BaseModel):
    tile_id: str
    polygon: List[List[float]] = Field(description="Tile polygon coordinates in [lng, lat] order")
    area_sq_miles: float
    is_valid_size: bool = True  # Must be <= 10.0 mi²
