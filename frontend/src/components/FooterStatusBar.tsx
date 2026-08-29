import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowRight, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AgentStatusBarData } from '../types';
import { useHeatHunt } from '../api';
import { LogoIcon } from './Logo';

interface FooterStatusBarProps {
  data?: AgentStatusBarData;
  onRefresh?: () => void;
  className?: string;
}

const DEFAULT_STATUS_BAR: AgentStatusBarData = {
  agentName: 'Sentinel-1 Autonomous Thermal Agent',
  status: 'ACTIVE',
  location: 'Phoenix Metro Grid',
  dataPointsCount: 42890,
  lastUpdated: 'Just now (10s ago)',
};

export const FooterStatusBar: React.FC<FooterStatusBarProps> = ({
  data = DEFAULT_STATUS_BAR,
  onRefresh,
  className = '',
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { status, runHeatHunt } = useHeatHunt();

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    }
    // Also trigger Heat Hunt if idle
    if (status === 'idle') {
      runHeatHunt();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const getStatusBadge = () => {
    if (status === 'running') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-[#F97316] text-[10px] font-bold tracking-wider uppercase">
          <Loader2 size={10} className="animate-spin" />
          HUNTING HOTSPOTS
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold tracking-wider uppercase">
          <AlertTriangle size={10} />
          TELEMETRY INTERRUPTED
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-wider uppercase">
          <CheckCircle2 size={10} />
          ZONES REFRESHED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#CCFBF1] text-[#0D9488] text-[10px] font-bold tracking-wider uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
        {data.status}
      </span>
    );
  };

  return (
    <footer
      id="overview-footer-status-bar"
      aria-label="Agent Status and Telemetry"
      className={`w-full bg-white border border-[#F1F5F9] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      {/* Left side: Logo + Agent Name + ACTIVE badge + Data points */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-3.5 min-w-0">
        {/* Geometric Mark Logo Icon */}
        <LogoIcon size={34} />

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-[#0F172A] tracking-tight">
              {data.agentName}
            </span>
            {getStatusBadge()}
          </div>

          <span className="text-[11px] text-[#64748B] tracking-tight truncate">
            Monitoring <strong className="text-[#0F172A] font-semibold">{data.dataPointsCount.toLocaleString()}</strong> data points across {data.location}
          </span>
        </div>
      </div>

      {/* Right side: Last updated + Refresh button + Agent Insights button */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 self-end md:self-auto">
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <span>Last updated: <strong className="text-[#0F172A] font-medium">{data.lastUpdated}</strong></span>
          <button
            type="button"
            onClick={handleRefreshClick}
            aria-label="Refresh telemetry and run scan"
            title="Refresh telemetry and run scan"
            className="p-1 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RefreshCw
              size={13}
              strokeWidth={2}
              className={`${isRefreshing || status === 'running' ? 'animate-spin text-[#0D9488]' : ''}`}
            />
          </button>
        </div>

        <Link
          to="/agent-insights"
          id="footer-agent-insights-btn"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0D9488] hover:bg-[#0f766e] text-white text-[11.5px] font-semibold transition-all shadow-xs hover:shadow-sm"
        >
          <span>Agent Insights</span>
          <ArrowRight size={13} strokeWidth={2.2} />
        </Link>
      </div>
    </footer>
  );
};
