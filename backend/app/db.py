"""
HeatSentinel AI - Database Module
Provides lightweight SQLite file connection helpers for local persistence
(caching API responses, runs, metrics, and evidence) with zero-ops overhead.
"""

import sqlite3
from contextlib import contextmanager
from typing import Generator
from app.config import get_settings
from app.logging_config import logger


def get_db_path() -> str:
    """Extract SQLite local file path from config database_url."""
    settings = get_settings()
    url = settings.database_url
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "")
    return "heatsentinel.db"


@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Context manager yielding a SQLite connection configured with row factory."""
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        conn.close()


def init_db():
    """Initialize database tables if they do not exist."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS heat_hunt_jobs (
                job_id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                mode TEXT NOT NULL,
                provider TEXT NOT NULL,
                model_name TEXT NOT NULL,
                progress_events_json TEXT NOT NULL DEFAULT '[]',
                result_json TEXT,
                error TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS heat_hunt_runs (
                job_id TEXT PRIMARY KEY,
                mode TEXT NOT NULL,
                status TEXT NOT NULL,
                progress INTEGER DEFAULT 0,
                current_step TEXT,
                results_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_cache (
                cache_key TEXT PRIMARY KEY,
                endpoint TEXT NOT NULL,
                response_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fortyguard_cache (
                request_hash TEXT PRIMARY KEY,
                response_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS zone_heat_metrics_cache (
                cache_key TEXT PRIMARY KEY,
                response_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pipeline_basic_scan_cache (
                cache_key TEXT PRIMARY KEY,
                response_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    logger.info("Database initialized successfully.")
