import {
  Users,
  Baby,
  HeartPulse,
  Snowflake,
  Droplets,
  Truck,
  Stethoscope,
} from 'lucide-react';
import {
  RiskZoneSummaryData,
  PopulationAtRiskData,
  ResourceReadinessData,
  AgentStatusBarData,
} from '../types';
import { TIER_CONFIG } from '../theme/tiers';

export const mockRiskZoneSummary: RiskZoneSummaryData = {
  totalCount: 12,
  segments: [
    { name: 'Critical', value: 2, color: TIER_CONFIG.CRITICAL.hex },
    { name: 'High', value: 5, color: TIER_CONFIG.HIGH.hex },
    { name: 'Moderate', value: 3, color: TIER_CONFIG.MODERATE.hex },
    { name: 'Low', value: 2, color: TIER_CONFIG.LOW.hex },
  ],
};

export const mockPopulationAtRisk: PopulationAtRiskData = {
  total: '86.4K',
  subtitle: 'People',
  riskCategory: 'High & Extreme Risk',
  breakdowns: [
    {
      id: 'seniors',
      label: 'Seniors 65+',
      count: '24.7K',
      icon: Users,
      color: 'text-[#F97316]',
      bgColor: 'bg-[#FFEDD5]',
    },
    {
      id: 'children',
      label: 'Children < 5',
      count: '12.3K',
      icon: Baby,
      color: 'text-[#F59E0B]',
      bgColor: 'bg-[#FEF3C7]',
    },
    {
      id: 'chronic',
      label: 'Chronic Conditions',
      count: '18.9K',
      icon: HeartPulse,
      color: 'text-[#EF4444]',
      bgColor: 'bg-[#FEE2E2]',
    },
  ],
};

export const mockResourceReadiness: ResourceReadinessData = {
  percentage: 78,
  statusLabel: 'Ready',
  breakdowns: [
    {
      id: 'cooling-centers',
      label: 'Cooling Centers',
      current: 23,
      total: 28,
      icon: Snowflake,
      color: 'text-[#0D9488]',
      bgColor: 'bg-[#CCFBF1]',
    },
    {
      id: 'water-stations',
      label: 'Water Stations',
      current: 48,
      total: 60,
      icon: Droplets,
      color: 'text-[#0284C7]',
      bgColor: 'bg-[#E0F2FE]',
    },
    {
      id: 'mobile-units',
      label: 'Mobile Units',
      current: 7,
      total: 10,
      icon: Truck,
      color: 'text-[#F97316]',
      bgColor: 'bg-[#FFEDD5]',
    },
    {
      id: 'medical-teams',
      label: 'Medical Teams',
      current: 15,
      total: 20,
      icon: Stethoscope,
      color: 'text-[#EF4444]',
      bgColor: 'bg-[#FEE2E2]',
    },
  ],
};

export const mockAgentStatusBar: AgentStatusBarData = {
  agentName: 'HeatSentinel AI Agent Status',
  status: 'ACTIVE',
  dataPointsCount: 1247,
  location: 'Phoenix, AZ',
  lastUpdated: '10:32 AM',
};
