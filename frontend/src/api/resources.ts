import { useQuery } from '@tanstack/react-query';
import { USE_MOCK_DATA, apiFetch } from './config';
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
 */
export function useResources() {
  return useQuery<ResourceItem[]>({
    queryKey: ['resourcesList'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return MOCK_RESOURCES_LIST;
      }
      return apiFetch<ResourceItem[]>('/api/resources');
    },
  });
}

/**
 * Hook to retrieve resource readiness score and facility breakdown
 */
export function useResourceReadiness() {
  return useQuery<ResourceReadinessData>({
    queryKey: ['resourceReadiness'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockResourceReadiness;
      }
      return apiFetch<ResourceReadinessData>('/api/resources/readiness');
    },
  });
}
