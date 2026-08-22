# HeatSentinel Methodology

This document outlines the scientific and analytical methodologies used by HeatSentinel AI, ensuring all derived metrics are transparent and empirically defensible.

---

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

---

## Vulnerability Data (Census ACS 5-Year)

### Data Source & Vintage
Demographic exposure indicators are sourced from the **U.S. Census Bureau American Community Survey (ACS) 5-Year Estimates (2022 vintage)** at the Census tract level for Maricopa County, Arizona.

### Area-Weighted Spatial Join Formulation
Because thermal hotspots detected by FortyGuard do not conform to administrative Census tract boundaries, HeatSentinel applies an **area-weighted intersection join** projected to planar coordinates (`EPSG:2223` NAD83 / Arizona Central State Plane):

$$\text{Overlap Fraction}_i = \frac{\text{Area}(\text{Zone} \cap \text{Tract}_i)}{\text{Area}(\text{Tract}_i)}$$

$$\text{Estimated Population} = \sum_i \left( \text{Pop}_i \times \text{Overlap Fraction}_i \right)$$

$$\text{Weighted Elderly \%} = \sum_i \left( \text{Elderly \%}_i \times \frac{\text{Pop}_i \times \text{Overlap Fraction}_i}{\text{Estimated Population}} \right)$$

$$\text{Socioeconomic Vulnerability} = \sum_i \left( \text{SVI}_i \times \frac{\text{Pop}_i \times \text{Overlap Fraction}_i}{\text{Estimated Population}} \right)$$

All contributing Census tract GEOIDs are preserved in the `source_geographies` attribute to provide a verifiable empirical evidence trail in the WHY panel.

---

## Resource Proximity & Deficit Analysis (MAG Heat Relief Network)

### Data Source
Protective cooling infrastructure is compiled from the **Maricopa Association of Governments (MAG) Heat Relief Network Registry**, categorized into:
- **Cooling Centers:** Air-conditioned public facilities offering indoor refuge during extreme heat advisories.
- **Hydration Stations:** Fixed or mobile outposts providing free potable water and electrolyte replenishment.
- **Respite Centers:** Extended-hours shelters providing beds, medical monitoring, and thermal relief for vulnerable unhoused residents.

### Search Radius & Distance Metric
* **Search Buffer:** Fixed at $1,600 \text{ meters}$ ($\approx 1.0 \text{ mile}$), representing the standard safe walking distance under extreme urban heat conditions before heat exhaustion risk spikes.
* **Planar Distance:** Computed using Euclidean planar distance on `EPSG:2223` State Plane coordinates, calculating exact minimum distance in meters from the zone boundary to the nearest active resource facility.
