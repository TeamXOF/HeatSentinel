import React from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert, Info, ArrowRight } from 'lucide-react';
import { AlertItem, PriorityAction } from '../types';

interface ActiveAlertsCardProps {
  alerts: AlertItem[];
  className?: string;
}

export const ActiveAlertsCard: React.FC<ActiveAlertsCardProps> = ({
  alerts,
  className = '',
}) => {
  const getSeverityStyles = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'extreme':
        return {
          iconBg: 'bg-[#FEE2E2]',
          iconColor: 'text-[#EF4444]',
          titleColor: 'text-[#EF4444]',
          Icon: TriangleAlert,
        };
      case 'warning':
        return {
          iconBg: 'bg-[#FFEDD5]',
          iconColor: 'text-[#F97316]',
          titleColor: 'text-[#F97316]',
          Icon: TriangleAlert,
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-[#CCFBF1]',
          iconColor: 'text-[#0D9488]',
          titleColor: 'text-[#0D9488]',
          Icon: Info,
        };
    }
  };

  return (
    <div
      id="active-alerts-card"
      className={`bg-white border border-[#F1F5F9] rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col gap-3.5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
        <h3 className="text-[13.5px] font-bold text-[#0F172A] tracking-tight">
          Active Alerts ({alerts.length})
        </h3>
        <Link
          to="/events-alerts"
          id="active-alerts-view-all-link"
          className="text-[11px] font-semibold text-[#0D9488] hover:text-[#0f766e] transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Alert Rows List */}
      <div className="flex flex-col divide-y divide-slate-100">
        {alerts.map((alert) => {
          const { iconBg, iconColor, titleColor, Icon } = getSeverityStyles(alert.severity);

          return (
            <div
              key={alert.id}
              id={`alert-row-${alert.id}`}
              className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5 group"
            >
              {/* Left Colored Icon Badge */}
              <div
                className={`w-7 h-7 rounded-full ${iconBg} ${iconColor} flex items-center justify-center shrink-0 mt-0.5`}
              >
                <Icon size={14} strokeWidth={2.2} />
              </div>

              {/* Alert Content */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-[12px] font-bold leading-snug tracking-tight ${titleColor}`}>
                  {alert.title}
                </span>
                <span className="text-[11px] text-[#64748B] mt-0.5 leading-tight">
                  {alert.description}
                </span>
                <span className="text-[9.5px] text-[#94A3B8] font-medium mt-0.5">
                  {alert.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface TopPriorityActionsCardProps {
  actions: PriorityAction[];
  onActionSelect?: (action: PriorityAction) => void;
  className?: string;
}

export const TopPriorityActionsCard: React.FC<TopPriorityActionsCardProps> = ({
  actions,
  onActionSelect,
  className = '',
}) => {
  const getPriorityBadgeStyles = (priority: PriorityAction['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-[#FEE2E2] text-[#EF4444] border-red-200/60';
      case 'Medium':
        return 'bg-[#FEF3C7] text-[#D97706] border-amber-200/60';
      case 'Low':
      default:
        return 'bg-[#CCFBF1] text-[#0D9488] border-teal-200/60';
    }
  };

  return (
    <div
      id="top-priority-actions-card"
      className={`bg-white border border-[#F1F5F9] rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col gap-3.5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
        <h3 className="text-[13.5px] font-bold text-[#0F172A] tracking-tight">
          Top Priority Actions
        </h3>
        <Link
          to="/response-planner"
          id="priority-actions-view-all-link"
          className="text-[11px] font-semibold text-[#0D9488] hover:text-[#0f766e] transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Numbered Action Rows */}
      <div className="flex flex-col divide-y divide-slate-100">
        {actions.map((action) => {
          const priorityBadgeClass = getPriorityBadgeStyles(action.priority);

          return (
            <div
              key={action.id}
              id={`priority-action-row-${action.id}`}
              onClick={() => onActionSelect && onActionSelect(action)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onActionSelect && onActionSelect(action);
                }
              }}
              className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-50/80 -mx-1.5 px-1.5 rounded-xl transition-colors group"
            >
              {/* Left Number badge + Text */}
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="w-5 h-5 rounded-full bg-[#FFEDD5] text-[#F97316] text-[10.5px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums shadow-2xs group-hover:scale-105 transition-transform">
                  {action.stepNumber}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[12px] font-bold text-[#0F172A] group-hover:text-[#0D9488] transition-colors leading-tight truncate">
                    {action.title}
                  </span>
                  <span className="text-[10.5px] text-[#64748B] mt-0.5 leading-tight truncate">
                    {action.subtitle}
                  </span>
                </div>
              </div>

              {/* Right Priority Pill */}
              <span
                className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider shrink-0 border ${priorityBadgeClass}`}
              >
                {action.priority}
              </span>
            </div>
          );
        })}
      </div>

      {/* Full-width filled teal button to Response Planner */}
      <div className="pt-1.5">
        <Link
          to="/response-planner"
          id="view-response-planner-btn"
          className="w-full inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-full bg-[#0D9488] hover:bg-[#0f766e] text-white text-[11.5px] font-bold transition-all shadow-xs hover:shadow-sm"
        >
          <span>View Response Planner</span>
          <ArrowRight size={13} strokeWidth={2.2} />
        </Link>
      </div>
    </div>
  );
};
