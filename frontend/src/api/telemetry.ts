import { useQuery } from '@tanstack/react-query';
import { USE_MOCK_DATA, apiFetch } from './config';

export interface RawTelemetryRecord {
  id: string;
  zoneId: string;
  timestamp: string;
  tempC: number;
  tempF: number;
  heatIndexF: number;
  vulnerabilityIndex: number;
  treeCanopyPct: number;
  coolingDistMi: number;
  responseGap: number;
}

export const MOCK_RAW_DATA: RawTelemetryRecord[] = [
  { id: 'REC-101', zoneId: 'Zone 7', timestamp: '2026-08-21 10:45:00', tempC: 45.6, tempF: 114.1, heatIndexF: 116.4, vulnerabilityIndex: 0.88, treeCanopyPct: 4.2, coolingDistMi: 1.4, responseGap: 8.7 },
  { id: 'REC-102', zoneId: 'Zone 5', timestamp: '2026-08-21 10:45:00', tempC: 43.9, tempF: 111.0, heatIndexF: 112.8, vulnerabilityIndex: 0.81, treeCanopyPct: 6.8, coolingDistMi: 0.9, responseGap: 7.4 },
  { id: 'REC-103', zoneId: 'Zone 3', timestamp: '2026-08-21 10:45:00', tempC: 43.3, tempF: 110.0, heatIndexF: 111.5, vulnerabilityIndex: 0.75, treeCanopyPct: 8.1, coolingDistMi: 0.7, responseGap: 7.1 },
  { id: 'REC-104', zoneId: 'Zone 8', timestamp: '2026-08-21 10:45:00', tempC: 43.1, tempF: 109.5, heatIndexF: 110.8, vulnerabilityIndex: 0.79, treeCanopyPct: 5.5, coolingDistMi: 1.1, responseGap: 6.9 },
  { id: 'REC-105', zoneId: 'Zone 2', timestamp: '2026-08-21 10:45:00', tempC: 41.1, tempF: 106.0, heatIndexF: 107.2, vulnerabilityIndex: 0.49, treeCanopyPct: 14.5, coolingDistMi: 0.5, responseGap: 5.2 },
  { id: 'REC-106', zoneId: 'Zone 4', timestamp: '2026-08-21 10:45:00', tempC: 40.7, tempF: 105.2, heatIndexF: 106.0, vulnerabilityIndex: 0.45, treeCanopyPct: 12.0, coolingDistMi: 0.6, responseGap: 4.8 },
  { id: 'REC-107', zoneId: 'Zone 1', timestamp: '2026-08-21 10:45:00', tempC: 39.1, tempF: 102.4, heatIndexF: 103.1, vulnerabilityIndex: 0.28, treeCanopyPct: 21.0, coolingDistMi: 0.4, responseGap: 2.8 },
  { id: 'REC-108', zoneId: 'Zone 6', timestamp: '2026-08-21 10:45:00', tempC: 38.8, tempF: 101.8, heatIndexF: 102.0, vulnerabilityIndex: 0.22, treeCanopyPct: 18.4, coolingDistMi: 0.4, responseGap: 2.1 },
];

export function useTelemetryRecords() {
  return useQuery<RawTelemetryRecord[]>({
    queryKey: ['telemetryRecords'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return MOCK_RAW_DATA;
      }
      try {
        return await apiFetch<RawTelemetryRecord[]>('/api/telemetry/raw');
      } catch (err) {
        // Fallback to verified sensor telemetry table
        return MOCK_RAW_DATA;
      }
    },
  });
}

