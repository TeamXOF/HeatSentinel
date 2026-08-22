import React, { useEffect, useRef } from 'react';
import {
  X,
  ThermometerSun,
  Users,
  ShieldAlert,
  Droplets,
  Sparkles,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import { ZoneEvidenceDetail, DataMode } from '../types';
import { getTierConfig } from '../theme/tiers';

interface WhyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: ZoneEvidenceDetail | null;
}

export const WhyPanel: React.FC<WhyPanelProps> = ({
  isOpen,
  onClose,
  evidence,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Handle ESC key and focus management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Auto focus close button for accessibility
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !evidence) return null;

  const tierConfig = getTierConfig(evidence.tier);
  const TierIcon = tierConfig.icon;

  // Mode badge styling (DEMO MODE / CACHED = amber, LIVE DATA = green)
  const getDataModeStyles = (mode: DataMode) => {
    switch (mode) {
      case 'LIVE DATA':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'CACHED':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'DEMO MODE':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-300';
    }
  };

  const dataModeStyles = getDataModeStyles(evidence.dataMode);

  return (
    <div
      id="why-panel-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="why-panel-title"
    >
      {/* Right-side Drawer / Mobile Full Screen Modal */}
      <div
        id="why-panel-drawer"
        className="w-full h-full sm:max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300 z-50 sm:rounded-l-3xl border-l border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* PANEL HEADER */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col gap-2.5 bg-slate-50/60 shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Mode Badge per visual requirements */}
            <span
              id="why-panel-mode-badge"
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${dataModeStyles}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
              {evidence.dataMode}
            </span>

            {/* Persistent Close Button with min 44px touch target */}
            <button
              ref={closeButtonRef}
              type="button"
              id="why-panel-close-btn"
              onClick={onClose}
              aria-label="Close evidence panel"
              className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors cursor-pointer"
            >
              <X size={20} strokeWidth={2.2} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Evidence Trail & Reasoning
              </span>
              <h2
                id="why-panel-title"
                className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate"
              >
                Zone {evidence.zoneNumber} — {evidence.zoneName}
              </h2>
            </div>

            {/* Tier Badge with Icon & Accessible Color Pair */}
            <span
              id="why-panel-tier-badge"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border shadow-2xs shrink-0 ${tierConfig.tintBg} ${tierConfig.tintText} ${tierConfig.tintBorder}`}
            >
              <TierIcon size={14} strokeWidth={2.5} />
              <span>{tierConfig.label}</span>
            </span>
          </div>
        </div>

        {/* SCROLLABLE BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 overscroll-contain">
          {/* SECTION 1: RESPONSE GAP SCORE */}
          <div
            id="why-panel-score-card"
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Response Gap Score
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black text-slate-900 tracking-tight tabular-nums">
                    {evidence.responseGapScore.toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ 10</span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#F97316]">
                <ShieldAlert size={20} strokeWidth={2.2} />
              </div>
            </div>

            {/* Score Breakdown Bars */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700">
                Score Contribution Components:
              </span>
              {evidence.components.map((comp) => {
                const pct = (comp.score / comp.maxScore) * 100;
                return (
                  <div key={comp.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600">{comp.label}</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {comp.score.toFixed(1)} <span className="text-slate-400 font-normal">/ {comp.maxScore}</span>
                      </span>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: comp.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* MANDATORY PERSISTENT DISCLAIMER */}
            <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-400 italic leading-snug">
              <Info size={13} className="shrink-0 mt-0.5 text-slate-400" />
              <p>
                Response Gap is a composite risk indicator, not an official public-health index.
              </p>
            </div>
          </div>

          {/* SECTION 2: EVIDENCE SECTION */}
          <div id="why-panel-evidence-section" className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers size={14} className="text-[#0D9488]" />
              Multi-Layer Empirical Evidence
            </h3>

            {/* A. Heat Telemetry Metrics */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <ThermometerSun size={15} className="text-[#F97316]" />
                <span>Heat & Thermal Metrics</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Peak Thermal</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5">
                    {evidence.heatMetrics.temperatureC || <em className="text-slate-400 font-normal">Not available in this analysis</em>}
                    <span className="text-slate-400 text-xs ml-1 font-medium">
                      ({evidence.heatMetrics.temperatureF})
                    </span>
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Persistence</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5">
                    {evidence.heatMetrics.persistenceHours || <em className="text-slate-400 font-normal">Not available in this analysis</em>}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Urban Exceedance</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5">
                    {evidence.heatMetrics.exceedanceThreshold || <em className="text-slate-400 font-normal">Not available in this analysis</em>}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Historical Anomaly</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5">
                    {evidence.heatMetrics.historicalAnomaly || <em className="text-slate-400 font-normal text-[11px]">Not available in this analysis</em>}
                  </span>
                </div>
              </div>
            </div>

            {/* B. Vulnerability Sources */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Users size={15} className="text-[#0D9488]" />
                  <span>Vulnerability Demographics</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium italic">
                  Source: {evidence.vulnerability.source}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Elderly (65+)</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5">
                    {evidence.vulnerability.elderlyPercent || <em className="text-slate-400 font-normal">Not available in this analysis</em>}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Chronic Conditions</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5">
                    {evidence.vulnerability.chronicConditionsPercent || <em className="text-slate-400 font-normal">Not available in this analysis</em>}
                  </span>
                </div>
              </div>
            </div>

            {/* C. Resource Sources */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Droplets size={15} className="text-[#0284C7]" />
                  <span>Resource Proximity & Deficit</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium italic">
                  Source: {evidence.resources.source}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cooling centers in corridor:</span>
                  <span className="font-bold text-slate-900">
                    {evidence.resources.coolingCenterCount !== undefined ? (
                      evidence.resources.coolingCenterCount
                    ) : (
                      <em className="text-slate-400 font-normal">Not available in this analysis</em>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Avg distance to shelter:</span>
                  <span className="font-bold text-slate-900">
                    {evidence.resources.avgDistanceMiles || (
                      <em className="text-slate-400 font-normal">Not available in this analysis</em>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: RECOMMENDED ACTION CALLOUT BOX */}
          <div
            id="why-panel-recommended-action"
            className="bg-gradient-to-br from-teal-50/90 to-emerald-50/70 border border-teal-200/70 rounded-2xl p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0D9488]">
                <Sparkles size={16} strokeWidth={2.2} />
                <span className="text-xs font-black uppercase tracking-wider">
                  Recommended Action
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0D9488] text-white text-[10px] font-bold uppercase tracking-wider">
                {evidence.recommendedAction.category}
              </span>
            </div>

            <p className="text-xs font-bold text-slate-900 leading-relaxed">
              {evidence.recommendedAction.actionText}
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-teal-100 text-[11px] text-[#0D9488] font-medium">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {evidence.recommendedAction.eta}
              </span>
              <span className="font-bold uppercase tracking-wider">
                Priority: {evidence.recommendedAction.priority}
              </span>
            </div>
          </div>
        </div>

        {/* PANEL FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none text-xs font-semibold transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
