from typing import Optional
from app.services.fortyguard_client import FortyGuardClient
from app.services.scan_service import scan_area
from app.logging_config import logger
from datetime import datetime, timedelta, timezone
import asyncio
import statistics
import json
import hashlib
from app.db import get_db_connection
from app.models.zone import HeatMetrics

async def get_persistence(
    polygon: dict, 
    start_date: str, 
    start_time: str, 
    threshold: float, 
    client: FortyGuardClient,
    direction: str = "above", 
    granularity: int = 60
) -> dict:
    """
    Fetch native persistence analytics using FortyGuard.
    Persistence represents the duration (in hours) the temperature stayed
    above/below the given threshold.
    """
    logger.info(f"AnalyticsEngine: Fetching persistence (threshold={threshold}, direction={direction})")
    return await scan_area(
        polygon=polygon,
        analytic_type="persistence",
        granularity=granularity,
        start_date=start_date,
        start_time=start_time,
        client=client,
        threshold=threshold,
        direction=direction
    )

async def get_exceedance(
    polygon: dict, 
    start_date: str, 
    start_time: str, 
    threshold: float,
    client: FortyGuardClient,
    direction: str = "above", 
    granularity: int = 60
) -> dict:
    """
    Fetch native exceedance analytics using FortyGuard.
    Exceedance typically calculates total degree-hours above/below the threshold.
    """
    logger.info(f"AnalyticsEngine: Fetching exceedance (threshold={threshold}, direction={direction})")
    return await scan_area(
        polygon=polygon,
        analytic_type="exceedance",
        granularity=granularity,
        start_date=start_date,
        start_time=start_time,
        client=client,
        threshold=threshold,
        direction=direction
    )

async def get_historical_baseline(
    polygon: dict,
    reference_date: str,
    reference_time: str,
    client: FortyGuardClient,
    lookback_days: int = 5,
    granularity: int = 60
) -> dict:
    """
    Constructs a historical reference temperature for a given AOI and time-of-day.
    Fetches `tcm` for the past `lookback_days` and computes the mean.
    Returns:
        {
            "baseline_available": bool,
            "value": float | None,
            "dates_sampled": list[str]
        }
    """
    ref_dt = datetime.strptime(reference_date, "%Y-%m-%d")
    
    tasks = []
    dates_queried = []
    
    for i in range(1, lookback_days + 1):
        target_dt = ref_dt - timedelta(days=i)
        target_date_str = target_dt.strftime("%Y-%m-%d")
        dates_queried.append(target_date_str)
        
        # We fetch tcm for the historical date
        tasks.append(
            scan_area(
                polygon=polygon,
                analytic_type="tcm",
                granularity=granularity,
                start_date=target_date_str,
                start_time=reference_time,
                client=client
            )
        )
        
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    valid_means = []
    successful_dates = []
    
    for date_str, res in zip(dates_queried, results):
        if isinstance(res, Exception):
            logger.warning(f"AnalyticsEngine: Failed to fetch historical data for {date_str}: {res}")
            continue
            
        features = res.get("data", {}).get("features", [])
        if not features:
            continue
            
        # calculate spatial average for this day
        temps = []
        for f in features:
            val = f.get("properties", {}).get("value")
            if val is not None:
                temps.append(val)
                
        if temps:
            valid_means.append(statistics.mean(temps))
            successful_dates.append(date_str)
            
    if not valid_means:
        return {
            "baseline_available": False,
            "value": None,
            "dates_sampled": []
        }
        
    baseline_val = statistics.mean(valid_means)
    
    return {
        "baseline_available": True,
        "value": round(baseline_val, 2),
        "dates_sampled": successful_dates
    }

def calculate_anomaly(current_temp: float, baseline: dict) -> dict | None:
    """
    Calculates the heat anomaly by subtracting the historical baseline from the current temperature.
    Returns None if baseline is unavailable to prevent fabricated data.
    """
    if not baseline.get("baseline_available") or baseline.get("value") is None:
        return None
        
    anomaly = current_temp - baseline["value"]
    
    return {
        "anomaly_c": round(anomaly, 2),
        "current": round(current_temp, 2),
        "baseline": baseline["value"],
        "baseline_dates": baseline.get("dates_sampled", [])
    }

async def compute_zone_heat_metrics(
    zone_polygon: dict,
    start_date: str,
    start_time: str,
    client: FortyGuardClient,
    force_refresh: bool = False
) -> HeatMetrics:
    """
    Orchestrates FortyGuard calls to build a normalized HeatMetrics object for a zone.
    Uses SQLite caching based on the polygon hash and date/time.
    """
    # Hash the polygon and date/time for the cache key
    payload_str = json.dumps({
        "polygon": zone_polygon,
        "date": start_date,
        "time": start_time
    }, sort_keys=True)
    cache_key = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()
    
    if not force_refresh:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT response_json, created_at FROM zone_heat_metrics_cache WHERE cache_key = ?", (cache_key,))
            row = cursor.fetchone()
            if row:
                logger.info(f"AnalyticsEngine: Zone metrics cache hit ({cache_key})")
                data = json.loads(row["response_json"])
                data["mode"] = "cached"
                return HeatMetrics(**data)

    logger.info(f"AnalyticsEngine: Computing zone metrics ({cache_key})")
    
    # 1. Fetch current TCM and historical baseline concurrently
    tcm_task = scan_area(
        polygon=zone_polygon,
        analytic_type="tcm",
        granularity=60,
        start_date=start_date,
        start_time=start_time,
        client=client
    )
    baseline_task = get_historical_baseline(
        polygon=zone_polygon,
        reference_date=start_date,
        reference_time=start_time,
        client=client,
        lookback_days=5
    )
    
    tcm_res, baseline = await asyncio.gather(tcm_task, baseline_task)
    
    # Extract current_temp
    tcm_features = tcm_res.get("data", {}).get("features", [])
    temps = []
    for f in tcm_features:
        p = f.get("properties", {})
        v = p.get("value") or p.get("average_temperature") or p.get("max_temperature") or p.get("temp")
        if v is not None:
            temps.append(float(v))
    current_temp_c = round(statistics.mean(temps), 2) if temps else 0.0
    
    # 2. Calculate anomaly
    anomaly_data = calculate_anomaly(current_temp_c, baseline)
    anomaly_c = anomaly_data["anomaly_c"] if anomaly_data else None
    
    # 3. Calculate dynamic threshold
    # If baseline is available, use baseline + 2 degrees, else fallback to 35.0
    if baseline.get("baseline_available") and baseline.get("value") is not None:
        dynamic_threshold = baseline["value"] + 2.0
    else:
        dynamic_threshold = 35.0
        
    # 4. Fetch persistence and exceedance concurrently using dynamic threshold
    per_task = get_persistence(
        polygon=zone_polygon,
        start_date=start_date,
        start_time=start_time,
        threshold=dynamic_threshold,
        client=client
    )
    exc_task = get_exceedance(
        polygon=zone_polygon,
        start_date=start_date,
        start_time=start_time,
        threshold=dynamic_threshold,
        client=client
    )
    
    per_res, exc_res = await asyncio.gather(per_task, exc_task)
    
    # Extract persistence and exceedance
    per_features = per_res.get("data", {}).get("features", [])
    per_vals = [f.get("properties", {}).get("value") for f in per_features if f.get("properties", {}).get("value") is not None]
    persistence_hours = round(statistics.mean(per_vals), 2) if per_vals else 0.0
    
    exc_features = exc_res.get("data", {}).get("features", [])
    exc_vals = [f.get("properties", {}).get("value") for f in exc_features if f.get("properties", {}).get("value") is not None]
    exceedance_hours = round(statistics.mean(exc_vals), 2) if exc_vals else 0.0
    
    metrics = HeatMetrics(
        current_temp_c=current_temp_c,
        persistence_hours=persistence_hours,
        exceedance_hours=exceedance_hours,
        anomaly_c=anomaly_c,
        baseline_available=baseline.get("baseline_available", False),
        data_sources=["FortyGuard API"],
        computed_at=datetime.now(timezone.utc),
        mode="live"
    )
    
    # Save to cache
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO zone_heat_metrics_cache (cache_key, response_json)
            VALUES (?, ?)
            ON CONFLICT(cache_key) DO UPDATE SET response_json = excluded.response_json
            """,
            (cache_key, metrics.model_dump_json())
        )
        
    return metrics


