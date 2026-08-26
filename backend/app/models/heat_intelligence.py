from pydantic import BaseModel
from typing import Optional

class HeatIntelligenceJob(BaseModel):
    job_id: str
    zone_id: str
    activity_id: Optional[str] = None
    status: str = "pending"  # "pending", "processing", "completed", "failed", "expired"
    download_link: Optional[str] = None
    error: Optional[str] = None
    created_at: str
    expires_at: Optional[str] = None
