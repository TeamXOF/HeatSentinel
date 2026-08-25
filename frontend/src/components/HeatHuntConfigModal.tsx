import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Cpu,
  Radar,
  X,
  Sparkles,
  Info,
  ChevronRight,
  SunMedium,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useHeatHunt } from '../api';

interface HeatHuntConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialTime?: string;
  initialProvider?: string;
  initialMode?: 'live' | 'cached' | 'demo';
}

const PRESET_DATES = [
  { label: '2024-08-01 (Historic Peak Baseline)', value: '2024-08-01', desc: '115°F Phoenix heatwave event with 16,568 TCM grid points' },
  { label: '2024-07-20 (Midsummer Thermal Apex)', value: '2024-07-20', desc: 'Sustained triple-digit surface temperature run' },
  { label: '2024-08-15 (Monsoon Transition)', value: '2024-08-15', desc: 'High relative humidity wet-bulb index' },
];

const PRESET_TIMES = [
  { label: '14:00 (2:00 PM Peak)', value: '14:00', desc: 'Maximum solar irradiance & surface temperature' },
  { label: '12:00 (12:00 PM Noon)', value: '12:00', desc: 'Midday thermal rise & worker shift start' },
  { label: '16:00 (4:00 PM Afternoon)', value: '16:00', desc: 'Peak ambient air temperature' },
  { label: '20:00 (8:00 PM Evening Lag)', value: '20:00', desc: 'Urban heat island overnight retention' },
];

export const HeatHuntConfigModal: React.FC<HeatHuntConfigModalProps> = ({
  isOpen,
  onClose,
  initialDate = '2024-08-01',
  initialTime = '14:00',
  initialProvider = 'auto',
  initialMode = 'live',
}) => {
  const { runHeatHunt, status } = useHeatHunt();
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>(initialTime);
  const [selectedProvider, setSelectedProvider] = useState<string>(initialProvider);
  const [selectedMode, setSelectedMode] = useState<'live' | 'cached' | 'demo'>(initialMode);

  if (!isOpen) return null;

  const handleLaunch = () => {
    runHeatHunt({
      startDate: selectedDate,
      startTime: selectedTime,
      provider: selectedProvider,
      mode: selectedMode,
    });
    onClose();
  };

  return (
    <div
      id="heat-hunt-config-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="heat-hunt-config-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <Radar size={22} className="animate-spin-slow" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg sm:text-xl font-black tracking-tight">
                Launch Autonomous Heat Hunt
              </h2>
              <p className="text-xs text-orange-100 font-medium">
                Configure municipal target observation parameters & AI engine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Target Location Banner */}
          <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <SunMedium size={16} className="text-[#EA580C]" />
              <span className="font-bold text-[#9A3412]">Study Corridor: Phoenix Metropolitan Area (4 Tiles)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-orange-200/60 text-[#9A3412] font-bold text-[10px] uppercase">
              16,568 Grid Cells
            </span>
          </div>

          {/* Section 1: Observation Date */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="custom-date-input" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-[#EA580C]" />
                Target Observation Date
              </label>
              <span className="text-[11px] font-semibold text-slate-500">YYYY-MM-DD</span>
            </div>

            {/* Date Presets */}
            <div className="grid grid-cols-1 gap-2">
              {PRESET_DATES.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setSelectedDate(preset.value)}
                  className={`text-left p-3 rounded-2xl border transition-all text-xs flex items-center justify-between cursor-pointer ${
                    selectedDate === preset.value
                      ? 'border-[#EA580C] bg-orange-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`font-bold ${selectedDate === preset.value ? 'text-[#EA580C]' : 'text-slate-800'}`}>
                      {preset.label}
                    </span>
                    <span className="text-[11px] text-slate-500">{preset.desc}</span>
                  </div>
                  {selectedDate === preset.value && (
                    <CheckCircle2 size={16} className="text-[#EA580C] shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Date Input */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-600 font-medium">Or custom date:</span>
              <input
                id="custom-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Section 2: Observation Time */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="custom-time-input" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-[#EA580C]" />
                Observation Time of Day
              </label>
              <span className="text-[11px] font-semibold text-slate-500">24-Hour Format</span>
            </div>

            {/* Time Presets */}
            <div className="grid grid-cols-2 gap-2">
              {PRESET_TIMES.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setSelectedTime(preset.value)}
                  className={`text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                    selectedTime === preset.value
                      ? 'border-[#EA580C] bg-orange-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`font-bold ${selectedTime === preset.value ? 'text-[#EA580C]' : 'text-slate-800'}`}>
                      {preset.label}
                    </span>
                    {selectedTime === preset.value && (
                      <CheckCircle2 size={14} className="text-[#EA580C] shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">{preset.desc}</span>
                </button>
              ))}
            </div>

            {/* Custom Time Input */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-600 font-medium">Or custom time:</span>
              <input
                id="custom-time-input"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Section 3: AI Engine / Execution Provider */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={14} className="text-[#0D9488]" />
              AI Intelligence Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedProvider('auto')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedProvider === 'auto'
                    ? 'border-[#0D9488] bg-teal-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Auto (Gemini Multimodal)</span>
                  {selectedProvider === 'auto' && <Sparkles size={14} className="text-[#0D9488]" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Autonomous multi-tool investigation with dynamic LLM reasoning</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider('deterministic')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedProvider === 'deterministic'
                    ? 'border-[#0D9488] bg-teal-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Deterministic Fast-Path</span>
                  {selectedProvider === 'deterministic' && <CheckCircle2 size={14} className="text-[#0D9488]" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Strict mathematical priority sequencing for rapid benchmarking</p>
              </button>
            </div>
          </div>

          {/* Section 4: Reliability Shield / Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} className="text-[#6366F1]" />
              Reliability Shield / Execution Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                id="config-mode-live-btn"
                type="button"
                onClick={() => setSelectedMode('live')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedMode === 'live'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">🟢 Live Pipeline</span>
                  {selectedMode === 'live' && <CheckCircle2 size={14} className="text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Direct external API calls with auto-fallback on timeout</p>
              </button>

              <button
                id="config-mode-cached-btn"
                type="button"
                onClick={() => setSelectedMode('cached')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedMode === 'cached'
                    ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">🔵 Replay Cache</span>
                  {selectedMode === 'cached' && <CheckCircle2 size={14} className="text-blue-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Replay verified recent investigation run (&lt;24h)</p>
              </button>

              <button
                id="config-mode-demo-btn"
                type="button"
                onClick={() => setSelectedMode('demo')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedMode === 'demo'
                    ? 'border-purple-500 bg-purple-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900">🟣 Demo Scenario</span>
                  {selectedMode === 'demo' && <CheckCircle2 size={14} className="text-purple-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Deterministic Phoenix 2024-08-01 heat benchmark</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Info size={14} className="text-slate-400" />
            <span>Target: {selectedDate} @ {selectedTime}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              id="confirm-launch-heat-hunt-btn"
              type="button"
              onClick={handleLaunch}
              disabled={status === 'running'}
              className="px-6 py-2 rounded-full bg-[#EA580C] hover:bg-[#c2410c] active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
            >
              <Radar size={15} />
              <span>Launch Scan</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
