import React, { useState } from 'react';
import {
  Radar,
  Loader2,
  Trash2,
  ArrowRight,
  Cpu,
  Radio,
  Activity,
  Layers,
  Calendar,
  Clock,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHeatHunt, useZones } from '../api';
import { WhyPanel } from '../components/WhyPanel';
import { AgentActivityPanel } from '../components/AgentActivityPanel';
import { HeatHuntConfigModal } from '../components/HeatHuntConfigModal';
import { ZoneEvidenceDetail } from '../types';
import { getTierConfig } from '../theme/tiers';

export const AgentInsightsPage: React.FC = () => {
  const {
    status,
    progressEvents,
    result,
    errorMessage,
    simulateFailure,
    setSimulateFailure,
    runHeatHunt,
    resetHeatHunt,
  } = useHeatHunt();

  const { data: liveZones = [] } = useZones();
  const [selectedZone, setSelectedZone] = useState<ZoneEvidenceDetail | null>(null);
  const [isWhyPanelOpen, setIsWhyPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('2024-08-01');
  const [selectedTime, setSelectedTime] = useState<string>('14:00');
  const [selectedProvider, setSelectedProvider] = useState<string>('auto');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  const handleOpenZoneEvidence = (zoneId: string) => {
    // Use real zone evidence when available, fall back to nothing
    const match = liveZones.find((z) => z.id === zoneId || z.id === `zone-${zoneId}`);
    if (match?.evidence) {
      setSelectedZone(match.evidence);
      setIsWhyPanelOpen(true);
    }
  };

  const handleLaunchWithParams = () => {
    runHeatHunt({
      startDate: selectedDate,
      startTime: selectedTime,
      provider: selectedProvider,
    });
  };

  return (
    <div id="agent-insights-page" className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-[#F1F5F9] rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xs flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-start gap-3.5 sm:gap-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0D9488]/15 to-[#F97316]/15 border border-teal-100 flex items-center justify-center text-[#0D9488] shrink-0">
              <Cpu size={24} className="sm:w-7 sm:h-7" strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#CCFBF1] text-[#0D9488] text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
                  Autonomous Engine
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  Model: {selectedProvider === 'auto' ? 'Gemini 3.5 Flash' : 'Deterministic Fast-Path'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A] tracking-tight mt-0.5">
                Heat Hunt Agent Activity & Insights
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
                Real-time telemetry event streaming, spatial anomaly detection, and automated Response Gap calculation for the Phoenix metropolitan corridor.
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            {/* Dev Simulation Toggle */}
            <button
              type="button"
              id="agent-toggle-sim-fail-btn"
              onClick={() => setSimulateFailure(!simulateFailure)}
              className={`min-h-[40px] px-3.5 py-2 rounded-full text-xs font-bold border focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors cursor-pointer ${
                simulateFailure
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Toggle error condition simulation"
            >
              {simulateFailure ? 'Fail Simulation: ON' : 'Fail Simulation: OFF'}
            </button>

            {/* Reset button */}
            {progressEvents.length > 0 && (
              <button
                type="button"
                id="agent-clear-log-btn"
                aria-label="Clear event log"
                onClick={resetHeatHunt}
                disabled={status === 'running'}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors disabled:opacity-40 cursor-pointer"
                title="Clear event log"
              >
                <Trash2 size={16} />
              </button>
            )}

            {/* Parameters Modal Button */}
            <button
              type="button"
              id="agent-open-params-btn"
              onClick={() => setIsConfigModalOpen(true)}
              disabled={status === 'running'}
              className="min-h-[40px] px-4 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
              title="Open full parameter customization modal"
            >
              <SlidersHorizontal size={14} />
              <span>Parameters</span>
            </button>

            {/* Main Action Button */}
            <button
              type="button"
              id="agent-run-hunt-page-btn"
              onClick={handleLaunchWithParams}
              disabled={status === 'running'}
              className={`min-h-[40px] flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-white focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-all shadow-xs ${
                status === 'running'
                  ? 'bg-orange-300 cursor-not-allowed'
                  : 'bg-[#F97316] hover:bg-[#ea580c] cursor-pointer hover:shadow-md active:scale-95'
              }`}
            >
              {status === 'running' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Running Scan...</span>
                </>
              ) : (
                <>
                  <Radar size={16} strokeWidth={2.4} />
                  <span>Launch Heat Hunt</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Inline Investigation Parameters Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            {/* Date Selector */}
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#EA580C]" />
              <span className="font-bold text-slate-700">Date:</span>
              <input
                id="agent-param-date-input"
                type="date"
                value={selectedDate}
                disabled={status === 'running'}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
              />
            </div>

            {/* Time Selector */}
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-[#EA580C]" />
              <span className="font-bold text-slate-700">Time:</span>
              <input
                id="agent-param-time-input"
                type="time"
                value={selectedTime}
                disabled={status === 'running'}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
              />
            </div>

            {/* Engine Selector */}
            <div className="flex items-center gap-1.5">
              <Cpu size={14} className="text-[#0D9488]" />
              <span className="font-bold text-slate-700">Engine:</span>
              <select
                id="agent-param-provider-select"
                value={selectedProvider}
                disabled={status === 'running'}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
              >
                <option value="auto">Auto (Gemini Multimodal)</option>
                <option value="deterministic">Deterministic Fast-Path</option>
              </select>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedDate('2024-08-01');
                setSelectedTime('14:00');
              }}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                selectedDate === '2024-08-01' && selectedTime === '14:00'
                  ? 'bg-orange-50 text-[#EA580C] border-orange-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Aug 1 Peak (14:00)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate('2024-07-20');
                setSelectedTime('12:00');
              }}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                selectedDate === '2024-07-20' && selectedTime === '12:00'
                  ? 'bg-orange-50 text-[#EA580C] border-orange-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Jul 20 Noon (12:00)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate('2024-08-15');
                setSelectedTime('16:00');
              }}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                selectedDate === '2024-08-15' && selectedTime === '16:00'
                  ? 'bg-orange-50 text-[#EA580C] border-orange-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Aug 15 Late (16:00)
            </button>
          </div>
        </div>
      </div>

      {/* Heat Hunt Configuration Modal */}
      <HeatHuntConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        initialDate={selectedDate}
        initialTime={selectedTime}
        initialProvider={selectedProvider}
      />

      {/* Main Grid: Left Event Stream Terminal (2/3) + Right Telemetry & Priority Rails (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left 2/3: Live Agent Activity Stream Terminal */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <AgentActivityPanel
            status={status}
            progressEvents={progressEvents}
            result={result}
            errorMessage={errorMessage}
            onRetry={runHeatHunt}
            onDisableSimulation={() => setSimulateFailure(false)}
          />
        </div>

        {/* Right 1/3: Telemetry Summary & Priority Findings Rail */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Card 1: Investigation Parameters */}
          <div className="bg-white border border-[#F1F5F9] rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h2 className="text-sm font-bold text-[#0F172A]">
                Sensor Ingestion Nodes
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-[#0D9488] text-[10px] font-bold uppercase">
                4 Active Feeds
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-[#F97316]" />
                  <span className="font-semibold text-slate-700">Thermal Infrared Raster</span>
                </div>
                <span className="font-bold text-slate-900">10m / Res</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[#0D9488]" />
                  <span className="font-semibold text-slate-700">NOAA Wet-Bulb Index</span>
                </div>
                <span className="font-bold text-slate-900">Real-time</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-[#0284C7]" />
                  <span className="font-semibold text-slate-700">Census ACS Vulnerability</span>
                </div>
                <span className="font-bold text-slate-900">5-Yr Tracts</span>
              </div>
            </div>
          </div>

          {/* Card 2: Highest Anomaly Zones (Click to view WHY evidence) */}
          <div className="bg-white border border-[#F1F5F9] rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h2 className="text-sm font-bold text-[#0F172A]">
                Identified Risk Hotspots
              </h2>
              <span className="text-[11px] text-[#64748B]">Click for WHY</span>
            </div>

            <div className="space-y-2.5">
              {liveZones.length > 0 ? liveZones.map((zone, i) => {
                const cfg = getTierConfig(zone.tier);
                const Icon = cfg.icon;
                const bgClass = zone.tier === 'CRITICAL'
                  ? 'bg-red-50/60 hover:bg-red-50 border-red-200/60'
                  : zone.tier === 'HIGH'
                  ? 'bg-orange-50/60 hover:bg-orange-50 border-orange-200/60'
                  : 'bg-amber-50/60 hover:bg-amber-50 border-amber-200/60';
                const numBg = zone.tier === 'CRITICAL' ? 'bg-[#FEE2E2] text-[#DC2626]'
                  : zone.tier === 'HIGH' ? 'bg-[#FFEDD5] text-[#EA580C]'
                  : 'bg-[#FEF3C7] text-[#D97706]';
                return (
                  <div
                    key={zone.id}
                    id={`agent-hotspot-${zone.id}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`View empirical evidence for ${zone.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenZoneEvidence(zone.id);
                      }
                    }}
                    onClick={() => handleOpenZoneEvidence(zone.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors group focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none ${bgClass}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${numBg}`}>
                        {zone.zoneNumber}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">{zone.name}</span>
                        <span className="text-[11px] text-slate-500">
                          Peak {zone.peakTempF} • Gap {zone.responseGapScore.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${cfg.solidBg} text-white shadow-2xs`}>
                      <Icon size={10} strokeWidth={2.5} />
                      <span>{cfg.shortLabel}</span>
                    </span>
                  </div>
                );
              }) : (
                // Skeleton placeholder while zones are loading
                <div className="text-[11px] text-slate-400 text-center py-4">
                  Loading live zone data...
                </div>
              )}
            </div>

            <div className="pt-1">
              <Link
                to="/response-planner"
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-bold transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:outline-none"
              >
                <span>Launch Response Planner</span>
                <ArrowRight size={13} strokeWidth={2.2} />
              </Link>
              <p className="text-[10px] text-slate-400 italic text-center mt-2 leading-snug">
                Response Gap is a composite risk indicator, not an official public-health index.
              </p>
            </div>
          </div>
        </div>
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
