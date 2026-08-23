import React from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';
import {
  RiskZoneSummaryData,
  PopulationAtRiskData,
  ResourceReadinessData,
} from '../types';
import {
  mockRiskZoneSummary,
  mockPopulationAtRisk,
  mockResourceReadiness,
} from '../data/mockAnalyticsData';

// CARD 1: Risk Zone Summary
interface RiskZoneSummaryCardProps {
  data?: RiskZoneSummaryData;
  className?: string;
}

export const RiskZoneSummaryCard: React.FC<RiskZoneSummaryCardProps> = ({
  data = mockRiskZoneSummary,
  className = '',
}) => {
  return (
    <div
      id="analytics-risk-zone-summary-card"
      className={`bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-xs flex flex-col justify-between ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">
          Risk Zone Summary
        </h3>
        <Link
          to="/heat-map"
          id="risk-zone-summary-view-all-link"
          className="text-xs font-semibold text-[#0D9488] hover:text-[#0f766e] transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Donut Chart + Legend */}
      <div className="py-2 flex items-center justify-between gap-2">
        {/* Donut Chart with Center Text */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.segments}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={58}
                paddingAngle={3}
                stroke="#FFFFFF"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {data.segments.map((segment) => (
                  <Cell key={segment.name} fill={segment.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Donut Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-xl font-black text-[#0F172A] leading-tight tabular-nums">
              {data.totalCount}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] leading-tight">
              Total Zones
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex flex-col gap-2 min-w-0 flex-1 pl-2">
          {data.segments.map((seg) => (
            <div key={seg.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-semibold text-[#0F172A] truncate">
                  {seg.name}
                </span>
              </div>
              <span className="font-bold text-[#64748B] tabular-nums pl-2">
                {seg.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-label note */}
      <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-[#64748B]">
        <span>Metropolitan Phoenix Area</span>
        <span className="font-semibold text-[#F97316]">7 High/Extreme</span>
      </div>
    </div>
  );
};

// CARD 2: Population at Risk
interface PopulationAtRiskCardProps {
  data?: PopulationAtRiskData;
  className?: string;
}

export const PopulationAtRiskCard: React.FC<PopulationAtRiskCardProps> = ({
  data = mockPopulationAtRisk,
  className = '',
}) => {
  return (
    <div
      id="analytics-population-at-risk-card"
      className={`bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-xs flex flex-col justify-between ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">
          Population at Risk
        </h3>
        <Link
          to="/vulnerability-index"
          id="population-at-risk-view-details-link"
          className="text-xs font-semibold text-[#0D9488] hover:text-[#0f766e] transition-colors"
        >
          View details
        </Link>
      </div>

      {/* Main Metric Hero */}
      <div className="py-2 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#0F172A] tracking-tight tabular-nums leading-none">
              {data.total}
            </span>
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              {data.subtitle}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#EF4444] mt-1">
            {data.riskCategory}
          </span>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#FFEDD5] flex items-center justify-center text-[#F97316] shrink-0 shadow-2xs">
          <Users size={24} strokeWidth={2} />
        </div>
      </div>

      {/* Breakdown Rows */}
      <div className="flex flex-col gap-2 pt-1 border-t border-slate-100/80">
        {data.breakdowns.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs py-0.5"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-lg ${item.bgColor} ${item.color} flex items-center justify-center shrink-0`}
                >
                  <Icon size={14} strokeWidth={2.2} />
                </div>
                <span className="font-medium text-[#0F172A]">{item.label}</span>
              </div>
              <span className="font-bold text-[#0F172A] tabular-nums">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// CARD 3: Resource Readiness
interface ResourceReadinessCardProps {
  data?: ResourceReadinessData;
  className?: string;
}

export const ResourceReadinessCard: React.FC<ResourceReadinessCardProps> = ({
  data = mockResourceReadiness,
  className = '',
}) => {
  // SVG circular gauge calculation
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.percentage / 100) * circumference;

  return (
    <div
      id="analytics-resource-readiness-card"
      className={`bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-xs flex flex-col justify-between ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">
          Resource Readiness
        </h3>
        <Link
          to="/cooling-centers"
          id="resource-readiness-view-all-link"
          className="text-xs font-semibold text-[#0D9488] hover:text-[#0f766e] transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Radial Progress Gauge + High-level indicator */}
      <div className="py-2 flex items-center gap-4">
        {/* Custom SVG Radial Gauge */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            {/* Background track */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="#CCFBF1"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Progress fill */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="#0D9488"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Centered Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
            <span className="text-[15px] font-black text-[#0F172A] leading-tight tabular-nums">
              {data.percentage}%
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#0D9488] leading-tight">
              {data.statusLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-bold text-[#0F172A]">
            Active City Capacities
          </span>
          <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
            Sufficient thermal buffering for high vulnerability corridors today.
          </p>
        </div>
      </div>

      {/* Breakdown Rows */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-slate-100/80">
        {data.breakdowns.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-center justify-between text-xs py-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className={`w-5 h-5 rounded-md ${item.bgColor} ${item.color} flex items-center justify-center shrink-0`}
                >
                  <Icon size={12} strokeWidth={2.2} />
                </div>
                <span className="text-[11.5px] font-medium text-[#0F172A] truncate">
                  {item.label}
                </span>
              </div>
              <span className="text-[11.5px] font-bold text-[#0F172A] tabular-nums pl-1">
                {item.current}/{item.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
