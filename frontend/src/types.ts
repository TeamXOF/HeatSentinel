import { LucideIcon } from 'lucide-react';

export type StatCardVariant = 'orange' | 'teal' | 'red' | 'cyan' | 'amber';

export interface StatCard {
  id: string;
  label: string;
  value: string;
  status: string;
  statusType?: 'orange' | 'teal' | 'red' | 'gray';
  subtext: string;
  icon: LucideIcon;
  variant: StatCardVariant;
  trend?: 'up' | 'down' | 'neutral';
}

export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface HeaderProps {
  greeting?: string;
  subtitle?: string;
  alertCount?: number;
  location?: string;
  userName?: string;
  userRole?: string;
  onOpenMobileMenu?: () => void;
}

export interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export type MapFilterTab = 'risk' | 'index' | 'vulnerability' | 'resources';

export interface HeatZoneMarker {
  id: string;
  zoneNumber: number;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  color: string;
  textColor: string;
  size: 'sm' | 'md' | 'lg';
  heatIndex: number;
}

export type AlertSeverity = 'extreme' | 'warning' | 'info';

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: AlertSeverity;
}

export type ActionPriority = 'High' | 'Medium' | 'Low';

export interface PriorityAction {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  priority: ActionPriority;
}

export interface RiskZoneSegment {
  name: string;
  value: number;
  color: string;
}

export interface RiskZoneSummaryData {
  totalCount: number;
  segments: RiskZoneSegment[];
}

export interface DemographicBreakdown {
  id: string;
  label: string;
  count: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export interface PopulationAtRiskData {
  total: string;
  subtitle: string;
  riskCategory: string;
  breakdowns: DemographicBreakdown[];
}

export interface ResourceBreakdown {
  id: string;
  label: string;
  current: number;
  total: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export interface ResourceReadinessData {
  percentage: number;
  statusLabel: string;
  breakdowns: ResourceBreakdown[];
}

export interface AgentStatusBarData {
  agentName: string;
  status: string;
  dataPointsCount: number;
  location: string;
  lastUpdated: string;
}

export type RiskTier = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
export type DataMode = 'LIVE DATA' | 'CACHED' | 'DEMO MODE';

export interface ScoreComponent {
  label: string;
  score: number; // e.g. 9.1
  maxScore: number; // e.g. 10
  color: string;
}

export interface ZoneEvidenceDetail {
  zoneId: string;
  zoneNumber: number;
  zoneName: string;
  tier: RiskTier;
  dataMode: DataMode;
  responseGapScore: number;
  components: ScoreComponent[];
  heatMetrics: {
    temperatureC?: string;
    temperatureF: string;
    persistenceHours?: string;
    exceedanceThreshold?: string;
    historicalAnomaly?: string;
  };
  vulnerability: {
    elderlyPercent?: string;
    chronicConditionsPercent?: string;
    povertyRate?: string;
    source: string;
  };
  resources: {
    coolingCenterCount?: number;
    avgDistanceMiles?: string;
    hydrationOutposts?: number;
    source: string;
  };
  recommendedAction: {
    category: string;
    actionText: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    eta: string;
  };
  // Tree canopy cover — null means "not available in this analysis"
  treeCoverPct?: number | null;
  // Empirical data source citations from the pipeline
  dataSources?: string[];
}

export type HeatHuntStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface HeatHuntProgressEvent {
  id: string;
  message: string;
  display_name?: string; // Human-readable label from backend TOOL_DISPLAY_NAMES; prefer over message when present
  timestamp: string;
  stepNumber: number;
  totalSteps: number;
  type: 'info' | 'warning' | 'success' | 'error';
  meta?: Record<string, any>;
}

export interface HeatHuntResult {
  zonesScanned: number;
  criticalZonesFound: number;
  completedAt: string;
  summary: string;
}

export interface HeatHuntContextValue {
  status: HeatHuntStatus;
  progressEvents: HeatHuntProgressEvent[];
  result: HeatHuntResult | null;
  errorMessage: string | null;
  simulateFailure: boolean;
  setSimulateFailure: (simulate: boolean) => void;
  runHeatHunt: () => void;
  resetHeatHunt: () => void;
}
