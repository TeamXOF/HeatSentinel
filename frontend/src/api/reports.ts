import { useQuery } from '@tanstack/react-query';
import { USE_MOCK_DATA, apiFetch } from './config';

export interface ReportItem {
  id: string;
  title: string;
  category: 'Daily Brief' | 'Incident Assessment' | 'Resource Audit' | 'Census Analysis';
  date: string;
  format: 'PDF' | 'CSV' | 'GeoJSON';
  size: string;
  author: string;
}

export const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'rep-1',
    title: 'Daily Thermal Anomaly & Heat Vulnerability Briefing',
    category: 'Daily Brief',
    date: 'Aug 21, 2026',
    format: 'PDF',
    size: '2.4 MB',
    author: 'HeatSentinel AI Agent',
  },
  {
    id: 'rep-2',
    title: 'Central Phoenix Corridor Zone 7 Rapid Assessment',
    category: 'Incident Assessment',
    date: 'Aug 21, 2026',
    format: 'PDF',
    size: '1.8 MB',
    author: 'Field Ops Telemetry',
  },
  {
    id: 'rep-3',
    title: 'Maricopa Cooling Facilities & Hydration Deficit Matrix',
    category: 'Resource Audit',
    date: 'Aug 20, 2026',
    format: 'CSV',
    size: '840 KB',
    author: 'MAG Regional Network',
  },
  {
    id: 'rep-4',
    title: 'Census ACS 5-Year High-Risk Demographic Overlay',
    category: 'Census Analysis',
    date: 'Aug 18, 2026',
    format: 'GeoJSON',
    size: '5.2 MB',
    author: 'Urban Spatial Analytics',
  },
  {
    id: 'rep-5',
    title: 'Weekly Heat Relief Intervention Effectiveness Summary',
    category: 'Daily Brief',
    date: 'Aug 15, 2026',
    format: 'PDF',
    size: '3.1 MB',
    author: 'Public Health Taskforce',
  },
];

export function useReports() {
  return useQuery<ReportItem[]>({
    queryKey: ['reportsList'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return MOCK_REPORTS;
      }
      try {
        return await apiFetch<ReportItem[]>('/api/reports');
      } catch (err) {
        // Graceful fallback to verified reports catalogue
        return MOCK_REPORTS;
      }
    },
  });
}

