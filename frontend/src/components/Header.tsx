import React, { useState } from 'react';
import {
  Sun,
  MapPin,
  ChevronDown,
  Bell,
  Radar,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Menu,
  User,
  Shield,
  Sparkles,
  SlidersHorizontal,
  Calendar,
} from 'lucide-react';
import { HeaderProps } from '../types';
import { useHeatHunt, useBasicScan } from '../api';
import { HeatHuntConfigModal } from './HeatHuntConfigModal';
import { useCity } from '../context/CityContext';

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
  const [isRefreshingScan, setIsRefreshingScan] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const { activeCity, setActiveCity, supportedCities } = useCity();

  const {
    status,
    runHeatHunt,
    activeMode,
    simulateFailure,
    setSimulateFailure,
  } = useHeatHunt();

  const { data: basicScan } = useBasicScan();

  const currentMode = activeMode || basicScan?.mode || 'live';

  return (
    <header
      id="main-header"
      className="h-16 sm:h-20 bg-white border-b border-[#F1F5F9] px-3 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 select-none sticky top-0 z-20"
    >
      {/* Left: Mobile Hamburger + Greeting & Subtitle */}
      <div id="header-greeting-section" className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 mr-2 sm:mr-4">
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

        <div className="flex flex-col min-w-0 flex-1">
          <h2
            id="header-greeting-text"
            className="text-[#0F172A] font-bold text-sm sm:text-base lg:text-xl tracking-tight leading-tight max-md:truncate max-md:max-w-[200px]"
          >
            {greeting}
          </h2>
          <p
            id="header-subtitle-text"
            className="hidden md:block text-xs sm:text-sm text-[#64748B] tracking-tight leading-tight mt-0.5 truncate max-w-2xl"
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

          {/* Mode / Status Tag */}
          <div
            id="pipeline-status-badge"
            className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider border ${
              currentMode === 'live'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : currentMode === 'cached'
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-orange-50 text-orange-800 border-orange-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                currentMode === 'live'
                  ? 'bg-emerald-500 animate-ping'
                  : currentMode === 'cached'
                  ? 'bg-[#0D9488]'
                  : 'bg-[#F97316]'
              }`}
            />
            <span>
              {currentMode === 'live'
                ? 'Live Telemetry'
                : currentMode === 'cached'
                ? 'Cached Pipeline'
                : 'Demo Scenario'}
            </span>
            {basicScan && (
              <>
                <span className="text-slate-400 font-normal">|</span>
                {/* Show ranked zones from API; supplement with 6-sector metro count when doing a full metro scan */}
                <span>{basicScan.ranked_zones.length} API Zones · 6 Districts</span>
              </>
            )}
            {!basicScan && (
              <>
                <span className="text-slate-400 font-normal">|</span>
                <span>6 Metro Districts</span>
              </>
            )}
          </div>


          {/* Primary RUN HEAT HUNT Button (Autonomous Agent Investigation) */}
          <button
            id="run-heat-hunt-btn"
            type="button"
            onClick={runHeatHunt}
            disabled={status === 'running'}
            title="Execute autonomous AI heat vulnerability investigation and live thermal telemetry hunt"
            className={`min-h-[44px] inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none ${
              status === 'running'
                ? 'bg-orange-400 text-white cursor-not-allowed shadow-inner'
                : 'bg-[#F97316] hover:bg-[#ea580c] active:scale-95 text-white cursor-pointer hover:shadow-md'
            }`}
          >
            {status === 'running' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span className="hidden sm:inline">Agent Investigating...</span>
                <span className="sm:hidden text-[11px]">Hunting...</span>
              </>
            ) : (
              <>
                <Radar size={16} strokeWidth={2.4} />
                <span className="hidden sm:inline">Run Heat Hunt</span>
                <span className="sm:hidden text-[11px]">Heat Hunt</span>
              </>
            )}
          </button>

          {/* Parameters & Custom Date/Time Button */}
          <button
            id="open-heat-hunt-config-btn"
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            disabled={status === 'running'}
            title="Configure custom observation date, time, and AI intelligence model"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
            aria-label="Configure date and time parameters"
          >
            <SlidersHorizontal size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* Custom Heat Hunt Date/Time Config Modal */}
        <HeatHuntConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />

        {/* Location Selector Pill - Min 44px Touch Target with Dynamic Multi-City Engine */}
        <div className="relative">
          <button
            id="location-selector-btn"
            type="button"
            onClick={() => setIsLocationOpen(!isLocationOpen)}
            className="min-h-[44px] flex items-center gap-1 sm:gap-2 bg-slate-50 border border-slate-200 px-2.5 sm:px-3.5 py-2 rounded-full cursor-pointer hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors shadow-2xs shrink-0"
          >
            <MapPin size={14} className="text-[#F97316] shrink-0" strokeWidth={2.2} />
            <span className="text-[11px] sm:text-xs font-bold text-[#0F172A] uppercase tracking-wide truncate max-w-[80px] xs:max-w-none">
              {activeCity.fullName}
            </span>
            <ChevronDown size={12} className="text-[#64748B] shrink-0" strokeWidth={2.2} />
          </button>

          {isLocationOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Select Monitored Metro</span>
                <span className="text-emerald-600 font-bold">{supportedCities.length} Cities</span>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {supportedCities.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      setActiveCity(city);
                      setIsLocationOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                      activeCity.id === city.id
                        ? 'font-bold text-[#F97316] bg-orange-50/60'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-[13px]">{city.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {city.countyFips} FIPS • {city.heatTier} Tier
                      </div>
                    </div>
                    {activeCity.id === city.id && (
                      <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                    )}
                  </button>
                ))}
              </div>

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
              <div className="text-right hidden xl:block">
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
              <ChevronDown size={13} className="text-[#64748B] group-hover:text-[#0F172A] transition-colors hidden xl:block" />
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

