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

---

## Response Gap Component Scores (Project-Derived Analytical Choices)

All sub-scores are calculated deterministically on a $0 - 100$ scale using explicit, named parameters and are surfaced in the user interface on a $0.0 - 10.0$ scale.

### 1. Heat Exposure Score ($0 - 100$)
Combines thermal intensity, acute duration, regional baseline exceedance, and historical anomaly:
- **Peak Temperature (30% weight):** $\text{normalize}(\text{max\_temp\_c}, 30.0^\circ\text{C}, 50.0^\circ\text{C})$
- **Persistence (30% weight):** $\text{normalize}(\text{persistence\_hours}, 0.0\text{h}, 8.0\text{h})$
- **Exceedance (25% weight):** $\text{normalize}(\text{exceedance\_hours}, 0.0\text{h}, 8.0\text{h})$
- **Historical Anomaly (15% weight):** $\text{normalize}(\text{anomaly\_c}, 0.0^\circ\text{C}, 6.0^\circ\text{C})$
*Note:* If historical depth is insufficient (`anomaly_c is None`), the 15% weight is redistributed proportionally among the active three parameters.

### 2. Population Vulnerability Score ($0 - 100$)
Combines physiological sensitivity, socioeconomic barrier, and population concentration:
- **Elderly Population 65+ (40% weight):** $\text{normalize}(\text{elderly\_pct}, 5\%, 35\%)$
- **Socioeconomic Vulnerability Index (40% weight):** $\text{normalize}(\text{SVI}, 0.0, 1.0)$
- **Population Density (20% weight):** $\text{normalize}(\text{density}, 500/\text{mi}^2, 10,000/\text{mi}^2)$

### 3. Protective Resource Deficit Score ($0 - 100$)
Quantifies facility proximity and scarcity:
- **Walking Distance Penalty (50% weight):** $\text{normalize}(\text{nearest\_distance\_m}, 0\text{m}, 1600\text{m})$
- **Scarcity Factor (50% weight):** $\max\left(0, 100 - (\text{facilities\_1mi} \times 20 + \text{facilities\_in\_zone} \times 25)\right)$

---

## Combined Response Gap Formula & Risk Tiers (Step 25)

$$\text{Base Score} = 0.40 \times \text{Heat Exposure} + 0.35 \times \text{Vulnerability} + 0.25 \times \text{Resource Deficit}$$

### Compounding Synergy Multiplier
When an acute crisis manifests across all three dimensions ($\text{Heat} \ge 70.0$, $\text{Vulnerability} \ge 70.0$, and $\text{Deficit} \ge 70.0$), a $+10\%$ compounding synergy bonus is applied:
$$\text{Response Gap} = \min(100.0, \text{Base Score} \times 1.10)$$

### Decision-Support Risk Tiers
- **`CRITICAL`:** $\text{Response Gap} \ge 75.0$ ($\ge 7.5$) — Immediate emergency cooling deployment required.
- **`HIGH`:** $\text{Response Gap} \ge 50.0$ ($\ge 5.0$) — Targeted hydration and outreach staging.
- **`MODERATE`:** $\text{Response Gap} \ge 25.0$ ($\ge 2.5$) — Active monitoring and civic advisory.
- **`LOW`:** $\text{Response Gap} < 25.0$ ($< 2.5$) — Normal municipal operations.

### Non-Clinical Disclaimer
*Response Gap is a project-derived decision-support score for this hackathon prototype. It is not an official public-health index, medical prediction, or mortality forecast.*


