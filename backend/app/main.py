from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.errors import HeatSentinelError
from app.logging_config import logger
from app.db import init_db
from app.routers import health, heat_hunt, fortyguard, analysis


import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting HeatSentinel AI backend...")
    init_db()
    
    # Initialize global httpx AsyncClient for connection pooling
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    logger.info("Global HTTP client initialized.")
    
    yield
    
    logger.info("Shutting down HeatSentinel AI backend...")
    await app.state.http_client.aclose()
    logger.info("Global HTTP client closed.")


app = FastAPI(
    title="HeatSentinel AI API",
    description="Autonomous Hyperlocal Heat Response Intelligence Backend (FortyGuard Hackathon '26)",
    version="1.0.0",
    lifespan=lifespan
)

# Exception handlers
@app.exception_handler(HeatSentinelError)
async def custom_error_handler(request: Request, exc: HeatSentinelError):
    logger.warning(f"HeatSentinelError [{exc.code}]: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )

# CORS middleware for React frontend (Vite dev server default 5173, custom 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(heat_hunt.router)
app.include_router(fortyguard.router)
app.include_router(analysis.router)
