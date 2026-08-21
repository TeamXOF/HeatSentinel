import React, { useState, useMemo } from 'react';
import {
  LifeBuoy,
  Snowflake,
  Droplets,
  Truck,
  Stethoscope,
  MapPin,
  Search,
  Clock,
  Compass,
} from 'lucide-react';
import { useResources, useResourceReadiness, ResourceItem } from '../api';

export const ResourcesPage: React.FC = () => {
  const { data: resources = [] } = useResources();
  const { data: resourceReadiness } = useResourceReadiness();
  const [activeType, setActiveType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredResources = useMemo(() => {
    return resources.filter((res: ResourceItem) => {
      const matchesType = activeType === 'ALL' || res.type === activeType;
      const matchesSearch =
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.zone.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [resources, activeType, searchQuery]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Cooling Center':
        return { icon: Snowflake, color: 'text-[#0D9488]', bg: 'bg-[#CCFBF1]' };
      case 'Water Station':
        return { icon: Droplets, color: 'text-[#0284C7]', bg: 'bg-[#E0F2FE]' };
      case 'Mobile Unit':
        return { icon: Truck, color: 'text-[#F97316]', bg: 'bg-[#FFEDD5]' };
      case 'Medical Team':
      default:
        return { icon: Stethoscope, color: 'text-[#EF4444]', bg: 'bg-[#FEE2E2]' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Operational':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CCFBF1] text-[#0D9488] border border-teal-200">
            Operational
          </span>
        );
      case 'High Demand':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#EF4444] border border-red-200">
            High Demand
          </span>
        );
      case 'Replenishing':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-amber-200">
            Replenishing
          </span>
        );
      case 'Standby':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Standby
          </span>
        );
    }
  };

  return (
    <div id="resources-page" className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#F1F5F9] rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D9488] shrink-0">
            <LifeBuoy size={22} strokeWidth={2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Protective Resources & Facilities
              </h1>
              {resourceReadiness && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#CCFBF1] text-[#0D9488] text-[10px] font-bold uppercase tracking-wider">
                  {resourceReadiness.percentage}% Readiness
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              MAG Heat Relief Network directory — cooling centers, automated hydration stations, and rapid response units.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Readiness Grid */}
      {resourceReadiness && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {resourceReadiness.breakdowns.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white border border-[#F1F5F9] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs flex items-center gap-2.5 sm:gap-3.5"
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center shrink-0`}>
                  <IconComp size={17} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-tight truncate">
                    {item.label}
                  </p>
                  <p className="text-sm sm:text-base font-black text-[#0F172A] leading-tight mt-0.5">
                    {item.current}{' '}
                    <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ {item.total}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#F1F5F9] rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none touch-pan-x" role="tablist" aria-label="Filter resources by facility type">
          {['ALL', 'Cooling Center', 'Water Station', 'Mobile Unit', 'Medical Team'].map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={activeType === t}
              onClick={() => setActiveType(t)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:outline-none transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeType === t
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t === 'ALL' ? 'All Resources' : t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search facility, zone, address..."
            aria-label="Search facilities and resources"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 min-h-[40px] bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0D9488] focus-visible:ring-2 focus-visible:ring-[#0D9488] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredResources.map((res: ResourceItem) => {
          const { icon: TypeIcon, color, bg } = getTypeIcon(res.type);
          return (
            <div
              key={res.id}
              id={`resource-card-${res.id}`}
              className="bg-white border border-[#F1F5F9] hover:border-slate-300 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between gap-4"
            >
              <div>
                {/* Card Top: Type Icon & Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                      <TypeIcon size={16} strokeWidth={2.2} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {res.type}
                    </span>
                  </div>
                  {getStatusBadge(res.status)}
                </div>

                {/* Name & Address */}
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight leading-snug">
                  {res.name}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin size={13} className="text-[#EA580C] shrink-0" />
                  <span className="truncate">{res.address}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 ml-4 font-mono">
                  {res.zone}
                </div>
              </div>

              {/* Card Bottom Stats */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-500" />
                  <span>{res.hours}</span>
                </div>
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <Compass size={12} className="text-[#0D9488]" />
                  <span>{res.distance}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
