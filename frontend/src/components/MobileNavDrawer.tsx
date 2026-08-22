import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X, Radar, Sparkles } from 'lucide-react';
import { Logo, LogoIcon } from './Logo';
import { navItems } from './Sidebar';
import { useHeatHunt } from '../api';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { runHeatHunt, status } = useHeatHunt();

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer open
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

  if (!isOpen) return null;

  return (
    <div
      id="mobile-nav-backdrop"
      className="fixed inset-0 z-50 lg:hidden flex bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-nav-title"
    >
      <div
        id="mobile-nav-panel"
        className="w-[280px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between py-5 px-4 overflow-y-auto animate-in slide-in-from-left duration-200 z-50 border-r border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Logo */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between px-1">
            <div id="mobile-drawer-logo" className="flex-1 pr-2">
              <Logo size="sm" variant="compact" />
            </div>
            <button
              type="button"
              id="mobile-nav-close-btn"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} strokeWidth={2.2} />
            </button>
          </div>

          {/* Quick Hunt Action */}
          <div className="px-1">
            <button
              type="button"
              onClick={() => {
                runHeatHunt();
                onClose();
              }}
              disabled={status === 'running'}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#F97316] text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:bg-[#ea580c] active:scale-98 transition-all min-h-[44px] cursor-pointer"
            >
              <Radar size={16} />
              <span>{status === 'running' ? 'Scanning...' : 'Run Heat Hunt'}</span>
            </button>
          </div>

          {/* Full Navigation List */}
          <nav className="flex flex-col gap-1 pr-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Main Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  id={`mobile-drawer-nav-${item.id}`}
                  to={item.path}
                  onClick={onClose}
                  aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-full font-medium transition-all duration-150 min-h-[44px] text-sm focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none ${
                      isActive
                        ? 'bg-[#F97316] text-white shadow-xs font-bold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2.3 : 2}
                        className={`shrink-0 ${
                          isActive ? 'text-white' : 'text-[#64748B]'
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

        {/* Bottom Mission Card */}
        <div id="mobile-sidebar-promo" className="mt-6 pt-4 border-t border-slate-100">
          <div className="bg-gradient-to-br from-teal-50/80 via-white to-orange-50/70 rounded-2xl p-3.5 border border-teal-100/80 shadow-xs flex flex-col gap-2 relative overflow-hidden">
            <div className="flex items-center gap-2.5">
              <LogoIcon size={30} />
              <div className="flex flex-col">
                <span className="text-xs font-black text-[#0F172A]">HeatSentinel AI</span>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-[#0D9488]">
                  <Sparkles size={10} className="text-[#F97316]" />
                  Municipal Core
                </span>
              </div>
            </div>
            <p className="text-[10.5px] leading-snug text-slate-600 font-medium">
              Turning heat data into life-saving decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
