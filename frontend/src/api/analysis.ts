import { useQuery } from '@tanstack/react-query';
import { USE_MOCK_DATA, apiFetch } from './config';
import {
  ZoneEvidenceDetail,
  RiskTier,
  DataMode,
  HeatZoneMarker,
  RiskZoneSummaryData,
  PopulationAtRiskData,
  AgentStatusBarData,
  StatCard,
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
 * Standard Zone Data Schema required by HeatSentinel API
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
  evidence: ZoneEvidenceDetail;
}

export const MOCK_ZONES_ARRAY: ZoneData[] = [
  {
    id: 'zone-7',
    zoneNumber: 7,
    name: 'Central Phoenix Corridor',
    tier: 'CRITICAL',
    responseGapScore: 8.7,
    temperature: '114.1°F (45.6°C)',
    peakTempF: '114.1°F',
    persistence: '> 5.5 hrs above 40°C',
    exceedance: '+6.2°F over urban baseline',
    anomaly: '+3.8°C vs 30-yr norm',
    elderlyPct: '28.4%',
    treeCoverPct: 4.2,
    coolingResourceCount: 1,
    recommendedAction: 'Deploy Mobile Cooling Unit #3 to Central Transit Hub',
    population: '28,400',
    lastUpdated: '3 mins ago',
    priorityAction: 'Deploy Mobile Cooling Unit #3',
    mode: 'demo',
    evidence: mockZoneEvidenceData['zone-7'] || getEvidenceForZone('zone-7'),
  },
  {
    id: 'zone-5',
    zoneNumber: 5,
    name: 'South Mountain Area',
    tier: 'HIGH',
    responseGapScore: 7.4,
    temperature: '111.0°F (43.9°C)',
    peakTempF: '111.0°F',
    persistence: '4.2 hrs above 40°C',
    exceedance: '+3.5°F over urban baseline',
    anomaly: '+2.1°C vs 30-yr norm',
    elderlyPct: '22.6%',
    treeCoverPct: 6.8,
    coolingResourceCount: 2,
    recommendedAction: 'Expand Baseline Road & 24th St hydration post capacity',
    population: '34,200',
    lastUpdated: '8 mins ago',
    priorityAction: 'Expand Water Station #4',
    mode: 'demo',
    evidence: mockZoneEvidenceData['zone-5'] || getEvidenceForZone('zone-5'),
  },
  {
    id: 'zone-3',
    zoneNumber: 3,
    name: 'Eastlake / Garfield District',
    tier: 'HIGH',
    responseGapScore: 7.1,
    temperature: '110.0°F (43.3°C)',
    peakTempF: '110.0°F',
    persistence: '3.8 hrs above 40°C',
    exceedance: '+2.9°F over urban baseline',
    anomaly: '+1.9°C vs 30-yr norm',
    elderlyPct: '24.1%',
    treeCoverPct: 8.1,
    coolingResourceCount: 3,
    recommendedAction: 'Dispatch community heat navigators for wellness checks',
    population: '19,800',
    lastUpdated: '12 mins ago',
    priorityAction: 'Community Alert Dispatch',
    mode: 'demo',
    evidence: mockZoneEvidenceData['zone-3'] || getEvidenceForZone('zone-3'),
  },
  {
    id: 'zone-8',
    zoneNumber: 8,
    name: 'Maryvale Urban Core',
    tier: 'HIGH',
    responseGapScore: 6.9,
    temperature: '109.5°F (43.1°C)',
    peakTempF: '109.5°F',
    persistence: '3.5 hrs above 40°C',
    exceedance: '+2.4°F over urban baseline',
    anomaly: '+1.5°C vs norm',
    elderlyPct: '21.0%',
    treeCoverPct: 5.5,
    coolingResourceCount: 2,
    recommendedAction: 'Deploy emergency misting canopy at 51st Ave dispenser',
    population: '42,100',
    lastUpdated: '15 mins ago',
    priorityAction: 'Hydration Outpost Setup',
    mode: 'demo',
    evidence: mockZoneEvidenceData['zone-8'] || getEvidenceForZone('zone-8'),
  },
  {
    id: 'zone-2',
    zoneNumber: 2,
    name: 'Camelback Corridor',
    tier: 'MODERATE',
    responseGapScore: 5.2,
    temperature: '106.0°F (41.1°C)',
    peakTempF: '106.0°F',
    persistence: '2.1 hrs above 40°C',
    exceedance: '+1.2°F over urban baseline',
    anomaly: undefined,
    elderlyPct: '16.5%',
    treeCoverPct: 14.5,
    coolingResourceCount: 4,
    recommendedAction: 'Maintain routine patrol and outreach coverage',
    population: '22,600',
    lastUpdated: '22 mins ago',
    priorityAction: 'Routine Patrol & Outreach',
    mode: 'demo',
    evidence: mockZoneEvidenceData['zone-2'] || getEvidenceForZone('zone-2'),
  },
  {
    id: 'zone-4',
    zoneNumber: 4,
    name: 'Encanto / Midtown',
    tier: 'MODERATE',
    responseGapScore: 4.8,
    temperature: '105.2°F (40.7°C)',
    peakTempF: '105.2°F',
    persistence: '1.9 hrs above 40°C',
    exceedance: '+0.8°F over urban baseline',
    anomaly: undefined,
    elderlyPct: '15.2%',
    treeCoverPct: 12.0,
    coolingResourceCount: 3,
    recommendedAction: 'Monitor transit node ridership during afternoon peak',
    population: '18,300',
    lastUpdated: '30 mins ago',
    priorityAction: 'Monitor Transit Nodes',
    mode: 'demo',
    evidence: mockZoneEvidenceData['zone-4'] || getEvidenceForZone('zone-4'),
  },
  {
    id: 'zone-1',
    zoneNumber: 1,
    name: 'North Mountain Foothills',
    tier: 'LOW',
    responseGapScore: 2.8,
    temperature: '102.4°F (39.1°C)',
    peakTempF: '102.4°F',
    persistence: '< 1 hr above 40°C',
    exceedance: 'Baseline normal',
    anomaly: '-0.4°C vs norm',
    elderlyPct: '14.8%',
    treeCoverPct: 21.0,
    coolingResourceCount: 5,
    recommendedAction: 'Maintain standard municipal baseline protocols',
    population: '16,700',
    lastUpdated: '45 mins ago',
    priorityAction: 'Maintain Baseline Protocol',
    mode: 'demo',
    evidence: mockZoneEvidenceData['zone-1'] || getEvidenceForZone('zone-1'),
  },
  {
    id: 'zone-6',
    zoneNumber: 6,
    name: 'Deer Valley Tech Park',
    tier: 'LOW',
    responseGapScore: 2.1,
    temperature: '101.8°F (38.8°C)',
    peakTempF: '101.8°F',
    persistence: '< 1 hr above 40°C',
    exceedance: 'Baseline normal',
    anomaly: undefined,
    elderlyPct: '11.3%',
    treeCoverPct: 18.4,
    coolingResourceCount: 4,
    recommendedAction: 'Standard automated telemetry watch',
    population: '12,900',
    lastUpdated: '1 hour ago',
    priorityAction: 'Standard Telemetry Watch',
    mode: 'demo',
    evidence: mockZoneEvidenceData['zone-6'] || getEvidenceForZone('zone-6'),
  },
];

/**
 * Hook to retrieve all monitored vulnerability zones
 */
export function useZones() {
  return useQuery<ZoneData[]>({
    queryKey: ['zones'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return MOCK_ZONES_ARRAY;
      }
      return apiFetch<ZoneData[]>('/api/zones');
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to retrieve granular evidence detail for a single zone
 */
export function useZoneEvidence(zoneId: string | null) {
  return useQuery<ZoneEvidenceDetail | null>({
    queryKey: ['zoneEvidence', zoneId],
    queryFn: async () => {
      if (!zoneId) return null;
      if (USE_MOCK_DATA) {
        return getEvidenceForZone(zoneId);
      }
      return apiFetch<ZoneEvidenceDetail>(`/api/zones/${zoneId}/evidence`);
    },
    enabled: Boolean(zoneId),
  });
}

/**
 * Hook for Heat Map spatial markers
 */
export function useHeatMapMarkers() {
  return useQuery<HeatZoneMarker[]>({
    queryKey: ['heatmapMarkers'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockHeatZoneMarkers;
      }
      return apiFetch<HeatZoneMarker[]>('/api/heatmap/markers');
    },
  });
}

/**
 * Hook for Heat Map GeoJSON contour overlays
 */
export function useHeatGeoJSON() {
  return useQuery<GeoJSON.FeatureCollection>({
    queryKey: ['heatmapGeoJSON'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockHeatGeoJSON;
      }
      return apiFetch<GeoJSON.FeatureCollection>('/api/heatmap/geojson');
    },
  });
}

/**
 * Hook for Risk Zone Summary (Donut Chart)
 */
export function useRiskZoneSummary() {
  return useQuery<RiskZoneSummaryData>({
    queryKey: ['riskZoneSummary'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockRiskZoneSummary;
      }
      return apiFetch<RiskZoneSummaryData>('/api/analytics/risk-summary');
    },
  });
}

/**
 * Hook for Population at Risk Demographics
 */
export function usePopulationAtRisk() {
  return useQuery<PopulationAtRiskData>({
    queryKey: ['populationAtRisk'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockPopulationAtRisk;
      }
      return apiFetch<PopulationAtRiskData>('/api/analytics/population-risk');
    },
  });
}

/**
 * Hook for Agent Footer Status Bar
 */
export function useAgentStatus() {
  return useQuery<AgentStatusBarData>({
    queryKey: ['agentStatus'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockAgentStatusBar;
      }
      return apiFetch<AgentStatusBarData>('/api/agent/status');
    },
  });
}

/**
 * Hook for Top KPI Stat Cards
 */
export function useKpis() {
  return useQuery<StatCard[]>({
    queryKey: ['kpis'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockStatCards;
      }
      return apiFetch<StatCard[]>('/api/analytics/kpis');
    },
  });
}

export { PHOENIX_CENTER };
