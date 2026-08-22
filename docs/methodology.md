# HeatSentinel Methodology

This document outlines the scientific and analytical methodologies used by HeatSentinel AI, ensuring all derived metrics are transparent and empirically defensible.

## Historical Baseline Construction

HeatSentinel AI calculates a "Heat Anomaly" for any given zone by comparing the current temperature (`tcm`) against a location-and-time-aware historical baseline. 

### Core Principles
1. **No Fabrication:** We NEVER invent or hallucinate a baseline temperature if historical data is unavailable. If FortyGuard lacks sufficient historical depth for a specific AOI and time, the anomaly calculation is safely skipped (`baseline_available: False`) rather than populated with a fabricated generic number.
2. **No Forecasting:** We do not use predictive or forecast models to guess temperatures. The anomaly is strictly a comparison of *now* vs *recent history*.

### Methodology
To construct the baseline for a specific AOI polygon:
1. The system identifies the target reference date and reference time (e.g., `14:00`).
2. The system concurrently queries the FortyGuard `tcm` endpoint for the **same polygon** at the **same time-of-day** for the preceding `N` days (defaulting to a 5-day lookback).
3. For each successful historical day, we calculate the spatial average temperature across all grid cells within the zone.
4. We then compute the mean of these daily spatial averages to form a single, robust baseline temperature for that specific zone at that time of day.

This approach ensures the baseline accurately reflects the *recent local climate norm*, smoothing out single-day outliers while remaining hyperspecific to the microclimate of the target polygon.
