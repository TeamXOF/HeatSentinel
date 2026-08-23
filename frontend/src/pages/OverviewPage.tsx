import React, { useState } from 'react';
import { KpiStatCards } from '../components/KpiStatCards';
import { HyperlocalHeatMapCard } from '../components/HyperlocalHeatMapCard';
import { ActiveAlertsCard, TopPriorityActionsCard } from '../components/RightRailCards';
import {
  RiskZoneSummaryCard,
  PopulationAtRiskCard,
  ResourceReadinessCard,
} from '../components/AnalyticsCards';
import { FooterStatusBar } from '../components/FooterStatusBar';
import { WhyPanel } from '../components/WhyPanel';
import { PriorityAction, ZoneEvidenceDetail } from '../types';
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

  // Consume data exclusively via API hooks
  const { data: kpiCards = [] } = useKpis();
  const { data: activeAlerts = [] } = useActiveAlerts();
  const { data: priorityActions = [] } = usePriorityActions();
  const { data: riskZoneSummary } = useRiskZoneSummary();
  const { data: populationAtRisk } = usePopulationAtRisk();
  const { data: resourceReadiness } = useResourceReadiness();
  const { data: agentStatus } = useAgentStatus();
  const { data: zones = [] } = useZones();

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
    let zoneKey = 'zone-7';
    if (action.subtitle.includes('Zone 7') || action.title.includes('Zone 7')) {
      zoneKey = 'zone-7';
    } else if (action.subtitle.includes('Zone 5') || action.title.includes('Zone 5')) {
      zoneKey = 'zone-5';
    } else if (action.subtitle.includes('Zone 3') || action.title.includes('Zone 3')) {
      zoneKey = 'zone-3';
    }
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
      {/* 5 KPI Stat Cards Row directly below Header */}
      {kpiCards.length > 0 && <KpiStatCards cards={kpiCards} />}

      {/* Main Mid Section: 2/3 Heat Map + 1/3 Right Rail (stacked on mobile/tablet) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-start">
        {/* Left 2/3: Hyperlocal Heat Risk Map Card */}
        <div className="lg:col-span-2 w-full">
          <HyperlocalHeatMapCard onZoneSelect={handleZoneSelect} />
        </div>

        {/* Right 1/3: Active Alerts & Top Priority Actions Stack */}
        <div className="lg:col-span-1 flex flex-col gap-5 sm:gap-6 w-full">
          {/* Card 1: Active Alerts (N) */}
          <ActiveAlertsCard alerts={activeAlerts} />

          {/* Card 2: Top Priority Actions */}
          <TopPriorityActionsCard
            actions={priorityActions}
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
