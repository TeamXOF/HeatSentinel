import React, { useState } from 'react';
import { HyperlocalHeatMapCard } from '../components/HyperlocalHeatMapCard';
import { WhyPanel } from '../components/WhyPanel';
import { getEvidenceForZone } from '../data/mockZoneEvidenceData';
import { ZoneEvidenceDetail } from '../types';
import { Globe, Layers, AlertTriangle, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeatMapPage: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<ZoneEvidenceDetail | null>(null);
  const [isWhyPanelOpen, setIsWhyPanelOpen] = useState(false);

  const handleZoneSelect = (zoneKey: string) => {
    const evidence = getEvidenceForZone(zoneKey);
    setSelectedZone(evidence);
    setIsWhyPanelOpen(true);
  };

  return (
    <div id="heat-map-page" className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#F1F5F9] rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316] shrink-0">
            <Globe size={22} strokeWidth={2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Hyperlocal Heat & Risk Telemetry Map
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#CCFBF1] text-[#0D9488] text-[10px] font-bold uppercase tracking-wider">
                Live Sensor Mesh
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Phoenix Metropolitan Area (33.4484° N, 112.0740° W) — 10m thermal resolution overlay. Click any zone marker to inspect empirical WHY evidence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link
            to="/agent-insights"
            className="min-h-[40px] inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            <Sparkles size={14} className="text-[#F97316]" />
            <span>Agent Insights</span>
          </Link>
          <Link
            to="/risk-zones"
            className="min-h-[40px] inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-bold transition-all shadow-xs"
          >
            <ShieldAlert size={14} />
            <span>Zone Table View</span>
          </Link>
        </div>
      </div>

      {/* Full-width Map Container */}
      <div className="w-full">
        <HyperlocalHeatMapCard
          onZoneSelect={handleZoneSelect}
          className="min-h-[420px] sm:min-h-[560px] lg:min-h-[620px] shadow-xs"
        />
      </div>

      {/* WHY Evidence Drawer */}
      <WhyPanel
        isOpen={isWhyPanelOpen}
        onClose={() => setIsWhyPanelOpen(false)}
        evidence={selectedZone}
      />
    </div>
  );
};
