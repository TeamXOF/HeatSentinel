/**
 * AgentActivityPanel — Reusable live activity feed for Heat Hunt progress events.
 *
 * Renders real backend-emitted `progress_events` with human-readable display names
 * sourced from the backend TOOL_DISPLAY_NAMES mapping (via `display_name` field).
 * Every displayed line corresponds to a real agent tool-call — no fabricated steps.
 */

import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Radar, RotateCcw, Terminal } from 'lucide-react';
import { HeatHuntProgressEvent, HeatHuntResult, HeatHuntStatus } from '../types';

export interface AgentActivityPanelProps {
  /** Current job status from HeatHunt context */
  status: HeatHuntStatus;
  /** Live progress events streamed from backend */
  progressEvents: HeatHuntProgressEvent[];
  /** Final result summary once job is completed */
  result?: HeatHuntResult | null;
  /** Error message when status === 'failed' */
  errorMessage?: string | null;
  /** Compact layout for sidebar/rail embedding */
  compact?: boolean;
  /** Called when user clicks "Retry Scan" in failed state */
  onRetry?: () => void;
  /** Called when user clicks "Disable Error Simulation" */
  onDisableSimulation?: () => void;
}

/** Maps event type to a colored status dot class */
function getEventDotClass(type: string): string {
  switch (type) {
    case 'error':
      return 'bg-[#DC2626] shadow-[0_0_8px_rgba(220,38,38,0.6)]';
    case 'warning':
      return 'bg-[#D97706] shadow-[0_0_8px_rgba(217,119,6,0.6)]';
    case 'success':
      return 'bg-[#0D9488] shadow-[0_0_8px_rgba(13,148,136,0.6)]';
    case 'info':
    default:
      return 'bg-[#0284C7]';
  }
}

export const AgentActivityPanel: React.FC<AgentActivityPanelProps> = ({
  status,
  progressEvents,
  result,
  errorMessage,
  compact = false,
  onRetry,
  onDisableSimulation,
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event without remounting the list
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressEvents.length, status]);

  const heightClass = compact ? 'h-[280px] sm:h-[320px]' : 'h-[460px] sm:h-[520px]';
  const padClass = compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6';

  const statusLabel = (() => {
    if (status === 'running') return 'Investigation in progress...';
    if (status === 'completed') return 'Investigation cycle complete';
    if (status === 'failed') return 'Investigation aborted with error';
    return 'Awaiting launch signal';
  })();

  return (
    <div
      className={`bg-white border border-[#F1F5F9] rounded-3xl shadow-xs flex flex-col ${padClass} ${heightClass}`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center shrink-0">
            <Terminal size={16} />
          </div>
          {!compact && (
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">
                Live Telemetry &amp; Step Execution Stream
              </h2>
              <p className="text-[11px] text-[#64748B]">{statusLabel}</p>
            </div>
          )}
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
          /* Empty state — job just started or not yet launched */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Radar
              size={compact ? 28 : 40}
              className="text-slate-300 stroke-1 mb-3 animate-pulse"
            />
            <p className={`font-semibold text-slate-600 ${compact ? 'text-xs' : 'text-sm'}`}>
              {status === 'running'
                ? 'Agent initializing \u2014 awaiting first dispatch event...'
                : 'No active scan logs yet'}
            </p>
            {!compact && status !== 'running' && (
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Click <strong>&quot;Launch Heat Hunt&quot;</strong> to trigger the autonomous multi-step spatial investigation pipeline.
              </p>
            )}
          </div>
        ) : (
          <>
            {progressEvents.map((evt, idx) => {
              // Prefer backend-supplied display_name; fall back to raw message
              const label = evt.display_name || evt.message;
              const dotClass = getEventDotClass(evt.type);
              return (
                <div
                  key={evt.id}
                  id={`agent-event-row-${idx}`}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-3 transition-all hover:bg-slate-50"
                >
                  {/* Status dot */}
                  <div className="mt-1.5 shrink-0">
                    <span className={`block w-2.5 h-2.5 rounded-full ${dotClass}`} />
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`font-bold text-[#0F172A] ${compact ? 'text-[11px]' : 'text-xs'}`}
                      >
                        {evt.stepNumber > 0
                          ? `Step ${evt.stepNumber}${evt.totalSteps && evt.totalSteps >= evt.stepNumber ? ` of ${evt.totalSteps}` : ''}`
                          : 'Initialization'}
                      </span>
                      <span className="text-[11px] font-mono text-[#94A3B8] tabular-nums">
                        {evt.timestamp}
                      </span>
                    </div>
                    <p
                      className={`text-slate-700 mt-1 leading-relaxed font-medium ${
                        compact ? 'text-[11px]' : 'text-xs'
                      }`}
                    >
                      {label}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Terminal: Completed */}
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
                      &#10003; Investigation Complete
                    </span>
                    <span className="text-[11px] font-mono text-emerald-800">
                      {result.completedAt}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-950 font-bold mt-1">{result.summary}</p>
                  {!compact && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-200/80 flex items-center gap-4 text-[11px] text-emerald-900">
                      <span>
                        Zones Evaluated: <strong>{result.zonesScanned}</strong>
                      </span>
                      <span>
                        Critical Flags: <strong>{result.criticalZonesFound}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terminal: Failed */}
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
                      &#10007; Investigation Interrupted
                    </span>
                    <span className="text-[11px] font-bold text-red-700">Telemetry Error</span>
                  </div>
                  <p className="text-xs text-red-950 font-medium mt-1 leading-relaxed">
                    {errorMessage || 'An error occurred while streaming raster sensor data.'}
                  </p>
                  {(onRetry || onDisableSimulation) && (
                    <div className="mt-3 flex items-center gap-3">
                      {onRetry && (
                        <button
                          type="button"
                          id="agent-retry-scan-btn"
                          onClick={onRetry}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none transition-all shadow-2xs cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          Retry Scan
                        </button>
                      )}
                      {onDisableSimulation && (
                        <button
                          type="button"
                          onClick={onDisableSimulation}
                          className="text-xs text-red-800 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-red-400 rounded cursor-pointer"
                        >
                          Disable Error Simulation
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Auto-scroll anchor — stable, no remount per poll */}
            <div ref={endRef} />
          </>
        )}
      </div>
    </div>
  );
};

