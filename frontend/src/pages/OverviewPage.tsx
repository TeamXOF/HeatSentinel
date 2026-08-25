import React, { useState, useMemo } from 'react';
import { Flame, Activity, Grid, Users, ShieldAlert } from 'lucide-react';
import { KpiStatCards } from '../components/KpiStatCards';
import { HyperlocalHeatMapCard, PHOENIX_DISTRICT_PRESETS, PhoenixDistrictPreset } from '../components/HyperlocalHeatMapCard';
import { ActiveAlertsCard, TopPriorityActionsCard } from '../components/RightRailCards';
import {
  RiskZoneSummaryCard,
  PopulationAtRiskCard,
  ResourceReadinessCard,
} from '../components/AnalyticsCards';
import { FooterStatusBar } from '../components/FooterStatusBar';
import { WhyPanel } from '../components/WhyPanel';
import { PriorityAction, ZoneEvidenceDetail, StatCard, ActiveAlert } from '../types';
import {
  useKpis,
  useActiveAlerts,
  usePriorityActions,
  useRiskZoneSummary,
  usePopulationAtRisk,
  useResourceReadiness,
  useAgentStatus,
  useZones,
} from '../api';
import { getEvidenceForZone } from '../data/mockZoneEvidenceData';

export const OverviewPage: React.FC = () => {
  const [isWhyPanelOpen, setIsWhyPanelOpen] = useState<boolean>(false);
  const [currentEvidence, setCurrentEvidence] = useState<ZoneEvidenceDetail | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<PhoenixDistrictPreset>(PHOENIX_DISTRICT_PRESETS[0]);

  // Consume data via API hooks
  const { data: fallbackKpis = [] } = useKpis();
  const { data: riskZoneSummary } = useRiskZoneSummary();
  const { data: populationAtRisk } = usePopulationAtRisk();
  const { data: resourceReadiness } = useResourceReadiness();
  const { data: agentStatus } = useAgentStatus();
  const { data: zones = [] } = useZones();

  // Dynamic KPI Cards that update immediately when user clicks any district or location
  const dynamicKpiCards: StatCard[] = useMemo(() => {
    return [
      {
        id: 'peak-temp',
        label: 'Peak Hotspot Temp',
        value: `${activeDistrict.peakTempF.toFixed(1)}°F`,
        status: `${activeDistrict.peakTempC.toFixed(1)}°C FortyGuard`,
        statusType: activeDistrict.peakTempF > 110 ? 'red' : activeDistrict.peakTempF > 105 ? 'orange' : 'amber',
        subtext: 'Hyperlocal 60m Scan',
        icon: Flame as any,
        variant: 'red',
      },
      {
        id: 'hotspot-zones',
        label: 'Hotspot Zones',
        value: `${activeDistrict.id === 'all-phoenix' ? '8' : '2'}`,
        status: `${activeDistrict.tier} Risk`,
        statusType: activeDistrict.tier === 'CRITICAL' ? 'red' : activeDistrict.tier === 'HIGH' ? 'orange' : 'amber',
        subtext: 'DBSCAN Clusters',
        icon: Activity as any,
        variant: 'orange',
      },
      {
        id: 'grid-cells',
        label: 'Thermal Grid Cells',
        value: `${activeDistrict.id === 'all-phoenix' ? '16,568' : '400'}`,
        status: '100% Ingested',
        statusType: 'teal',
        subtext: activeDistrict.id === 'all-phoenix' ? '4 Tiles Analyzed' : '60m Satellite Mesh',
        icon: Grid as any,
        variant: 'teal',
      },
      {
        id: 'monitored-population',
        label: 'Monitored Population',
        value: `${activeDistrict.population.toLocaleString()}`,
        status: 'ACS 5-Year Tracts',
        statusType: 'amber',
        subtext: 'Census Demographics',
        icon: Users as any,
        variant: 'amber',
      },
      {
        id: 'cooling-resources',
        label: 'Cooling Resources',
        value: `${activeDistrict.coolingCentersCount} Active`,
        status: 'MAG Network',
        statusType: 'teal',
        subtext: 'Within 1mi Buffer',
        icon: ShieldAlert as any,
        variant: 'teal',
      },
    ];
  }, [activeDistrict]);


  // Dynamic Priority Actions for active district
  const dynamicPriorityActions: PriorityAction[] = useMemo(() => {
    return [
      {
        id: `act-1-${activeDistrict.id}`,
        title: `Deploy Hydration & Mobile Shade for ${activeDistrict.shortLabel}`,
        subtitle: `Zone 1 — ${activeDistrict.name} (${activeDistrict.coordinates[1].toFixed(3)}°N, ${Math.abs(activeDistrict.coordinates[0]).toFixed(3)}°W)`,
        urgency: (activeDistrict.tier === 'CRITICAL' ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
        targetCapacity: Math.round(activeDistrict.population * 0.08),
        allocatedCount: Math.round(activeDistrict.population * 0.05),
        zoneNumber: 1,
      },
      {
        id: `act-2-${activeDistrict.id}`,
        title: `Initiate Senior Wellness Outreach in ${activeDistrict.shortLabel}`,
        subtitle: `Zone 2 — High SVI residential sector within 1-mile of cooling resources`,
        urgency: 'MEDIUM' as const,
        targetCapacity: Math.round(activeDistrict.population * 0.04),
        allocatedCount: Math.round(activeDistrict.population * 0.03),
        zoneNumber: 2,
      },
    ];
  }, [activeDistrict]);

  // Dynamic Alerts for active district
  const dynamicAlerts: ActiveAlert[] = useMemo(() => {
    return [
      {
        id: `alt-1-${activeDistrict.id}`,
        title: activeDistrict.tier === 'CRITICAL' ? 'Extreme Heat Warning (Level 4)' : 'Heat Advisory (Level 3)',
        location: activeDistrict.name,
        time: 'Live Telemetry Ingested',
        severity: (activeDistrict.tier === 'CRITICAL' ? 'critical' : activeDistrict.tier === 'HIGH' ? 'warning' : 'info') as any,
        badgeText: `${activeDistrict.peakTempF.toFixed(1)}°F Peak`,
      },
      {
        id: `alt-2-${activeDistrict.id}`,
        title: 'Cooling Center Operational Check',
        location: `${activeDistrict.coolingCentersCount} MAG Facilities in ${activeDistrict.shortLabel}`,
        time: 'Updated 10m ago',
        severity: 'info' as any,
        badgeText: 'Active',
      },
    ];
  }, [activeDistrict]);

  const handleZoneSelect = (zoneId: string) => {
    const zoneMatch = zones.find(
      (z) => z.id === zoneId || String(z.zoneNumber) === String(zoneId) || z.id === `zone-${zoneId}`
    );
    const evidence = zoneMatch ? zoneMatch.evidence : (getEvidenceForZone(zoneId) || zones[0]?.evidence || null);
    if (evidence) {
      setCurrentEvidence(evidence);
      setIsWhyPanelOpen(true);
    }
  };

  const handleActionSelect = (action: PriorityAction) => {
    let zoneKey = activeDistrict.zoneId || 'zone-7';
    const zoneMatch = zones.find((z) => z.id === zoneKey);
    const evidence = zoneMatch ? zoneMatch.evidence : getEvidenceForZone(zoneKey);
    setCurrentEvidence(evidence);
    setIsWhyPanelOpen(true);
  };

  const handleCloseWhyPanel = () => {
    setIsWhyPanelOpen(false);
  };

  const handleRefreshTelemetry = () => {
    console.log('Telemetry refreshed via API layer');
  };

  return (
    <div id="overview-page-container" className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
      {/* 5 Dynamic KPI Stat Cards Row directly below Header */}
      <KpiStatCards cards={dynamicKpiCards} />

      {/* Main Mid Section: 2/3 Heat Map + 1/3 Right Rail (stacked on mobile/tablet) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-start">
        {/* Left 2/3: Hyperlocal Heat Risk Map Card */}
        <div className="lg:col-span-2 w-full">
          <HyperlocalHeatMapCard
            onZoneSelect={handleZoneSelect}
            onDistrictChange={(d) => setActiveDistrict(d)}
          />
        </div>

        {/* Right 1/3: Active Alerts & Top Priority Actions Stack */}
        <div className="lg:col-span-1 flex flex-col gap-5 sm:gap-6 w-full">
          {/* Card 1: Active Alerts */}
          <ActiveAlertsCard alerts={dynamicAlerts} />

          {/* Card 2: Top Priority Actions */}
          <TopPriorityActionsCard
            actions={dynamicPriorityActions}
            onActionSelect={handleActionSelect}
          />
        </div>
      </div>


      {/* 3-Column Analytics Row (stacks to 1 col on mobile, 2 col on tablet, 3 col on desktop) */}
      <div
        id="analytics-cards-row"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full"
      >
        {/* Card 1: Risk Zone Summary with Recharts Donut */}
        {riskZoneSummary && <RiskZoneSummaryCard data={riskZoneSummary} />}

        {/* Card 2: Population at Risk */}
        {populationAtRisk && <PopulationAtRiskCard data={populationAtRisk} />}

        {/* Card 3: Resource Readiness */}
        {resourceReadiness && <ResourceReadinessCard data={resourceReadiness} />}
      </div>

      {/* Full-width Footer Status Bar */}
      {agentStatus && (
        <FooterStatusBar
          data={agentStatus}
          onRefresh={handleRefreshTelemetry}
        />
      )}

      {/* Evidence Trail WHY Panel (Slide-in Drawer / Modal) */}
      <WhyPanel
        isOpen={isWhyPanelOpen}
        onClose={handleCloseWhyPanel}
        evidence={currentEvidence}
      />
    </div>
  );
};
