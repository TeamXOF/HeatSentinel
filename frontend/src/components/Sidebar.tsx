import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Globe,
  MapPin,
  TriangleAlert,
  Search,
  LifeBuoy,
  ClipboardList,
  FileText,
  Database,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Logo, LogoIcon } from './Logo';
import { NavItemConfig } from '../types';

export const navItems: NavItemConfig[] = [
  { id: 'overview', label: 'Overview', path: '/', icon: LayoutGrid },
  { id: 'heat-map', label: 'Heat Map', path: '/heat-map', icon: Globe },
  { id: 'risk-zones', label: 'Risk Zones', path: '/risk-zones', icon: MapPin },
  { id: 'events-alerts', label: 'Events & Alerts', path: '/events-alerts', icon: TriangleAlert },
  { id: 'agent-insights', label: 'Agent Insights', path: '/agent-insights', icon: Search },
  { id: 'resources', label: 'Resources', path: '/resources', icon: LifeBuoy },
  { id: 'response-planner', label: 'Response Planner', path: '/response-planner', icon: ClipboardList },
  { id: 'reports', label: 'Reports', path: '/reports', icon: FileText },
  { id: 'data-explorer', label: 'Data Explorer', path: '/data-explorer', icon: Database },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside
      id="sidebar-container"
      className="hidden lg:flex w-[240px] shrink-0 bg-white border-r border-[#F1F5F9] h-screen sticky top-0 flex-col justify-between py-5 px-3.5 select-none z-30 shadow-[1px_0_4px_rgba(0,0,0,0.02)]"
    >
      {/* Top Section: Logo & Nav List */}
      <div className="flex flex-col">
        {/* Brand Header with Transparent Logo */}
        <div id="sidebar-logo" className="px-1.5 mb-6">
          <Logo size="md" variant="compact" />
        </div>

        {/* Navigation List */}
        <nav id="sidebar-nav" aria-label="Primary Navigation" className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-0.5 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                id={`nav-${item.id}`}
                to={item.path}
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2 rounded-full font-medium transition-all duration-150 group text-[13px] focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none ${
                    isActive
                      ? 'bg-[#F97316] text-white shadow-sm font-semibold'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.3 : 2}
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-[#64748B] group-hover:text-[#0F172A]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Mission Card - Transparent & Elegant */}
      <div id="sidebar-promo-card" className="mt-auto pt-3">
        <div className="bg-gradient-to-br from-teal-50/80 via-white to-orange-50/70 rounded-2xl p-3.5 border border-teal-100/80 shadow-xs flex flex-col gap-2.5 relative overflow-hidden group hover:shadow-md transition-all">
          {/* Subtle Ambient Light Accents */}
          <div className="absolute -top-8 -right-8 w-20 h-20 bg-orange-200/30 rounded-full blur-lg pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-teal-200/30 rounded-full blur-lg pointer-events-none" />

          {/* Transparent Emblem & Tag */}
          <div className="flex items-center gap-2.5 relative z-10">
            <LogoIcon size={34} />
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#0F172A] tracking-tight">
                HeatSentinel AI
              </span>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-[#0D9488]">
                <Sparkles size={10} className="text-[#F97316]" />
                Municipal Core
              </span>
            </div>
          </div>

          <p className="text-[11px] leading-snug text-slate-600 font-medium relative z-10">
            Turning heat data into life-saving decisions.
          </p>
        </div>
      </div>
    </aside>
  );
};
