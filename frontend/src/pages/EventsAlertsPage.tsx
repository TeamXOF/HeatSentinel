import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  BellRing,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAlerts, FullAlertItem } from '../api';
import { getTierConfig } from '../theme/tiers';

export const EventsAlertsPage: React.FC = () => {
  const { alerts, toggleAcknowledge, acknowledgeAll } = useAlerts();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert: FullAlertItem) => {
      const matchesCategory =
        filterCategory === 'ALL' || alert.category.toUpperCase() === filterCategory.toUpperCase();
      const matchesSearch =
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [alerts, filterCategory, searchQuery]);

  const getCategoryStyles = (category: string) => {
    const tierKey =
      category.toUpperCase() === 'CRITICAL'
        ? 'CRITICAL'
        : category.toUpperCase() === 'WARNING'
        ? 'HIGH'
        : 'LOW';
    const cfg = getTierConfig(tierKey);
    return {
      badge: `${cfg.tintBg} ${cfg.tintText} ${cfg.tintBorder}`,
      iconBg: cfg.tintBg,
      iconColor: cfg.tintText,
      icon: cfg.icon,
    };
  };

  return (
    <div id="events-alerts-page" className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#F1F5F9] rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#DC2626] shrink-0">
            <BellRing size={22} strokeWidth={2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Events & Real-Time Alerts Feed
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                Live Broadcast
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Live notifications of sudden heat spikes, threshold exceedances, and public health response requests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={acknowledgeAll}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors cursor-pointer"
          >
            <CheckCircle2 size={14} className="text-[#0D9488]" />
            <span>Acknowledge All</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#F1F5F9] rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none touch-pan-x" role="tablist" aria-label="Filter alerts by severity">
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={filterCategory === cat}
              onClick={() => setFilterCategory(cat)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL' ? 'All Alerts' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search alerts by zone, topic..."
            aria-label="Search alerts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 min-h-[40px] bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0D9488] focus-visible:ring-2 focus-visible:ring-[#0D9488] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="flex flex-col gap-3.5 sm:gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white border border-[#F1F5F9] rounded-3xl p-10 sm:p-12 text-center text-slate-400">
            <ShieldCheck size={40} className="mx-auto text-slate-300 stroke-1 mb-2" />
            <p className="text-sm font-bold text-slate-700">No alerts matching filter</p>
            <p className="text-xs text-slate-400 mt-1">Adjust your search or category filter above.</p>
          </div>
        ) : (
          filteredAlerts.map((alert: FullAlertItem) => {
            const { badge, iconBg, iconColor, icon: IconComponent } = getCategoryStyles(alert.category);
            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`bg-white border rounded-3xl p-4 sm:p-6 shadow-xs transition-all flex flex-col md:flex-row items-start justify-between gap-4 sm:gap-5 ${
                  alert.acknowledged ? 'border-[#F1F5F9] opacity-85' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
                    <IconComponent size={19} strokeWidth={2.2} />
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border uppercase tracking-wider ${badge}`}>
                        {alert.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                        <MapPin size={13} className="text-[#EA580C]" />
                        <span>{alert.zoneName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                        <Clock size={12} />
                        <span>{alert.timeAgo} ({alert.timestamp})</span>
                      </div>
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-[#0F172A] tracking-tight">
                      {alert.title}
                    </h2>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {alert.description}
                    </p>

                    <div className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs">
                      <span className="font-bold text-[#0f766e] uppercase text-[10px] shrink-0 mt-0.5">
                        Tactical Protocol:
                      </span>
                      <span className="text-slate-700 font-medium">{alert.mitigation}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center sm:items-end justify-between w-full md:w-auto gap-2 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => toggleAcknowledge(alert.id)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:outline-none transition-all cursor-pointer ${
                      alert.acknowledged
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-[#0D9488] hover:bg-[#0f766e] text-white shadow-2xs'
                    }`}
                  >
                    {alert.acknowledged ? '✓ Acknowledged' : 'Acknowledge'}
                  </button>

                  <Link
                    to="/response-planner"
                    className="min-h-[36px] inline-flex items-center gap-1 text-xs font-bold text-[#C2410C] hover:underline focus-visible:ring-2 focus-visible:ring-[#F97316] rounded cursor-pointer px-2"
                  >
                    <span>Plan Action</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
