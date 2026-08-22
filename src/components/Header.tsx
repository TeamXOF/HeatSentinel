import React, { useState } from 'react';
import { Sun, MapPin, ChevronDown, Bell, Radar, Loader2, CheckCircle2, AlertTriangle, RotateCcw, Menu, User, Shield } from 'lucide-react';
import { HeaderProps } from '../types';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { useHeatHunt } from '../api';
import { fetchTestScan } from '../api/fortyguard';

export const Header: React.FC<HeaderProps> = ({
  greeting = 'Good Morning, Team HeatSentinel',
  subtitle = "Here's your city heat intelligence overview",
  alertCount = 3,
  location = 'Phoenix, AZ',
  userName = 'HeatSentinel Team',
  userRole = 'Administrator',
  onOpenMobileMenu,
}) => {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const {
    status,
    runHeatHunt,
    simulateFailure,
    setSimulateFailure,
  } = useHeatHunt();

  const queryClient = useQueryClient();
  const isFetchingHeat = useIsFetching({ queryKey: ['fortyguard-test-scan'] }) > 0;

  const handleLoadHeatData = async () => {
    // Manually trigger the query. Any component listening via useQuery will update.
    await queryClient.fetchQuery({
      queryKey: ['fortyguard-test-scan'],
      queryFn: () => fetchTestScan(),
    });
  };

  return (
    <header
      id="main-header"
      className="h-16 sm:h-20 bg-white border-b border-[#F1F5F9] px-3 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 select-none sticky top-0 z-20"
    >
      {/* Left: Mobile Hamburger + Greeting & Subtitle */}
      <div id="header-greeting-section" className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        {/* Mobile Drawer Trigger */}
        <button
          type="button"
          id="mobile-nav-toggle-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center -ml-1 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none rounded-full transition-colors cursor-pointer shrink-0"
        >
          <Menu size={22} strokeWidth={2.2} />
        </button>

        <div
          id="header-sun-icon"
          aria-hidden="true"
          className="hidden xs:flex w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FFEDD5] items-center justify-center text-[#F97316] shrink-0"
        >
          <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-[#F97316]" strokeWidth={2} />
        </div>

        <div className="flex flex-col min-w-0">
          <h2
            id="header-greeting-text"
            className="text-[#0F172A] font-bold text-sm sm:text-base lg:text-xl tracking-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[320px] md:max-w-none leading-tight"
          >
            {greeting}
          </h2>
          <p
            id="header-subtitle-text"
            className="hidden md:block text-xs sm:text-sm text-[#64748B] tracking-tight truncate leading-tight mt-0.5"
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Heat Hunt Action, Location Pill, Bell Badge, User Block */}
      <div id="header-actions" className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* RUN HEAT HUNT BUTTON & LIVE STATUS INDICATOR */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Status Indicator Toast / Badge */}
          {status === 'running' && (
            <div
              id="heat-hunt-running-indicator"
              role="status"
              aria-live="polite"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-[#C2410C] text-xs font-bold animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping" />
              <span>Investigating...</span>
            </div>
          )}

          {status === 'completed' && (
            <div
              id="heat-hunt-completed-indicator"
              role="status"
              aria-live="polite"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold"
            >
              <CheckCircle2 size={14} className="text-emerald-700" />
              <span>Scan Complete</span>
            </div>
          )}

          {status === 'failed' && (
            <div
              id="heat-hunt-failed-indicator"
              role="status"
              aria-live="polite"
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-bold"
            >
              <AlertTriangle size={14} className="text-red-700" />
              <span>Scan Interrupted</span>
              <button
                type="button"
                onClick={runHeatHunt}
                className="underline hover:text-red-950 focus-visible:ring-2 focus-visible:ring-red-500 rounded cursor-pointer font-extrabold flex items-center gap-1"
              >
                <RotateCcw size={11} />
                Retry
              </button>
            </div>
          )}

          {/* TEMPORARY STEP 12 BUTTON: Load Heat Data */}
          <button
            type="button"
            onClick={handleLoadHeatData}
            disabled={isFetchingHeat}
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              isFetchingHeat
                ? 'bg-blue-300 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white cursor-pointer hover:shadow-md'
            }`}
          >
            {isFetchingHeat ? <Loader2 size={15} className="animate-spin" /> : <Radar size={15} />}
            <span className="hidden sm:inline">Load Heat Data</span>
          </button>

          {/* Primary RUN HEAT HUNT Button - Min 44px Touch Target */}
          <button
            id="run-heat-hunt-btn"
            type="button"
            onClick={runHeatHunt}
            disabled={status === 'running'}
            title="Execute automated AI heat vulnerability and hotspot hunt"
            className={`min-h-[44px] inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none ${
              status === 'running'
                ? 'bg-orange-300 text-white cursor-not-allowed'
                : 'bg-[#F97316] hover:bg-[#ea580c] active:scale-95 text-white cursor-pointer hover:shadow-md'
            }`}
          >
            {status === 'running' ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Radar size={15} strokeWidth={2.4} />
            )}
            <span className="hidden sm:inline">Run Heat Hunt</span>
            <span className="sm:hidden text-[11px]">Hunt</span>
          </button>
        </div>

        {/* Location Selector Pill - Min 44px Touch Target */}
        <div className="relative">
          <button
            id="location-selector-btn"
            type="button"
            onClick={() => setIsLocationOpen(!isLocationOpen)}
            className="min-h-[44px] flex items-center gap-1 sm:gap-2 bg-slate-50 border border-slate-200 px-2.5 sm:px-3.5 py-2 rounded-full cursor-pointer hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors shadow-2xs shrink-0"
          >
            <MapPin size={14} className="text-[#F97316] shrink-0" strokeWidth={2.2} />
            <span className="text-[11px] sm:text-xs font-bold text-[#0F172A] uppercase tracking-wide truncate max-w-[58px] xs:max-w-none">
              {location}
            </span>
            <ChevronDown size={12} className="text-[#64748B] shrink-0" strokeWidth={2.2} />
          </button>

          {isLocationOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Monitored Metro
              </div>
              <button
                type="button"
                onClick={() => setIsLocationOpen(false)}
                className="w-full text-left px-3.5 py-2 text-[13px] font-semibold text-[#F97316] bg-orange-50/50 flex items-center justify-between"
              >
                <span>Phoenix, AZ</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]"></span>
              </button>
              <button
                type="button"
                onClick={() => setIsLocationOpen(false)}
                className="w-full text-left px-3.5 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Tucson, AZ (Preview)
              </button>
              <button
                type="button"
                onClick={() => setIsLocationOpen(false)}
                className="w-full text-left px-3.5 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Las Vegas, NV (Preview)
              </button>

              <div className="border-t border-slate-100 my-1"></div>
              <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Dev Simulation Mode
              </div>
              <button
                type="button"
                onClick={() => setSimulateFailure(!simulateFailure)}
                className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between transition-colors ${
                  simulateFailure ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Simulate Sensor Failure</span>
                <span className={`w-2 h-2 rounded-full ${simulateFailure ? 'bg-red-500' : 'bg-slate-300'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Notification Bell - Min 44px Touch Target */}
        <div className="relative">
          <button
            id="notification-bell-btn"
            type="button"
            aria-label={`Notifications, ${alertCount} active alerts`}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center relative cursor-pointer text-[#64748B] hover:text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors rounded-full hover:bg-slate-50"
          >
            <Bell size={19} strokeWidth={2} />
            {alertCount > 0 && (
              <span
                id="notification-badge"
                className="absolute top-2 right-2 bg-[#DC2626] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold tabular-nums"
              >
                {alertCount}
              </span>
            )}
          </button>
        </div>

        {/* User Block - Avatar only on Mobile (<sm), full details on sm+ */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-2 border-l border-slate-100 pl-1.5 sm:pl-3 ml-0.5 sm:ml-1">
            <button
              id="user-profile-btn"
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center gap-2 text-left cursor-pointer group rounded-full hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none p-1"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-bold text-[#0F172A] group-hover:text-[#F97316] transition-colors">
                  {userName}
                </p>
                <p className="text-[11px] text-[#64748B]">{userRole}</p>
              </div>
              <div
                id="user-avatar"
                className="w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-[#F97316] text-white flex items-center justify-center font-bold text-xs sm:text-sm border-2 border-white shadow-sm shrink-0"
              >
                HS
              </div>
              <ChevronDown size={13} className="text-[#64748B] group-hover:text-[#0F172A] transition-colors hidden sm:block" />
            </button>
          </div>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-12 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <p className="text-xs font-bold text-[#0F172A]">{userName}</p>
                <p className="text-[11px] text-slate-500 font-medium">{userRole}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
              >
                <User size={14} className="text-slate-400" />
                <span>Profile & Access</span>
              </button>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
              >
                <Shield size={14} className="text-slate-400" />
                <span>Alert Subscriptions</span>
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors font-bold"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

