import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Search,
  ArrowUpDown,
  ChevronRight,
  Radar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { WhyPanel } from '../components/WhyPanel';
import { ZoneEvidenceDetail } from '../types';
import { useZones, ZoneData, useHeatHunt } from '../api';
import { getTierConfig, TIER_CONFIG } from '../theme/tiers';

export const RiskZonesPage: React.FC = () => {
  const { data: zones = [], isLoading } = useZones();
  const { runHeatHunt, status: huntStatus } = useHeatHunt();
  const [selectedZone, setSelectedZone] = useState<ZoneEvidenceDetail | null>(null);
  const [isWhyPanelOpen, setIsWhyPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof ZoneData>('responseGapScore');
  const [sortAsc, setSortAsc] = useState(false);

  const handleRowClick = (zoneId: string) => {
    const matchedZone = zones.find((z) => z.id === zoneId);
    if (matchedZone) {
      setSelectedZone(matchedZone.evidence);
      setIsWhyPanelOpen(true);
    }
  };

  const handleSort = (field: keyof ZoneData) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default desc for numeric/risk
    }
  };

  const filteredAndSortedZones = useMemo(() => {
    return zones.filter((zone) => {
      const matchesSearch =
        zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `Zone ${zone.zoneNumber}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.priorityAction.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = tierFilter === 'ALL' || zone.tier === tierFilter;

      return matchesSearch && matchesTier;
    }).sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [zones, searchQuery, tierFilter, sortField, sortAsc]);

  const renderTierBadge = (tier: string) => {
    const config = getTierConfig(tier);
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${config.tintBg} ${config.tintText} ${config.tintBorder}`}
      >
        <Icon size={12} strokeWidth={2.4} />
        <span>{config.shortLabel}</span>
      </span>
    );
  };

  return (
    <div id="risk-zones-page" className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#F1F5F9] rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D9488] shrink-0">
            <MapPin size={22} strokeWidth={2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Phoenix Risk Zones Registry
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                {filteredAndSortedZones.length} Zones Ranked
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Comprehensive municipal heat vulnerability indices and active Response Gap rankings. Select any row to review empirical evidence.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#F1F5F9] rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Tier Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none touch-pan-x" role="group" aria-label="Filter zones by risk tier">
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setTierFilter(tier)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                tierFilter === tier
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tier === 'ALL' ? 'All Zones' : tier}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search zones, actions..."
            aria-label="Search zones or actions"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 min-h-[40px] bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0D9488] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#0D9488] transition-colors"
          />
        </div>
      </div>

      {/* Data Table Card with Horizontal Scroll Affordance on Mobile */}
      <div className="bg-white border border-[#F1F5F9] rounded-3xl overflow-hidden shadow-xs relative">
        {zones.length === 0 ? (
          <div className="p-8 sm:p-14 text-center flex flex-col items-center justify-center max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316] mb-3.5 shadow-2xs">
              <ShieldCheck size={28} strokeWidth={2} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              No Active Risk Clusters Identified
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed text-center">
              Current live telemetry shows standard ambient baselines. Click <strong>"Run Heat Hunt"</strong> to trigger multi-source anomaly scanning, or switch to a historical / demo scenario.
            </p>
            <div className="flex items-center gap-3 mt-5 flex-wrap justify-center">
              <button
                type="button"
                onClick={runHeatHunt}
                disabled={huntStatus === 'running'}
                className="min-h-[40px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Radar size={15} strokeWidth={2.4} />
                <span>{huntStatus === 'running' ? 'Scanning Corridor...' : 'Run Heat Hunt Scan'}</span>
              </button>
              <Link
                to="/agent-insights"
                className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles size={14} className="text-[#F97316]" />
                <span>Load Demo / Historic 7D</span>
              </Link>
            </div>
          </div>
        ) : filteredAndSortedZones.length === 0 ? (
          <div className="p-10 sm:p-12 text-center text-slate-400">
            <p className="text-sm font-bold text-slate-700">No zones matching filter</p>
            <p className="text-xs text-slate-400 mt-1">Adjust your search query or tier filter above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[560px] sm:min-w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th
                    className="py-3.5 px-4 sm:px-5 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('zoneNumber')}
                  >
                    <button type="button" className="flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#F97316] rounded px-1 -mx-1">
                      <span>Zone ID & Name</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th
                    className="py-3.5 px-3 sm:px-4 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('tier')}
                  >
                    <button type="button" className="flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#F97316] rounded px-1 -mx-1">
                      <span>Risk Tier</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th
                    className="py-3.5 px-3 sm:px-4 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('responseGapScore')}
                  >
                    <button type="button" className="flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#F97316] rounded px-1 -mx-1">
                      <span>Response Gap</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th
                    className="py-3.5 px-3 sm:px-4 cursor-pointer hover:text-slate-800 transition-colors hidden sm:table-cell"
                    onClick={() => handleSort('peakTempF')}
                  >
                    <button type="button" className="flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#F97316] rounded px-1 -mx-1">
                      <span>Peak Temp</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th
                    className="py-3.5 px-3 sm:px-4 cursor-pointer hover:text-slate-800 transition-colors hidden md:table-cell"
                    onClick={() => handleSort('population')}
                  >
                    <button type="button" className="flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#F97316] rounded px-1 -mx-1">
                      <span>Population</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Priority Recommended Action</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAndSortedZones.map((zone) => (
                  <tr
                    key={zone.id}
                    id={`risk-zone-row-${zone.id}`}
                    onClick={() => handleRowClick(zone.id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(zone.id);
                      }
                    }}
                    className="hover:bg-slate-50/80 focus-visible:bg-orange-50/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs group-hover:bg-[#0D9488] group-hover:text-white transition-colors shrink-0">
                          {zone.zoneNumber}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#0D9488] transition-colors">
                            {zone.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Zone {zone.zoneNumber} • Updated {zone.lastUpdated}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 sm:px-4">
                      {renderTierBadge(zone.tier)}
                    </td>

                    <td className="py-3.5 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 tabular-nums">
                          {zone.responseGapScore.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400">/ 10</span>
                        <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              zone.responseGapScore >= 8
                                ? TIER_CONFIG.CRITICAL.solidBg
                                : zone.responseGapScore >= 6
                                ? TIER_CONFIG.HIGH.solidBg
                                : zone.responseGapScore >= 4
                                ? TIER_CONFIG.MODERATE.solidBg
                                : TIER_CONFIG.LOW.solidBg
                            }`}
                            style={{ width: `${(zone.responseGapScore / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-slate-700 hidden sm:table-cell">
                      {zone.peakTempF}
                    </td>

                    <td className="py-3.5 px-3 sm:px-4 text-slate-600 hidden md:table-cell">
                      {zone.population}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 hidden lg:table-cell max-w-xs truncate">
                      {zone.priorityAction}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        aria-label={`View evidence for Zone ${zone.zoneNumber} ${zone.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(zone.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 group-hover:bg-[#0D9488] text-slate-700 group-hover:text-white focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none text-[11px] font-bold transition-colors cursor-pointer min-h-[32px]"
                      >
                        <span>WHY</span>
                        <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WHY Evidence Drawer */}
      <WhyPanel
        isOpen={isWhyPanelOpen}
        onClose={() => setIsWhyPanelOpen(false)}
        evidence={selectedZone}
      />
    </div>
  );
};
