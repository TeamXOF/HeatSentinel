from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field, field_validator, model_validator

# --- Base Models for Geometry ---

class GeoJSONPolygon(BaseModel):
    type: Literal["Polygon"]
    coordinates: List[List[List[float]]]

# --- Request Models ---

class DateTimeFilter(BaseModel):
    start_date: str = Field(..., description="YYYY-MM-DD")
    start_time: str = Field(..., description="HH:MM")
    end_date: Optional[str] = None
    end_time: Optional[str] = None
    filter_type: int = Field(default=1, description="1 for all, 2 for daytime, etc.")

class HeatmapRequest(BaseModel):
    polygon_aoi: GeoJSONPolygon
    date_time: DateTimeFilter
    analytic_type: Literal["tcm", "time_of_measure", "exceedance", "persistence"]
    granularity: Literal[60, 80, 100]
    threshold: Optional[float] = None
    direction: Optional[Literal["above", "below"]] = None

    @field_validator("polygon_aoi")
    @classmethod
    def validate_us_bounds(cls, v: GeoJSONPolygon) -> GeoJSONPolygon:
        # Enforce strict US bounding box to prevent lat/lon swapping
        # Longitude: -125 to -65
        # Latitude: 24 to 49
        for ring in v.coordinates:
            for point in ring:
                if len(point) != 2:
                    raise ValueError("Coordinates must be exactly [longitude, latitude].")
                lon, lat = point[0], point[1]
                if not (-125.0 <= lon <= -65.0):
                    raise ValueError(f"Longitude {lon} is outside strict US bounds (-125 to -65). Did you swap lat/lon?")
                if not (24.0 <= lat <= 49.0):
                    raise ValueError(f"Latitude {lat} is outside strict US bounds (24 to 49). Did you swap lat/lon?")
        return v

    @model_validator(mode="after")
    def validate_threshold_requirements(self) -> "HeatmapRequest":
        if self.analytic_type in ("exceedance", "persistence"):
            if self.threshold is None or self.direction is None:
                raise ValueError("Both 'threshold' and 'direction' are required when analytic_type is 'exceedance' or 'persistence'.")
        return self


# --- Response Models ---

class HeatmapSubmitData(BaseModel):
    activity_id: str

class HeatmapSubmitResponse(BaseModel):
    error: bool
    status_code: int
    message: str
    data: HeatmapSubmitData

class HeatmapResultStats(BaseModel):
    activity_id: str
    n_cells: int

class HeatmapResult(BaseModel):
    # Using Any for map_data to avoid heavily specifying GeoJSON types if we don't need to parse them strictly yet
    map_data: Dict[str, Any]
    stats_data: HeatmapResultStats

class StatusData(BaseModel):
    activity_id: str
    status: str  # E.g., 'Processing', 'Completed', 'Failed'
    result: Optional[HeatmapResult] = None

class StatusResponse(BaseModel):
    error: bool
    status_code: int
    message: str
    data: StatusData
