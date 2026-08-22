import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Download,
} from 'lucide-react';
import { useTelemetryRecords, RawTelemetryRecord } from '../api';

export const DataExplorerPage: React.FC = () => {
  const { data: records = [] } = useTelemetryRecords();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    return records.filter((row: RawTelemetryRecord) =>
      row.zoneId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [records, searchQuery]);

  return (
    <div id="data-explorer-page" className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#F1F5F9] rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D9488] shrink-0">
            <Database size={22} strokeWidth={2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Raw Telemetry & Metric Explorer
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                SQL / Parquet View
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Inspect tabular raw sensor telemetry, thermal exceedances, and demographic coefficients.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {}}
          className="min-h-[40px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:outline-none transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#F1F5F9] rounded-3xl p-3.5 sm:p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search records by Zone or Record ID..."
            aria-label="Search telemetry records"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 min-h-[40px] bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0D9488] focus-visible:ring-2 focus-visible:ring-[#0D9488] focus:bg-white transition-colors"
          />
        </div>

        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
          Showing {filteredData.length} records
        </span>
      </div>

      {/* Raw Table with Horizontal Scroll Affordance */}
      <div className="bg-white border border-[#F1F5F9] rounded-3xl overflow-hidden shadow-xs relative">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse font-mono text-xs min-w-[620px] sm:min-w-full">
            <caption className="sr-only">Raw telemetry and demographic metric records for municipal microclimate zones</caption>
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">
                <th scope="col" className="py-3.5 px-4 sm:px-5">Record ID</th>
                <th scope="col" className="py-3.5 px-3 sm:px-4">Zone</th>
                <th scope="col" className="py-3.5 px-3 sm:px-4">Temp (°F)</th>
                <th scope="col" className="py-3.5 px-3 sm:px-4">Heat Index</th>
                <th scope="col" className="py-3.5 px-3 sm:px-4">Vuln Index</th>
                <th scope="col" className="py-3.5 px-3 sm:px-4">Canopy %</th>
                <th scope="col" className="py-3.5 px-3 sm:px-4">Cooling Dist</th>
                <th scope="col" className="py-3.5 px-4 sm:px-5 text-right">Response Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row: RawTelemetryRecord) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 sm:px-5 font-bold text-slate-800">{row.id}</td>
                  <td className="py-3 px-3 sm:px-4 text-[#0D9488] font-bold">{row.zoneId}</td>
                  <td className="py-3 px-3 sm:px-4 text-slate-700">{row.tempF.toFixed(1)}°F</td>
                  <td className="py-3 px-3 sm:px-4 text-slate-700">{row.heatIndexF.toFixed(1)}°F</td>
                  <td className="py-3 px-3 sm:px-4 text-slate-700">{(row.vulnerabilityIndex * 100).toFixed(0)}%</td>
                  <td className="py-3 px-3 sm:px-4 text-slate-700">{row.treeCanopyPct.toFixed(1)}%</td>
                  <td className="py-3 px-3 sm:px-4 text-slate-700">{row.coolingDistMi} mi</td>
                  <td className="py-3 px-4 sm:px-5 text-right font-bold text-[#EA580C]">
                    {row.responseGap.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
