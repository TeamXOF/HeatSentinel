import React, { useEffect, useRef, useState } from 'react';
import {
  Radar,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Cpu,
  Radio,
  Terminal,
  Trash2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHeatHunt } from '../api';
import { WhyPanel } from '../components/WhyPanel';
import { getEvidenceForZone } from '../data/mockZoneEvidenceData';
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

  const [selectedZone, setSelectedZone] = useState<ZoneEvidenceDetail | null>(null);
  const [isWhyPanelOpen, setIsWhyPanelOpen] = useState(false);
  const eventLogEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (eventLogEndRef.current) {
      eventLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [progressEvents, status]);

  const handleOpenZoneEvidence = (zoneKey: string) => {
    const evidence = getEvidenceForZone(zoneKey);
    setSelectedZone(evidence);
    setIsWhyPanelOpen(true);
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'error':
        return {
          dot: 'bg-[#DC2626] shadow-[0_0_8px_rgba(220,38,38,0.6)]',
          badge: 'bg-red-50 text-red-800 border-red-200',
        };
      case 'warning':
        return {
          dot: 'bg-[#D97706] shadow-[0_0_8px_rgba(217,119,6,0.6)]',
          badge: 'bg-amber-50 text-amber-900 border-amber-200',
        };
      case 'success':
        return {
          dot: 'bg-[#0D9488] shadow-[0_0_8px_rgba(13,148,136,0.6)]',
          badge: 'bg-teal-50 text-teal-900 border-teal-200',
        };
      case 'info':
      default:
        return {
          dot: 'bg-[#0284C7]',
          badge: 'bg-sky-50 text-sky-800 border-sky-200',
        };
    }
  };

  return (
    <div id="agent-insights-page" className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-[#F1F5F9] rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
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
                Model: Gemini Multimodal
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

          {/* Main Action Button */}
          <button
            type="button"
            id="agent-run-hunt-page-btn"
            onClick={runHeatHunt}
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

      {/* Main Grid: Left Event Stream Terminal (2/3) + Right Telemetry & Priority Rails (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left 2/3: Live Agent Activity Stream Terminal */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-[#F1F5F9] rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col h-[460px] sm:h-[520px]">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center">
                  <Terminal size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A]">
                    Live Telemetry & Step Execution Stream
                  </h2>
                  <p className="text-[11px] text-[#64748B]">
                    {status === 'running'
                      ? 'Investigation in progress...'
                      : status === 'completed'
                      ? 'Investigation cycle complete'
                      : status === 'failed'
                      ? 'Investigation aborted with error'
                      : 'Awaiting launch signal'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2" role="status" aria-live="polite">
                {status === 'running' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#C2410C] text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping" />
                    Live Scanning
                  </span>
                )}
                {status === 'completed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 size={14} className="text-emerald-700" />
                    Completed
                  </span>
                )}
                {status === 'failed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
                    <AlertTriangle size={14} className="text-red-700" />
                    Failed
                  </span>
                )}
                {status === 'idle' && (
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    Idle Standby
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Event Log */}
            <div
              id="agent-activity-event-log"
              role="log"
              aria-live="polite"
              aria-atomic="false"
              className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 select-text"
            >
              {progressEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Radar size={40} className="text-slate-300 stroke-1 mb-3 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-600">
                    No active scan logs yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Click <strong>"Launch Heat Hunt"</strong> to trigger the automated 7-step telemetry investigation pipeline.
                  </p>
                </div>
              ) : (
                <>
                  {progressEvents.map((evt, idx) => {
                    const { dot } = getEventBadge(evt.type);
                    return (
                      <div
                        key={evt.id}
                        id={`agent-event-row-${idx}`}
                        className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-3 transition-all hover:bg-slate-50"
                      >
                        {/* Status Dot */}
                        <div className="mt-1.5 shrink-0">
                          <span className={`block w-2.5 h-2.5 rounded-full ${dot}`} />
                        </div>

                        {/* Event Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#0F172A]">
                              {evt.stepNumber > 0 ? `Step ${evt.stepNumber} of ${evt.totalSteps}` : 'Initialization'}
                            </span>
                            <span className="text-[11px] font-mono text-[#94A3B8] tabular-nums">
                              {evt.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                            {evt.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Terminal Completed Row */}
                  {status === 'completed' && result && (
                    <div
                      id="agent-event-terminal-completed"
                      className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-start gap-3 mt-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                            ✓ Investigation Completed
                          </span>
                          <span className="text-[11px] font-mono text-emerald-800">
                            {result.completedAt}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-950 font-bold mt-1">
                          {result.summary}
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-emerald-200/80 flex items-center gap-4 text-[11px] text-emerald-900">
                          <span>Zones Evaluated: <strong>{result.zonesScanned}</strong></span>
                          <span>Critical Flags: <strong>{result.criticalZonesFound}</strong></span>
                          <Link
                            to="/"
                            className="ml-auto font-bold underline hover:text-emerald-950 focus-visible:ring-2 focus-visible:ring-emerald-700 rounded flex items-center gap-1"
                          >
                            Return to Map <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Terminal Failed Row */}
                  {status === 'failed' && (
                    <div
                      id="agent-event-terminal-failed"
                      className="p-4 rounded-2xl bg-red-50/90 border border-red-200 flex items-start gap-3 mt-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-red-900">
                            ✗ Investigation Interrupted
                          </span>
                          <span className="text-[11px] font-bold text-red-700">
                            Telemetry Error
                          </span>
                        </div>
                        <p className="text-xs text-red-950 font-medium mt-1 leading-relaxed">
                          {errorMessage || 'An error occurred while streaming raster sensor data.'}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            type="button"
                            id="agent-retry-scan-btn"
                            onClick={runHeatHunt}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none transition-all shadow-2xs cursor-pointer"
                          >
                            <RotateCcw size={12} />
                            Retry Scan
                          </button>
                          <button
                            type="button"
                            onClick={() => setSimulateFailure(false)}
                            className="text-xs text-red-800 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-red-400 rounded cursor-pointer"
                          >
                            Disable Error Simulation
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={eventLogEndRef} />
                </>
              )}
            </div>
          </div>
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
              {/* Zone 7 */}
              <div
                id="agent-hotspot-zone-7"
                tabIndex={0}
                role="button"
                aria-label="View empirical evidence for Zone 7 Central Phoenix Corridor"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenZoneEvidence('zone-7');
                  }
                }}
                onClick={() => handleOpenZoneEvidence('zone-7')}
                className="p-3 rounded-2xl bg-red-50/60 hover:bg-red-50 border border-red-200/60 flex items-center justify-between cursor-pointer transition-colors group focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#FEE2E2] text-[#DC2626] font-black text-xs flex items-center justify-center shrink-0">
                    7
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-red-700 transition-colors truncate">
                      Central Phoenix Corridor
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Peak 114.1°F • Gap 8.7/10
                    </span>
                  </div>
                </div>
                {(() => {
                  const cfg = getTierConfig('CRITICAL');
                  const Icon = cfg.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${cfg.solidBg} text-white shadow-2xs`}>
                      <Icon size={10} strokeWidth={2.5} />
                      <span>{cfg.shortLabel}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Zone 5 */}
              <div
                id="agent-hotspot-zone-5"
                tabIndex={0}
                role="button"
                aria-label="View empirical evidence for Zone 5 South Mountain Area"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenZoneEvidence('zone-5');
                  }
                }}
                onClick={() => handleOpenZoneEvidence('zone-5')}
                className="p-3 rounded-2xl bg-orange-50/60 hover:bg-orange-50 border border-orange-200/60 flex items-center justify-between cursor-pointer transition-colors group focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#FFEDD5] text-[#EA580C] font-black text-xs flex items-center justify-center shrink-0">
                    5
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-[#EA580C] transition-colors truncate">
                      South Mountain Area
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Peak 111.0°F • Gap 7.4/10
                    </span>
                  </div>
                </div>
                {(() => {
                  const cfg = getTierConfig('HIGH');
                  const Icon = cfg.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${cfg.solidBg} text-white shadow-2xs`}>
                      <Icon size={10} strokeWidth={2.5} />
                      <span>{cfg.shortLabel}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Zone 3 */}
              <div
                id="agent-hotspot-zone-3"
                tabIndex={0}
                role="button"
                aria-label="View empirical evidence for Zone 3 Eastlake / Garfield"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenZoneEvidence('zone-3');
                  }
                }}
                onClick={() => handleOpenZoneEvidence('zone-3')}
                className="p-3 rounded-2xl bg-amber-50/60 hover:bg-amber-50 border border-amber-200/60 flex items-center justify-between cursor-pointer transition-colors group focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#FEF3C7] text-[#D97706] font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-[#D97706] transition-colors truncate">
                      Eastlake / Garfield
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Peak 110.0°F • Gap 7.1/10
                    </span>
                  </div>
                </div>
                {(() => {
                  const cfg = getTierConfig('HIGH');
                  const Icon = cfg.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${cfg.solidBg} text-white shadow-2xs`}>
                      <Icon size={10} strokeWidth={2.5} />
                      <span>{cfg.shortLabel}</span>
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="pt-1">
              <Link
                to="/response-planner"
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-bold transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:outline-none"
              >
                <span>Launch Response Planner</span>
                <ArrowRight size={13} strokeWidth={2.2} />
              </Link>
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
