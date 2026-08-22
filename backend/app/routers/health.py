from fastapi import APIRouter
from app.config import get_settings

router = APIRouter(tags=["Health & Config"])

@router.get("/health")
async def health_check():
    """Returns basic health status."""
    return {"status": "ok"}

@router.get("/config/status")
async def config_status():
    """Reports configuration status without leaking sensitive keys."""
    settings = get_settings()
    return {
        "app_name": settings.app_name,
        "app_mode": settings.app_mode,
        "fortyguard_configured": bool(settings.fortyguard_api_key),
        "gemini_configured": bool(settings.gemini_api_key)
    }
