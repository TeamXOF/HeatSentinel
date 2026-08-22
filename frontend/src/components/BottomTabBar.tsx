import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Globe,
  MapPin,
  Search,
  Settings,
} from 'lucide-react';

const mobileTabItems = [
  { id: 'overview', label: 'Overview', path: '/', icon: LayoutGrid },
  { id: 'heat-map', label: 'Heat Map', path: '/heat-map', icon: Globe },
  { id: 'risk-zones', label: 'Risk Zones', path: '/risk-zones', icon: MapPin },
  { id: 'agent-insights', label: 'Insights', path: '/agent-insights', icon: Search },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

export const BottomTabBar: React.FC = () => {
  return (
    <nav
      id="mobile-bottom-tab-bar"
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F1F5F9] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around"
    >
      {mobileTabItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            id={`mobile-tab-${item.id}`}
            to={item.path}
            aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[44px] min-w-[56px] px-1 py-1 rounded-xl focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-all duration-150 relative group ${
                isActive
                  ? 'text-[#F97316]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-transform ${
                    isActive ? 'scale-105 bg-orange-50 text-[#F97316]' : ''
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.4 : 1.9}
                    className="shrink-0"
                  />
                </div>
                <span
                  className={`text-[10px] font-bold tracking-tight mt-0.5 leading-none ${
                    isActive ? 'text-[#F97316]' : 'text-[#64748B]'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#F97316] absolute top-1 right-3.5" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
