from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Literal

class Settings(BaseSettings):
    app_name: str = "HeatSentinel AI"
    app_mode: Literal["live", "cached", "demo"] = "demo"
    fortyguard_api_key: str = ""
    gemini_api_key: str = ""
    database_url: str = "sqlite:///./heatsentinel.db"

    model_config = SettingsConfigDict(env_file=".env")

@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    
    if settings.app_mode == "live":
        if not settings.fortyguard_api_key:
            raise ValueError("FORTYGUARD_API_KEY is required in 'live' mode.")
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required in 'live' mode.")
            
    return settings
