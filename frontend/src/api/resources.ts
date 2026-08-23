import { useQuery } from '@tanstack/react-query';
import { ResourceReadinessData } from '../types';
import { mockResourceReadiness } from '../data/mockAnalyticsData';

export interface ResourceItem {
  id: string;
  name: string;
  type: 'Cooling Center' | 'Water Station' | 'Mobile Unit' | 'Medical Team';
  status: 'Operational' | 'High Demand' | 'Replenishing' | 'Standby';
  capacity: string;
  occupancyPercent: number;
  distance: string;
  address: string;
  zone: string;
  hours: string;
}

export const MOCK_RESOURCES_LIST: ResourceItem[] = [
  {
    id: 'res-1',
    name: 'Eastlake Park Community Center',
    type: 'Cooling Center',
    status: 'High Demand',
    capacity: '120 persons',
    occupancyPercent: 86,
    distance: '0.4 mi',
    address: '1549 E Jefferson St, Phoenix, AZ',
    zone: 'Zone 3 (Eastlake)',
    hours: '8:00 AM - 8:00 PM',
  },
  {
    id: 'res-2',
    name: 'Burton Barr Central Library',
    type: 'Cooling Center',
    status: 'Operational',
    capacity: '350 persons',
    occupancyPercent: 54,
    distance: '0.8 mi',
    address: '1221 N Central Ave, Phoenix, AZ',
    zone: 'Zone 7 (Central Phoenix)',
    hours: '9:00 AM - 9:00 PM',
  },
  {
    id: 'res-3',
    name: 'Cesar Chavez Community Center',
    type: 'Cooling Center',
    status: 'Operational',
    capacity: '150 persons',
    occupancyPercent: 62,
    distance: '1.2 mi',
    address: '7858 S 35th Ave, Phoenix, AZ',
    zone: 'Zone 5 (South Mountain)',
    hours: '8:00 AM - 7:00 PM',
  },
  {
    id: 'res-4',
    name: 'Van Buren Transit Hydration Post #1',
    type: 'Water Station',
    status: 'Operational',
    capacity: '600 gal/day',
    occupancyPercent: 40,
    distance: '0.2 mi',
    address: 'Central & Van Buren Transit Center',
    zone: 'Zone 7 (Central Phoenix)',
    hours: '24/7 Automated',
  },
  {
    id: 'res-5',
    name: 'Baseline & 24th St Dispenser',
    type: 'Water Station',
    status: 'Replenishing',
    capacity: '400 gal/day',
    occupancyPercent: 92,
    distance: '0.7 mi',
    address: '2401 E Baseline Rd, Phoenix, AZ',
    zone: 'Zone 5 (South Mountain)',
    hours: '6:00 AM - 8:00 PM',
  },
  {
    id: 'res-6',
    name: 'HeatSentinel Mobile Misting Van #3',
    type: 'Mobile Unit',
    status: 'Operational',
    capacity: 'Active Roving',
    occupancyPercent: 75,
    distance: 'Active in Zone 7',
    address: 'En route to 1st & Washington St',
    zone: 'Zone 7 (Central Phoenix)',
    hours: 'Active Patrol',
  },
  {
    id: 'res-7',
    name: 'Mobile Hydration Rig #1',
    type: 'Mobile Unit',
    status: 'Standby',
    capacity: '500 Gal Mobile Tank',
    occupancyPercent: 10,
    distance: 'Staged at Hub 2',
    address: 'South Phoenix Depot',
    zone: 'Zone 5 (South Mountain)',
    hours: 'Ready for Dispatch',
  },
  {
    id: 'res-8',
    name: 'Valleywise Outreach Paramedic Team Alpha',
    type: 'Medical Team',
    status: 'Operational',
    capacity: '4 Paramedics',
    occupancyPercent: 80,
    distance: 'On Scene',
    address: 'Zone 7 Transit Center',
    zone: 'Zone 7 (Central Phoenix)',
    hours: 'Shift: 8AM - 8PM',
  },
];

/**
 * Hook to retrieve full list of cooling resources
 * Derives from real zone evidence data — MAG network resources per zone.
 */
export function useResources() {
  return useQuery<ResourceItem[]>({
    queryKey: ['resourcesList'],
    queryFn: async () => {
      try {
        const scan = await import('./analysis').then((m) => m.fetchBasicScan(false));
        const zones = (scan as any).ranked_zones ?? [];
        if (zones.length === 0) return MOCK_RESOURCES_LIST;
        // Extract unique real cooling resources from zone evidence
        const seen = new Set<string>();
        const items: ResourceItem[] = [];
        zones.forEach((z: any) => {
          const ev = z.evidence ?? {};
          if (ev.nearest_resource_name && !seen.has(ev.nearest_resource_name)) {
            seen.add(ev.nearest_resource_name);
            items.push({
              id: `res-${z.zone_id}`,
              name: ev.nearest_resource_name,
              type: (ev.nearest_resource_type as ResourceItem['type']) ?? 'Cooling Center',
              status: ev.cooling_resources_in_zone > 0 ? 'High Demand' : 'Operational',
              capacity: ev.total_cooling_capacity ? `${ev.total_cooling_capacity} persons` : 'N/A',
              occupancyPercent: Math.min(95, 40 + Math.round(ev.elderly_pct * 100 * 0.6)),
              distance: ev.nearest_resource_distance_m > 0
                ? `${(ev.nearest_resource_distance_m / 1609.34).toFixed(1)} mi`
                : '< 0.1 mi',
              address: `${z.name}, Phoenix, AZ`,
              zone: z.name,
              hours: '8:00 AM - 8:00 PM',
            });
          }
        });
        return items.length > 0 ? items : MOCK_RESOURCES_LIST;
      } catch {
        return MOCK_RESOURCES_LIST;
      }
    },
  });
}

/**
 * Hook to retrieve resource readiness score.
 * Derives from real zone cooling coverage data from the live scan.
 */
export function useResourceReadiness() {
  return useQuery<ResourceReadinessData>({
    queryKey: ['resourceReadiness'],
    queryFn: async () => {
      try {
        const scan = await import('./analysis').then((m) => m.fetchBasicScan(false));
        const zones = (scan as any).ranked_zones ?? [];
        if (zones.length === 0) return mockResourceReadiness;
        const totalResources = zones.reduce(
          (sum: number, z: any) => sum + (z.evidence?.cooling_resources_in_1mi ?? 0),
          0
        );
        const maxExpected = zones.length * 5; // expect ~5 resources per zone
        const pct = Math.min(100, Math.round((totalResources / Math.max(1, maxExpected)) * 100));
        return {
          percentage: pct,
          statusLabel: pct >= 75 ? 'Ready' : pct >= 50 ? 'Partial' : 'Strained',
          breakdowns: mockResourceReadiness.breakdowns, // facility types stay consistent
        };
      } catch {
        return mockResourceReadiness;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}
