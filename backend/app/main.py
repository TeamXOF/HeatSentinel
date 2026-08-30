import os

from fastapi import FastAPI, Request, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.errors import HeatSentinelError
from app.logging_config import logger
from app.db import init_db
from app.routers import health, heat_hunt, fortyguard, analysis
from app.config import get_settings


import httpx


# ==========================================
# API Key Authentication Gate (HSA-03)
# ==========================================
_INTERNAL_API_KEY = os.environ.get("HEATSENTINEL_API_KEY", "")


async def verify_api_key(x_api_key: str = Header(default="")):
    """Rejects requests without a valid API key. Bypassed when HEATSENTINEL_API_KEY is not set (dev mode)."""
    if not _INTERNAL_API_KEY:
        return  # No key configured — allow (dev mode)
    if x_api_key != _INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting HeatSentinel AI backend...")
    init_db()
    
    # Initialize global httpx AsyncClient for connection pooling
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    logger.info("Global HTTP client initialized.")
    
    # Startup Environment & FortyGuard Mode Check (Issue 1)
    cfg = get_settings()
    is_deployed = (
        cfg.environment.lower() in ("prod", "production")
        or cfg.app_env.lower() in ("prod", "production")
        or os.environ.get("APP_ENV", "").lower() == "production"
        or bool(os.environ.get("RENDER"))
        or bool(os.environ.get("RAILWAY_ENVIRONMENT"))
        or bool(os.environ.get("VERCEL"))
        or bool(os.environ.get("FASTAPI_CLOUD"))
    )
    if is_deployed and cfg.fortyguard_mode == "mock":
        logger.warning(
            "\n" + "=" * 80 + "\n"
            "⚠️  CRITICAL CONFIGURATION NOTICE: FORTYGUARD_MODE is set to 'mock' in a DEPLOYED/PRODUCTION environment.\n"
            "The application will serve deterministic mock fixture data instead of live FortyGuard API data.\n"
            "To enable live FortyGuard API calls in production, set FORTYGUARD_MODE=live in your cloud deployment dashboard.\n"
            + "=" * 80 + "\n"
        )
    elif cfg.fortyguard_mode == "mock":
        logger.info("FortyGuard Client operating in MOCK mode (zero credit consumption for local dev/testing).")
    else:
        logger.info("FortyGuard Client operating in LIVE mode (real API credits will be consumed).")

    yield
    
    logger.info("Shutting down HeatSentinel AI backend...")
    await app.state.http_client.aclose()
    logger.info("Global HTTP client closed.")


# ==========================================
# Rate Limiter (HSA-04)
# ==========================================
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="HeatSentinel AI API",
    description="Autonomous Hyperlocal Heat Response Intelligence Backend (FortyGuard Hackathon '26)",
    version="1.0.0",
    lifespan=lifespan
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Global Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    return response


# Exception handlers
@app.exception_handler(HeatSentinelError)
async def custom_error_handler(request: Request, exc: HeatSentinelError):
    logger.warning(f"HeatSentinelError [{exc.code}]: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An internal server error occurred."}},
    )


# CORS middleware — reads ALLOWED_ORIGINS env var (comma-separated).
# Set to "*" for local dev, or the specific Vercel domain for production.
_settings = get_settings()
_allowed_origins = [o.strip() for o in _settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
# Health endpoint stays unauthenticated (load balancer probes, uptime checks)
app.include_router(health.router)
# All other routers require API key authentication (HSA-03)
app.include_router(heat_hunt.router, dependencies=[Depends(verify_api_key)])
app.include_router(fortyguard.router, dependencies=[Depends(verify_api_key)])
app.include_router(analysis.router, dependencies=[Depends(verify_api_key)])
