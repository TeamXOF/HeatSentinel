import { AlertItem, PriorityAction } from '../types';

export const mockActiveAlerts: AlertItem[] = [
  {
    id: 'alert-1',
    title: 'Extreme Heat Warning',
    description: 'Central Phoenix',
    timestamp: 'Today, 10:30 AM',
    severity: 'extreme',
  },
  {
    id: 'alert-2',
    title: 'Heat Risk Increased',
    description: 'South Mountain Area',
    timestamp: 'Today, 09:15 AM',
    severity: 'warning',
  },
  {
    id: 'alert-3',
    title: 'Cooling Center Update',
    description: 'New center operational',
    timestamp: 'Today, 08:45 AM',
    severity: 'info',
  },
];

export const mockPriorityActions: PriorityAction[] = [
  {
    id: 'action-1',
    stepNumber: 1,
    title: 'Deploy Mobile Cooling Unit',
    subtitle: 'Central Phoenix (Zone 7)',
    priority: 'High',
  },
  {
    id: 'action-2',
    stepNumber: 2,
    title: 'Expand Water Station',
    subtitle: 'South Mountain (Zone 5)',
    priority: 'High',
  },
  {
    id: 'action-3',
    stepNumber: 3,
    title: 'Community Alert Campaign',
    subtitle: '7 High Risk Zones',
    priority: 'Medium',
  },
];
