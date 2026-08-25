import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
  Clock,
  Compass,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface PitchStage {
  id: number;
  title: string;
  duration: string;
  route: string;
  keyMetric: string;
  talkingPoints: string[];
  suggestedAction: string;
}

const PITCH_STAGES: PitchStage[] = [
  {
    id: 1,
    title: '1. Problem & Multi-City Scope',
    duration: '0:00 - 0:35',
    route: '/',
    keyMetric: '114.1°F Peak · 12,866 Monitored Population',
    talkingPoints: [
      'Extreme urban heat is the deadliest weather phenomenon in the US.',
      'City weather stations give single airport averages, hiding 15°F variations between neighborhoods.',
      'HeatSentinel monitors top US heat metros: Phoenix, Las Vegas, Miami, Houston, LA, NYC.',
    ],
    suggestedAction: 'Show Overview KPI cards & switch city in the top header.',
  },
  {
    id: 2,
    title: '2. Hyperlocal 60m Thermal Grid',
    duration: '0:35 - 1:15',
    route: '/heat-map',
    keyMetric: '16,568 Grid Cells · 60m Ground Resolution',
    talkingPoints: [
      'FortyGuard provides 60m satellite thermal resolution, surfacing micro-heat islands.',
      'Click anywhere on the map to generate custom geometric AOI buffers.',
      'Notice asphalt heat retention vs shade canopy differences.',
    ],
    suggestedAction: 'Click Maryvale or Downtown district preset, then click custom location on map.',
  },
  {
    id: 3,
    title: '3. Autonomous Heat Hunt Agent',
    duration: '1:15 - 2:00',
    route: '/agent-insights',
    keyMetric: '10 Core Tools · 7 Investigation Phases · SSE Live Stream',
    talkingPoints: [
      'Our autonomous LLM agent scans target study areas without manual prompts.',
      'It executes a 7-phase loop: scan -> cluster -> refine -> demographic join -> score.',
      'Live tool traces stream with microsecond precision and zero hallucinations.',
    ],
    suggestedAction: 'Click "Run Heat Hunt" in header or view live SSE activity panel.',
  },
  {
    id: 4,
    title: '4. Response Gap & WHY Evidence',
    duration: '2:00 - 2:35',
    route: '/risk-zones',
    keyMetric: 'RG = 0.40(Heat) + 0.35(SVI) + 0.25(Deficit)',
    talkingPoints: [
      'Temperature alone is not risk — vulnerability and resource deficits determine mortality.',
      'Our deterministic Response Gap formula blends FortyGuard, US Census ACS, and MAG cooling data.',
      'The WHY drawer exposes full audit trail: SVI percentiles, nearest cooling center distance, and data sources.',
    ],
    suggestedAction: 'Click on Zone 1 or Zone 2 and inspect the expandable WHY evidence drawer.',
  },
  {
    id: 5,
    title: '5. Tactical Municipal Dispatch',
    duration: '2:35 - 3:00',
    route: '/response-planner',
    keyMetric: '9 Cooling Resources · 100% Actionable Tasking',
    talkingPoints: [
      'Turns thermal intelligence into instant municipal dispatch orders.',
      'Directs hydration vans, mobile shade, and cooling centers to exact high-deficit blocks.',
      'HeatSentinel saves lives by bridging the gap between satellite data and city response.',
    ],
    suggestedAction: 'Show automated response tasks and conclude presentation.',
  },
];

export const PresenterDemoController: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Keyboard shortcut Shift + P to toggle HUD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((sec) => sec + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const currentStage = PITCH_STAGES[currentStageIdx];

  const handleGoToStage = (idx: number) => {
    setCurrentStageIdx(idx);
    const targetStage = PITCH_STAGES[idx];
    if (location.pathname !== targetStage.route) {
      navigate(targetStage.route);
    }
  };

  const handleNextStage = () => {
    if (currentStageIdx < PITCH_STAGES.length - 1) {
      handleGoToStage(currentStageIdx + 1);
    }
  };

  const handlePrevStage = () => {
    if (currentStageIdx > 0) {
      handleGoToStage(currentStageIdx - 1);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating Collapsed Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          id="presenter-hud-open-btn"
          onClick={() => setIsOpen(true)}
          title="Open Judging Demo Flow Controller (Shortcut: Shift + P)"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 font-bold text-xs cursor-pointer transition-all hover:scale-105"
        >
          <Sparkles size={15} className="text-[#F97316]" />
          <span>Pitch HUD (3-Min)</span>
          <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded border border-slate-600">
            Shift+P
          </span>
        </button>
      )}

      {/* Expanded Presenter HUD Drawer */}
      {isOpen && (
        <div
          id="presenter-hud-drawer"
          className="fixed bottom-4 right-4 sm:right-6 w-[94vw] sm:w-[480px] max-w-[520px] bg-[#0F172A] text-slate-100 rounded-3xl shadow-2xl border border-slate-700/80 p-4 sm:p-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header with Title, Timer & Close */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] animate-ping"></span>
              <h3 className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                <span>Judge Pitch Controller</span>
                <span className="text-[10px] font-semibold bg-orange-900/60 text-orange-400 px-2 py-0.5 rounded-full border border-orange-700/50">
                  LIVE
                </span>
              </h3>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800/90 px-2.5 py-1 rounded-full border border-slate-700 text-xs font-mono font-bold text-emerald-400">
                <Clock size={12} />
                <span>{formatTime(secondsElapsed)} / 03:00</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title={isTimerRunning ? 'Pause timer' : 'Start pitch timer'}
              >
                {isTimerRunning ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setSecondsElapsed(0);
                }}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Progress Pips */}
          <div className="flex items-center gap-1.5 my-3">
            {PITCH_STAGES.map((st, i) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleGoToStage(i)}
                className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
                  i === currentStageIdx
                    ? 'bg-[#F97316] ring-2 ring-orange-500/40'
                    : i < currentStageIdx
                    ? 'bg-emerald-500'
                    : 'bg-slate-800'
                }`}
                title={`Stage ${i + 1}: ${st.title}`}
              />
            ))}
          </div>

          {/* Active Stage Card */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
                {currentStage.title}
              </span>
              <span className="text-[11px] font-mono text-slate-400">{currentStage.duration}</span>
            </div>

            <div className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
              🎯 Metric: {currentStage.keyMetric}
            </div>

            <ul className="space-y-1.5 text-xs text-slate-200">
              {currentStage.talkingPoints.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#F97316] font-bold shrink-0 mt-0.5">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/50 flex items-center gap-1.5">
              <Zap size={12} className="text-amber-400 shrink-0" />
              <span className="font-semibold text-slate-300">Action:</span>
              <span className="truncate">{currentStage.suggestedAction}</span>
            </div>
          </div>

          {/* Bottom Stage Navigation Buttons */}
          <div className="flex items-center justify-between pt-3 mt-1">
            <button
              type="button"
              disabled={currentStageIdx === 0}
              onClick={handlePrevStage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-300 cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>

            <span className="text-[11px] font-mono text-slate-400">
              Stage {currentStageIdx + 1} of {PITCH_STAGES.length}
            </span>

            <button
              type="button"
              disabled={currentStageIdx === PITCH_STAGES.length - 1}
              onClick={handleNextStage}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#F97316] hover:bg-orange-600 disabled:opacity-40 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg"
            >
              <span>Next Stage</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};