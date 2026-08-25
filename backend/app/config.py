from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Literal
import os

class Settings(BaseSettings):
    app_name: str = "HeatSentinel AI"
    app_mode: Literal["live", "cached", "demo"] = "demo"
    fortyguard_api_key: str = ""
    gemini_api_key: str = ""
    anthropic_api_key: str = ""
    census_api_key: str = ""
    database_url: str = "sqlite:///./heatsentinel.db"
    environment: str = "dev"

    # Standardized Timeout & Retry Policy (Step 42)
    fortyguard_request_timeout_seconds: float = 30.0
    fortyguard_poll_timeout_seconds: float = 60.0
    fortyguard_max_retries: int = 2
    census_request_timeout_seconds: float = 15.0
    llm_per_turn_timeout_seconds: float = 45.0
    heat_hunt_overall_timeout_seconds: float = 300.0

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", ".env"),
        extra="ignore"
    )

@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    
    if settings.app_mode == "live":
        if not settings.fortyguard_api_key:
            raise ValueError("FORTYGUARD_API_KEY is required in 'live' mode.")
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required in 'live' mode.")
            
    return settings
