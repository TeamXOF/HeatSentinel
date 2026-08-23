import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertItem, AlertSeverity } from '../types';
import { mockActiveAlerts } from '../data/mockRightRailData';

export interface FullAlertItem {
  id: string;
  title: string;
  category: 'Critical' | 'Warning' | 'Info';
  zoneId: string;
  zoneName: string;
  timestamp: string;
  timeAgo: string;
  description: string;
  mitigation: string;
  acknowledged: boolean;
  severity: AlertSeverity;
}

export const MOCK_FULL_ALERTS_FEED: FullAlertItem[] = [
  {
    id: 'evt-1',
    title: 'Extreme Heat Index Surge (>115°F Heat Index)',
    category: 'Critical',
    severity: 'extreme',
    zoneId: 'zone-7',
    zoneName: 'Central Phoenix Corridor (Zone 7)',
    timestamp: 'Today, 10:30 AM',
    timeAgo: '15 mins ago',
    description: 'Ambient surface thermal scan indicates sustained temps above 114.1°F across Van Buren transit hub with dense pedestrian volume.',
    mitigation: 'Dispatch Mobile Cooling Unit #3 and deploy hydration misting canopy immediately.',
    acknowledged: false,
  },
  {
    id: 'evt-2',
    title: 'Thermal Anomaly Threshold Exceeded (+6.2°F Delta)',
    category: 'Critical',
    severity: 'extreme',
    zoneId: 'zone-5',
    zoneName: 'South Mountain Area (Zone 5)',
    timestamp: 'Today, 09:45 AM',
    timeAgo: '1 hr ago',
    description: 'Localized heat retention in industrial asphalt corridor exceeding 4-hour persistence limit.',
    mitigation: 'Expand Baseline Road water distribution post to maximum 400 gal/hr capacity.',
    acknowledged: false,
  },
  {
    id: 'evt-3',
    title: 'Cooling Center Capacity Nearing 85%',
    category: 'Warning',
    severity: 'warning',
    zoneId: 'zone-3',
    zoneName: 'Eastlake / Garfield (Zone 3)',
    timestamp: 'Today, 09:15 AM',
    timeAgo: '1.5 hrs ago',
    description: 'Eastlake Community Center at 86% occupancy. Secondary shelter activation recommended if influx continues.',
    mitigation: 'Notify Maricopa County Heat Relief coordinators for auxiliary cot and water staging.',
    acknowledged: true,
  },
  {
    id: 'evt-4',
    title: 'Hydration Outpost Pressure Drop',
    category: 'Warning',
    severity: 'warning',
    zoneId: 'zone-8',
    zoneName: 'Maryvale Urban Core (Zone 8)',
    timestamp: 'Today, 08:30 AM',
    timeAgo: '2 hrs ago',
    description: 'Automated telemetry flagged reduced line flow at 51st Ave public dispenser node.',
    mitigation: 'Field maintenance crew dispatched with emergency bottle crates (ETA 20m).',
    acknowledged: true,
  },
  {
    id: 'evt-5',
    title: 'New Community Misting Hub Operational',
    category: 'Info',
    severity: 'info',
    zoneId: 'zone-2',
    zoneName: 'Camelback Corridor (Zone 2)',
    timestamp: 'Today, 08:00 AM',
    timeAgo: '2.5 hrs ago',
    description: 'Public shade structure and high-pressure evaporative mister connected at 16th St & Camelback.',
    mitigation: 'Public resource map and GIS directory updated successfully.',
    acknowledged: true,
  },
  {
    id: 'evt-6',
    title: 'Daily NOAA Heat Hazard Outlook Issued',
    category: 'Info',
    severity: 'info',
    zoneId: 'zone-all',
    zoneName: 'Maricopa County Regional Grid',
    timestamp: 'Today, 06:00 AM',
    timeAgo: '4.5 hrs ago',
    description: 'Excessive Heat Warning in effect from 10:00 AM MST through 8:00 PM MST. Overnight lows projected at 91°F.',
    mitigation: 'Activate standard Tier-2 municipal heat emergency protocols.',
    acknowledged: true,
  },
];

/**
 * Hook to retrieve active alerts for Overview page right-rail.
 * Derives alerts from the live basic scan ranked zones — no separate endpoint needed.
 */
export function useActiveAlerts() {
  return useQuery<AlertItem[]>({
    queryKey: ['activeAlerts'],
    queryFn: async () => {
      try {
        const scan = await import('./analysis').then((m) => m.fetchBasicScan(false));
        const zones = (scan as any).ranked_zones ?? [];
        if (zones.length === 0) return mockActiveAlerts;
        const now = new Date();
        const fmt = (d: Date) =>
          d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const alerts: AlertItem[] = [];
        zones.forEach((z: any, i: number) => {
          const tier = z.priority_level as string;
          const tempF = z.mean_temp_f?.toFixed(1) ?? '?';
          const tempC = z.mean_temp_c?.toFixed(1) ?? '?';
          if (tier === 'CRITICAL' || tier === 'HIGH') {
            alerts.push({
              id: `alert-live-${z.zone_id}`,
              title: tier === 'CRITICAL' ? 'Extreme Heat Warning' : 'Heat Risk Elevated',
              description: `${z.name}: ${tempF}°F (${tempC}°C) — ${tier} Priority`,
              timestamp: `Today, ${fmt(new Date(now.getTime() - i * 20 * 60000))}`,
              severity: tier === 'CRITICAL' ? 'extreme' : 'warning',
            });
          }
        });
        // Always append a system info alert
        alerts.push({
          id: 'alert-system',
          title: 'FortyGuard Thermal Scan Complete',
          description: `${zones.length} zone${zones.length !== 1 ? 's' : ''} ranked · ${(scan as any).scan_summary?.total_cells?.toLocaleString() ?? '?'} cells ingested`,
          timestamp: `Today, ${fmt(now)}`,
          severity: 'info',
        });
        return alerts.length > 1 ? alerts : mockActiveAlerts;
      } catch {
        return mockActiveAlerts;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to retrieve full events feed with stateful acknowledge interactions
 */
export function useAlerts() {
  const [localAlerts, setLocalAlerts] = useState<FullAlertItem[]>(MOCK_FULL_ALERTS_FEED);

  const query = useQuery<FullAlertItem[]>({
    queryKey: ['alertsFeed'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return localAlerts;
      }
      return apiFetch<FullAlertItem[]>('/api/alerts');
    },
    initialData: localAlerts,
  });

  const toggleAcknowledge = useCallback((id: string) => {
    setLocalAlerts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, acknowledged: !item.acknowledged } : item))
    );
  }, []);

  const acknowledgeAll = useCallback(() => {
    setLocalAlerts((prev) => prev.map((item) => ({ ...item, acknowledged: true })));
  }, []);

  return {
    ...query,
    alerts: localAlerts,
    toggleAcknowledge,
    acknowledgeAll,
  };
}
