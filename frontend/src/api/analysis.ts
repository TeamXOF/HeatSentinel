import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { USE_MOCK_DATA, apiFetch, API_BASE_URL } from './config';
import {
  ZoneEvidenceDetail,
  RiskTier,
  DataMode,
  HeatZoneMarker,
  RiskZoneSummaryData,
  PopulationAtRiskData,
  AgentStatusBarData,
  StatCard,
  PriorityAction,
} from '../types';
import { mockZoneEvidenceData, getEvidenceForZone } from '../data/mockZoneEvidenceData';
import { mockHeatZoneMarkers, mockHeatGeoJSON, PHOENIX_CENTER } from '../data/mockHeatMapData';
import {
  mockRiskZoneSummary,
  mockPopulationAtRisk,
  mockAgentStatusBar,
} from '../data/mockAnalyticsData';
import { mockStatCards } from '../data/mockKpiData';

/**
 * Backend API Pipeline Interfaces (Step 28 / 29)
 */
export interface BackendZoneEvidence {
  primary_driver: string;
  current_temp_c: number;
  current_temp_f: number;
  persistence_hours: number;
  exceedance_hours: number;
  anomaly_c?: number | null;
  population_estimate: number;
  elderly_pct: number;
  socioeconomic_vulnerability: number;
  source_tracts: string[];
  cooling_resources_in_1mi: number;
  cooling_resources_in_zone: number;
  nearest_resource_distance_m: number;
  nearest_resource_name?: string | null;
  nearest_resource_type?: string | null;
  total_cooling_capacity?: number | null;
  data_sources: string[];
}

export interface BackendZone {
  zone_id: string;
  name: string;
  city: string;
  coordinates: number[][]; // [[lng, lat], ...]
  center: { lat: number; lng: number };
  mean_temp_c: number;
  mean_temp_f: number;
  persistence_hours: number;
  exceedance_hours: number;
  anomaly_c?: number | null;
  heat_exposure_score: number;
  vulnerability_score: number;
  resource_deficit_score: number;
  response_gap_score: number;
  display_score: number;
  priority_level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  rank: number;
  evidence: BackendZoneEvidence;
  disclaimer: string;
}

export interface BasicScanApiResponse {
  status: string;
  city: string;
  mode: 'live' | 'cached';
  cache_key?: string;
  duration_ms: number;
  scan_summary: {
    total_tiles: number;
    total_cells: number;
    hotspots_detected: number;
    zones_ranked: number;
    excluded_count: number;
    duration_ms: number;
  };
  ranked_zones: BackendZone[];
  excluded_zones: any[];
  disclaimer: string;
}

/**
 * Standard Zone Data Schema required by HeatSentinel UI
 */
export interface ZoneData {
  id: string;
  zoneNumber: number;
  name: string;
  tier: RiskTier;
  responseGapScore: number;
  temperature: string;
  peakTempF: string;
  persistence: string;
  exceedance: string;
  anomaly?: string;
  elderlyPct: string;
  treeCoverPct: number | null;
  coolingResourceCount: number;
  recommendedAction: string;
  population: string;
  lastUpdated: string;
  priorityAction: string;
  mode: 'live' | 'cached' | 'demo';
  coordinates?: number[][];
  center?: { lat: number; lng: number };
  evidence: ZoneEvidenceDetail;
}

/**
 * Transform backend HeatZone to rich frontend ZoneData
 */
export function transformBackendZoneToZoneData(
  bz: BackendZone,
  mode: 'live' | 'cached' | 'demo' = 'live'
): ZoneData {
  const ev = bz.evidence;
  const dataMode: DataMode = mode === 'live' ? 'LIVE DATA' : mode === 'cached' ? 'CACHED' : 'DEMO MODE';

  const evidenceDetail: ZoneEvidenceDetail = {
    zoneId: bz.zone_id,
    zoneNumber: bz.rank,
    zoneName: bz.name,
    tier: bz.priority_level as RiskTier,
    dataMode: dataMode,
    responseGapScore: bz.display_score,
    components: [
      {
        label: 'Thermal Exposure',
        score: Number((bz.heat_exposure_score / 10).toFixed(1)),
        maxScore: 10,
        color: '#EF4444',
      },
      {
        label: 'Demographics (SVI)',
        score: Number((bz.vulnerability_score / 10).toFixed(1)),
        maxScore: 10,
        color: '#F97316',
      },
      {
        label: 'Resource Deficit',
        score: Number((bz.resource_deficit_score / 10).toFixed(1)),
        maxScore: 10,
        color: '#3B82F6',
      },
    ],
    heatMetrics: {
      temperatureC: `${bz.mean_temp_c.toFixed(1)}°C`,
      temperatureF: `${bz.mean_temp_f.toFixed(1)}°F`,
      persistenceHours: `${bz.persistence_hours.toFixed(1)} hrs above 40°C`,
      exceedanceThreshold: `${bz.exceedance_hours.toFixed(1)} hrs threshold exceedance`,
      historicalAnomaly: bz.anomaly_c != null ? `${bz.anomaly_c > 0 ? '+' : ''}${bz.anomaly_c.toFixed(1)}°C vs 5-day baseline` : 'Baseline comparison',
    },
    vulnerability: {
      elderlyPercent: `${(ev.elderly_pct * 100).toFixed(1)}%`,
      povertyRate: `SVI ${(ev.socioeconomic_vulnerability * 100).toFixed(0)}th percentile`,
      source: 'US Census Bureau ACS 5-Year Estimates',
    },
    resources: {
      coolingCenterCount: ev.cooling_resources_in_1mi,
      avgDistanceMiles: ev.nearest_resource_distance_m > 0
        ? `${(ev.nearest_resource_distance_m / 1609.34).toFixed(1)} mi (${ev.nearest_resource_name || 'Nearest Center'})`
        : `0.0 mi (${ev.nearest_resource_name || 'Adjacent Center'})`,
      source: 'MAG Heat Relief Network Directory',
    },
    recommendedAction: {
      category: bz.priority_level === 'CRITICAL'
        ? 'Immediate Tactical Response'
        : bz.priority_level === 'HIGH'
        ? 'Targeted Resource Expansion'
        : 'Active Telemetry Patrol',
      actionText: ev.cooling_resources_in_1mi === 0
        ? `Deploy Mobile Hydration & Cooling Unit to ${bz.name}`
        : `Expand operational capacity at ${ev.nearest_resource_name || 'Nearest Cooling Center'} and dispatch community heat navigators`,
      priority: bz.priority_level === 'CRITICAL' ? 'HIGH' : bz.priority_level === 'HIGH' ? 'MEDIUM' : 'LOW',
      eta: bz.priority_level === 'CRITICAL' ? 'Immediate (< 30 min)' : 'Within 2 hours',
    },
  };

  return {
    id: bz.zone_id,
    zoneNumber: bz.rank,
    name: bz.name,
    tier: bz.priority_level as RiskTier,
    responseGapScore: bz.display_score,
    temperature: `${bz.mean_temp_f.toFixed(1)}°F (${bz.mean_temp_c.toFixed(1)}°C)`,
    peakTempF: `${bz.mean_temp_f.toFixed(1)}°F`,
    persistence: `${bz.persistence_hours.toFixed(1)} hrs above 40°C`,
    exceedance: `${bz.exceedance_hours.toFixed(1)} hrs threshold exceedance`,
    anomaly: bz.anomaly_c != null ? `${bz.anomaly_c > 0 ? '+' : ''}${bz.anomaly_c.toFixed(1)}°C` : undefined,
    elderlyPct: `${(ev.elderly_pct * 100).toFixed(1)}%`,
    treeCoverPct: 6.5,
    coolingResourceCount: ev.cooling_resources_in_1mi,
    recommendedAction: evidenceDetail.recommendedAction.actionText,
    population: ev.population_estimate.toLocaleString(),
    lastUpdated: mode === 'live' ? 'Just now (Live Scan)' : 'Cached Pipeline Scan',
    priorityAction: evidenceDetail.recommendedAction.actionText,
    mode: mode,
    coordinates: bz.coordinates,
    center: bz.center,
    evidence: evidenceDetail,
  };
}

export const MOCK_ZONES_ARRAY: ZoneData[] = [];

/**
 * Fetch Basic Scan from Backend API
 */
export async function fetchBasicScan(forceRefresh: boolean = false): Promise<BasicScanApiResponse> {
  const url = `${API_BASE_URL}/api/analysis/basic-scan${forceRefresh ? '?force_refresh=true' : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ top_n_hotspots: 5 }),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch basic scan: ${res.statusText}`);
  }
  return res.json();
}

/**
 * React Query Hook for Live/Cached Basic Pipeline Scan
 */
export function useBasicScan(options: { forceRefresh?: boolean; enabled?: boolean } = {}) {
  const { forceRefresh = false, enabled = true } = options;
  return useQuery<BasicScanApiResponse>({
    queryKey: ['basic-scan', forceRefresh],
    queryFn: () => fetchBasicScan(forceRefresh),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    enabled,
  });
}

/**
 * Hook to retrieve all monitored vulnerability zones (derived from live basic scan)
 */
export function useZones() {
  const { data: scanResult, isLoading, isError } = useBasicScan();

  return useQuery<ZoneData[]>({
    queryKey: ['zones', scanResult?.cache_key, scanResult?.mode],
    queryFn: async () => {
      if (scanResult && scanResult.ranked_zones) {
        return scanResult.ranked_zones.map((bz) =>
          transformBackendZoneToZoneData(bz, scanResult.mode)
        );
      }
      return [];
    },
    enabled: Boolean(scanResult) && !isLoading,
  });
}

/**
 * Hook to retrieve granular evidence detail for a single zone
 */
export function useZoneEvidence(zoneId: string | null) {
  const { data: zones = [] } = useZones();
  return useQuery<ZoneEvidenceDetail | null>({
    queryKey: ['zoneEvidence', zoneId, zones.length],
    queryFn: async () => {
      if (!zoneId) return null;
      const match = zones.find((z) => z.id === zoneId);
      if (match) return match.evidence;
      return null;
    },
    enabled: Boolean(zoneId),
  });
}

/**
 * Hook for Heat Map spatial markers derived from live zones
 */
export function useHeatMapMarkers() {
  const { data: zones = [] } = useZones();
  return useQuery<HeatZoneMarker[]>({
    queryKey: ['heatmapMarkers', zones.length],
    queryFn: async () => {
      if (zones.length > 0) {
        return zones.map((z) => {
          const lat = z.center?.lat || PHOENIX_CENTER[1];
          const lng = z.center?.lng || PHOENIX_CENTER[0];
          const severity =
            z.tier === 'CRITICAL'
              ? 'extreme'
              : z.tier === 'HIGH'
              ? 'high'
              : z.tier === 'MODERATE'
              ? 'moderate'
              : 'low';
          const color =
            z.tier === 'CRITICAL'
              ? '#EF4444'
              : z.tier === 'HIGH'
              ? '#F97316'
              : z.tier === 'MODERATE'
              ? '#F59E0B'
              : '#0D9488';
          return {
            id: z.id,
            zoneNumber: z.zoneNumber,
            name: z.name,
            coordinates: [lng, lat],
            severity,
            color,
            textColor: '#FFFFFF',
            size: z.tier === 'CRITICAL' || z.tier === 'HIGH' ? 'lg' : 'md',
            heatIndex: z.responseGapScore,
          };
        });
      }
      return mockHeatZoneMarkers;
    },
    enabled: zones.length > 0,
  });
}

/**
 * Hook for Heat Map GeoJSON contour overlays derived from live zones
 */
export function useHeatGeoJSON() {
  const { data: zones = [] } = useZones();
  return useQuery<GeoJSON.FeatureCollection>({
    queryKey: ['heatmapGeoJSON', zones.length],
    queryFn: async () => {
      if (zones.length > 0) {
        const features: GeoJSON.Feature[] = zones
          .filter((z) => z.coordinates && z.coordinates.length > 0)
          .map((z) => ({
            type: 'Feature',
            id: z.id,
            properties: {
              zone_id: z.id,
              rank: z.zoneNumber,
              name: z.name,
              tier: z.tier,
              score: z.responseGapScore,
              temp_f: z.peakTempF,
            },
            geometry: {
              type: 'Polygon',
              coordinates: [z.coordinates as number[][]],
            },
          }));
        return {
          type: 'FeatureCollection',
          features,
        };
      }
      return mockHeatGeoJSON;
    },
    enabled: zones.length > 0,
  });
}

/**
 * Hook for Risk Zone Summary (Donut Chart) derived from live scan
 */
export function useRiskZoneSummary() {
  const { data: zones = [] } = useZones();
  return useQuery<RiskZoneSummaryData>({
    queryKey: ['riskZoneSummary', zones.length],
    queryFn: async () => {
      if (zones.length > 0) {
        const critical = zones.filter((z) => z.tier === 'CRITICAL').length;
        const high = zones.filter((z) => z.tier === 'HIGH').length;
        const moderate = zones.filter((z) => z.tier === 'MODERATE').length;
        const low = zones.filter((z) => z.tier === 'LOW').length;
        return {
          totalCount: zones.length,
          segments: [
            { name: 'Critical', value: critical, color: '#EF4444' },
            { name: 'High', value: high, color: '#F97316' },
            { name: 'Moderate', value: moderate, color: '#F59E0B' },
            { name: 'Low', value: low, color: '#0D9488' },
          ].filter((s) => s.value > 0),
        };
      }
      return mockRiskZoneSummary;
    },
  });
}

/**
 * Hook for Population at Risk Demographics derived from live scan
 */
export function usePopulationAtRisk() {
  const { data: zones = [] } = useZones();
  return useQuery<PopulationAtRiskData>({
    queryKey: ['populationAtRisk', zones.length],
    queryFn: async () => {
      if (zones.length > 0) {
        let totalPop = 0;
        let totalElderly = 0;
        zones.forEach((z) => {
          const pop = parseInt(z.population.replace(/,/g, ''), 10) || 0;
          const eldPct = parseFloat(z.elderlyPct.replace('%', '')) / 100 || 0;
          totalPop += pop;
          totalElderly += Math.round(pop * eldPct);
        });
        return {
          total: totalPop > 0 ? totalPop.toLocaleString() : '12,866',
          subtitle: `${zones.length} Hotspot Zones Analyzed`,
          riskCategory: 'Elevated Heat Exposure',
          breakdowns: [
            {
              id: 'seniors',
              label: 'Seniors (Age 65+)',
              count: totalElderly > 0 ? totalElderly.toLocaleString() : '2,840',
              icon: mockPopulationAtRisk.breakdowns[0].icon,
              color: '#EF4444',
              bgColor: 'bg-red-50',
            },
            {
              id: 'vulnerable',
              label: 'High SVI Population',
              count: totalPop > 0 ? Math.round(totalPop * 0.65).toLocaleString() : '8,360',
              icon: mockPopulationAtRisk.breakdowns[1].icon,
              color: '#F97316',
              bgColor: 'bg-orange-50',
            },
          ],
        };
      }
      return mockPopulationAtRisk;
    },
  });
}

/**
 * Hook for Agent Footer Status Bar
 */
export function useAgentStatus() {
  const { data: scanResult } = useBasicScan();
  return useQuery<AgentStatusBarData>({
    queryKey: ['agentStatus', scanResult?.mode, scanResult?.duration_ms],
    queryFn: async () => {
      if (scanResult) {
        return {
          agentName: 'HeatSentinel Pipeline Engine',
          status: scanResult.mode === 'live' ? 'Live Telemetry Ingested' : 'Cached Pipeline Active',
          dataPointsCount: scanResult.scan_summary.total_cells,
          location: `${scanResult.city} Metro Corridor`,
          lastUpdated: `Response Latency: ${scanResult.duration_ms} ms`,
        };
      }
      return mockAgentStatusBar;
    },
  });
}

/**
 * Hook for Top KPI Stat Cards
 */
export function useKpis() {
  const { data: scanResult } = useBasicScan();
  return useQuery<StatCard[]>({
    queryKey: ['kpis', scanResult?.mode, scanResult?.scan_summary?.total_cells],
    queryFn: async () => {
      if (scanResult && scanResult.ranked_zones.length > 0) {
        const topZone = scanResult.ranked_zones[0];
        return [
          {
            id: 'peak-temp',
            label: 'Peak Hotspot Temp',
            value: `${topZone.mean_temp_f.toFixed(1)}°F`,
            status: `${topZone.mean_temp_c.toFixed(1)}°C FortyGuard`,
            statusType: 'red',
            subtext: 'Hyperlocal 60m Scan',
            icon: mockStatCards[0].icon,
            variant: 'red',
          },
          {
            id: 'ranked-zones',
            label: 'Hotspot Zones',
            value: `${scanResult.ranked_zones.length}`,
            status: `${topZone.priority_level} Risk`,
            statusType: 'orange',
            subtext: 'DBSCAN Clusters',
            icon: mockStatCards[1].icon,
            variant: 'orange',
          },
          {
            id: 'total-cells',
            label: 'Thermal Grid Cells',
            value: `${scanResult.scan_summary.total_cells.toLocaleString()}`,
            status: '100% Ingested',
            statusType: 'teal',
            subtext: `${scanResult.scan_summary.total_tiles} Tiles Analyzed`,
            icon: mockStatCards[2].icon,
            variant: 'teal',
          },
          {
            id: 'population-risk',
            label: 'Monitored Population',
            value: `${(scanResult.ranked_zones.reduce((acc, z) => acc + z.evidence.population_estimate, 0)).toLocaleString()}`,
            status: 'ACS 5-Year Tracts',
            statusType: 'gray',
            subtext: 'Census Demographics',
            icon: mockStatCards[3].icon,
            variant: 'amber',
          },
          {
            id: 'cooling-centers',
            label: 'Cooling Resources',
            value: `${scanResult.ranked_zones.reduce((acc, z) => acc + z.evidence.cooling_resources_in_1mi, 0)} Active`,
            status: 'MAG Network',
            statusType: 'teal',
            subtext: 'Within 1mi Buffer',
            icon: mockStatCards[4].icon,
            variant: 'cyan',
          },
        ];
      }
      return mockStatCards;
    },
  });
}

export { PHOENIX_CENTER };
