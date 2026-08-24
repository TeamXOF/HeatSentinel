import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PriorityAction } from '../types';
import { mockPriorityActions } from '../data/mockRightRailData';
import { USE_MOCK_DATA, apiFetch } from './config';

export interface TacticalAction {
  id: string;
  stepNumber: number;
  title: string;
  category: 'Rapid Deployment' | 'Water Infrastructure' | 'Community Outreach' | 'Medical Staging';
  zoneId: string;
  zoneName: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  assignedTeam: string;
  eta: string;
  impactScore: string;
  description: string;
  status: 'Pending Dispatch' | 'In Route' | 'Deployed';
}

export const MOCK_TACTICAL_PLAN: TacticalAction[] = [
  {
    id: 'plan-1',
    stepNumber: 1,
    title: 'Deploy Mobile Cooling Unit #3 to Central Transit Hub',
    category: 'Rapid Deployment',
    zoneId: 'zone-7',
    zoneName: 'Central Phoenix Corridor (Zone 7)',
    priority: 'CRITICAL',
    assignedTeam: 'Field Operations Unit 4',
    eta: '15 min response window',
    impactScore: 'Protects ~1,200 exposed commuters',
    description: 'Establish air-conditioned mobile trailer and high-velocity evaporative misting canopies at Central & Van Buren intersection.',
    status: 'Pending Dispatch',
  },
  {
    id: 'plan-2',
    stepNumber: 2,
    title: 'Expand Water Station Distribution at Baseline & 24th St',
    category: 'Water Infrastructure',
    zoneId: 'zone-5',
    zoneName: 'South Mountain Area (Zone 5)',
    priority: 'HIGH',
    assignedTeam: 'Maricopa Water Logistics',
    eta: '30 min response window',
    impactScore: '+400 gal/hr potable capacity',
    description: 'Deploy secondary chilled dispenser manifold and restock electrolyte supply crates for field distribution.',
    status: 'Pending Dispatch',
  },
  {
    id: 'plan-3',
    stepNumber: 3,
    title: 'Initiate Multilingual Targeted SMS & Health Navigator Patrols',
    category: 'Community Outreach',
    zoneId: 'zone-3',
    zoneName: 'Eastlake / Garfield District (Zone 3)',
    priority: 'HIGH',
    assignedTeam: 'Community Health Navigators',
    eta: '45 min window',
    impactScore: '3,400 vulnerable households reached',
    description: 'Dispatch Spanish/English outreach teams to perform wellness checks across senior living residences.',
    status: 'Pending Dispatch',
  },
  {
    id: 'plan-4',
    stepNumber: 4,
    title: 'Stage Paramedic Heat-Strike Response Vehicle Alpha',
    category: 'Medical Staging',
    zoneId: 'zone-8',
    zoneName: 'Maryvale Urban Core (Zone 8)',
    priority: 'MEDIUM',
    assignedTeam: 'Valleywise Mobile EMS',
    eta: '60 min window',
    impactScore: 'Under 4 min triage arrival time',
    description: 'Pre-position cold-water immersion bags and rapid IV hydration supplies near community athletic parks.',
    status: 'Pending Dispatch',
  },
];

/**
 * Hook to retrieve top priority actions for overview right-rail.
 * Derives actions from the live basic scan ranked zones — no separate endpoint needed.
 */
export function usePriorityActions() {
  return useQuery<PriorityAction[]>({
    queryKey: ['priorityActions'],
    queryFn: async () => {
      try {
        const scan = await import('./analysis').then((m) => m.fetchBasicScan(false));
        const zones = (scan as any).ranked_zones ?? [];
        if (zones.length === 0) return mockPriorityActions;
        const actions: PriorityAction[] = zones.map((z: any, i: number) => {
          const tier = z.priority_level as string;
          const ev = z.evidence ?? {};
          const resources = ev.cooling_resources_in_1mi ?? 0;
          let title = '';
          let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
          if (tier === 'CRITICAL') {
            title = `Deploy Mobile Cooling Unit to ${z.name}`;
            priority = 'Critical';
          } else if (tier === 'HIGH') {
            title = resources === 0
              ? `Establish Hydration Point near ${z.name}`
              : `Expand ${ev.nearest_resource_name || 'Cooling Center'} Capacity`;
            priority = 'High';
          } else {
            title = `Initiate Active Monitoring for ${z.name}`;
            priority = 'Medium';
          }
          return {
            id: `action-live-${z.zone_id}`,
            stepNumber: i + 1,
            title,
            subtitle: z.name,
            priority,
          };
        });
        return actions;
      } catch {
        return mockPriorityActions;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for Tactical Response Planner with dispatch state mutations
 */
export function useTacticalPlanner() {
  const [actions, setActions] = useState<TacticalAction[]>(MOCK_TACTICAL_PLAN);

  const query = useQuery<TacticalAction[]>({
    queryKey: ['tacticalPlan'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return actions;
      }
      return apiFetch<TacticalAction[]>('/api/actions/tactical-plan');
    },
    initialData: actions,
  });

  const dispatchAction = useCallback((id: string) => {
    setActions((prev) =>
      prev.map((act) => {
        if (act.id === id) {
          const nextStatus = act.status === 'Pending Dispatch' ? 'In Route' : 'Deployed';
          return { ...act, status: nextStatus };
        }
        return act;
      })
    );
  }, []);

  const dispatchAll = useCallback(() => {
    setActions((prev) => prev.map((a) => ({ ...a, status: 'In Route' })));
  }, []);

  return {
    ...query,
    actions,
    dispatchAction,
    dispatchAll,
  };
}
