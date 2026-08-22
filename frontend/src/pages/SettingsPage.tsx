import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Sliders,
  Shield,
  Palette,
  CheckCircle2,
  Save,
  Radio,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsCriticalOnly, setSmsCriticalOnly] = useState(true);
  const [autoHuntInterval, setAutoHuntInterval] = useState('15');
  const [themeMode, setThemeMode] = useState('Light (Standard)');
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div id="settings-page" className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#F1F5F9] rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
            <SettingsIcon size={22} strokeWidth={2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-[#0F172A] tracking-tight">
                System & Account Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                Admin Console
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Configure telemetry scan thresholds, dispatch alert subscriptions, and municipal profile preferences.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="min-h-[40px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:outline-none transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
        >
          {savedToast ? (
            <span role="status" aria-live="polite" className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>Saved!</span>
            </span>
          ) : (
            <>
              <Save size={14} />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: User & Municipality Profile */}
        <div className="bg-white border border-[#F1F5F9] rounded-3xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
              <User size={16} />
            </div>
            <h2 className="text-sm font-bold text-[#0F172A]">Operator Profile</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="operator-name" className="block text-slate-600 font-semibold mb-1">Operator Name</label>
              <input
                id="operator-name"
                type="text"
                defaultValue="Alex Rivera"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-[#0D9488] focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              />
            </div>

            <div>
              <label htmlFor="operator-org" className="block text-slate-600 font-semibold mb-1">Organization / Department</label>
              <input
                id="operator-org"
                type="text"
                defaultValue="City of Phoenix — Office of Heat Response & Mitigation"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-[#0D9488] focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              />
            </div>

            <div>
              <label htmlFor="assigned-corridor" className="block text-slate-600 font-semibold mb-1">Assigned Operational Corridor</label>
              <select
                id="assigned-corridor"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-[#0D9488] focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              >
                <option>Phoenix Metropolitan Area (Maricopa Grid)</option>
                <option>Las Vegas Regional Grid (Preview)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Notification & Dispatch Subscriptions */}
        <div className="bg-white border border-[#F1F5F9] rounded-3xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#EF4444] flex items-center justify-center">
              <Bell size={16} />
            </div>
            <h2 className="text-sm font-bold text-[#0F172A]">Alert Subscriptions</h2>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Email Daily Briefing</p>
                <p className="text-slate-500 text-[11px]">Receive 6:00 AM daily thermal hazard outlook</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-[#0D9488] accent-[#0D9488] rounded-sm focus-visible:ring-2 focus-visible:ring-[#0D9488] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">SMS Critical Spike Alerts</p>
                <p className="text-slate-500 text-[11px]">Instant text alert when any zone exceeds 8.0 Gap</p>
              </div>
              <input
                type="checkbox"
                checked={smsCriticalOnly}
                onChange={(e) => setSmsCriticalOnly(e.target.checked)}
                className="w-4 h-4 text-[#0D9488] accent-[#0D9488] rounded-sm focus-visible:ring-2 focus-visible:ring-[#0D9488] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Sound Tone on Critical Events</p>
                <p className="text-slate-500 text-[11px]">Audible notification in dispatch console</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-[#0D9488] accent-[#0D9488] rounded-sm focus-visible:ring-2 focus-visible:ring-[#0D9488] cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Card 3: Autonomous Agent Parameters */}
        <div className="bg-white border border-[#F1F5F9] rounded-3xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center">
              <Sliders size={16} />
            </div>
            <h2 className="text-sm font-bold text-[#0F172A]">Telemetry Hunt Cycles</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="hunt-freq" className="block text-slate-600 font-semibold mb-1">
                Automated Background Hunt Frequency
              </label>
              <select
                id="hunt-freq"
                value={autoHuntInterval}
                onChange={(e) => setAutoHuntInterval(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-[#0D9488] focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              >
                <option value="5">Every 5 Minutes (High Priority Weather)</option>
                <option value="15">Every 15 Minutes (Standard Mode)</option>
                <option value="60">Every 1 Hour (Conservation Mode)</option>
              </select>
            </div>

            <div>
              <label htmlFor="thermal-sens" className="block text-slate-600 font-semibold mb-1">
                Thermal Exceedance Sensitivity
              </label>
              <input
                id="thermal-sens"
                type="range"
                min="1"
                max="10"
                defaultValue="7"
                className="w-full accent-[#0D9488] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>Conservative (±5°F)</span>
                <span>Balanced (±3°F)</span>
                <span>Hyper-Sensitive (±1.5°F)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Interface & Display Theme */}
        <div className="bg-white border border-[#F1F5F9] rounded-3xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center">
              <Palette size={16} />
            </div>
            <h2 className="text-sm font-bold text-[#0F172A]">Display & Interface</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="theme-select" className="block text-slate-600 font-semibold mb-1">Theme Archetype</label>
              <select
                id="theme-select"
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-[#0D9488] focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              >
                <option>Light (Standard Warm Teal / Slate)</option>
                <option>High Contrast Tactical Light</option>
              </select>
            </div>

            <div>
              <span className="block text-slate-600 font-semibold mb-1">Temperature Unit Display</span>
              <div className="flex items-center gap-4 mt-1" role="radiogroup" aria-label="Temperature unit selection">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input type="radio" name="tempUnit" defaultChecked className="accent-[#0D9488] focus-visible:ring-2 focus-visible:ring-[#0D9488]" />
                  <span>Fahrenheit (°F) with Celsius (°C)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input type="radio" name="tempUnit" className="accent-[#0D9488] focus-visible:ring-2 focus-visible:ring-[#0D9488]" />
                  <span>Celsius Only (°C)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
