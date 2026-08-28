import React from 'react';
import { StatCard, StatCardVariant } from '../types';

interface KpiStatCardsProps {
  cards: StatCard[];
}

const variantStyles: Record<
  StatCardVariant,
  {
    cardBg: string;
    cardBorder: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  orange: {
    cardBg: 'bg-[#FFF9F5]',
    cardBorder: 'border-orange-100/70',
    iconBg: 'bg-[#FFEDD5]',
    iconColor: 'text-[#F97316]',
  },
  teal: {
    cardBg: 'bg-[#F4FDFB]',
    cardBorder: 'border-teal-100/70',
    iconBg: 'bg-[#CCFBF1]',
    iconColor: 'text-[#0D9488]',
  },
  red: {
    cardBg: 'bg-[#FFF5F5]',
    cardBorder: 'border-red-100/70',
    iconBg: 'bg-[#FEE2E2]',
    iconColor: 'text-[#EF4444]',
  },
  cyan: {
    cardBg: 'bg-[#F0FDFB]',
    cardBorder: 'border-teal-100/70',
    iconBg: 'bg-[#CCFBF1]',
    iconColor: 'text-[#14B8A6]',
  },
  amber: {
    cardBg: 'bg-[#FFFDF5]',
    cardBorder: 'border-amber-100/70',
    iconBg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#F59E0B]',
  },
};

const getStatusColor = (statusType?: string) => {
  switch (statusType) {
    case 'orange':
      return 'text-[#F97316] font-semibold';
    case 'teal':
      return 'text-[#0D9488] font-semibold';
    case 'red':
      return 'text-[#EF4444] font-semibold';
    default:
      return 'text-[#64748B] font-medium';
  }
};

export const KpiCardItem: React.FC<{ card: StatCard }> = ({ card }) => {
  const Icon = card.icon;
  const style = variantStyles[card.variant] || variantStyles.orange;
  const statusColorClass = getStatusColor(card.statusType);

  return (
    <div
      id={`stat-card-${card.id}`}
      className={`min-w-[240px] sm:min-w-0 snap-start flex-1 rounded-2xl ${style.cardBg} border ${style.cardBorder} p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition-all duration-200 flex items-center gap-3`}
    >
      {/* Icon Badge */}
      <div
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${style.iconBg} ${style.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
      >
        <Icon size={19} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex flex-col min-w-0 flex-1">
        {/* Label */}
        <span className="text-[9.5px] sm:text-[10px] font-bold tracking-wider text-[#64748B] uppercase truncate leading-tight">
          {card.label}
        </span>

        {/* Value + Status */}
        <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xl sm:text-[22px] font-bold text-[#0F172A] tabular-nums tracking-tight leading-none">
            {card.value}
          </span>
          {card.status && (
            <span className={`text-[11px] font-semibold leading-none ${statusColorClass}`}>
              {card.status}
            </span>
          )}
        </div>

        {/* Subtext with trend indicator */}
        <div className="mt-1 text-[11px] text-[#64748B] font-medium truncate flex items-center gap-1">
          <span>{card.subtext}</span>
        </div>
      </div>
    </div>
  );
};

export const KpiStatCards: React.FC<KpiStatCardsProps> = ({ cards }) => {
  return (
    <section
      id="kpi-stat-cards-container"
      aria-label="Key Performance Indicators"
      className="w-full"
    >
      {/* Horizontally scrollable on mobile with snap, 2-cols on sm, 3-cols on md/lg, 5-cols on xl */}
      <div className="flex overflow-x-auto pb-3 pt-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 snap-x snap-mandatory scrollbar-none overscroll-x-contain touch-pan-x">
        {cards.map((card) => (
          <div key={card.id} className="min-w-[245px] xs:min-w-[260px] sm:min-w-0 snap-start flex-1 shrink-0">
            <KpiCardItem card={card} />
          </div>
        ))}
      </div>
    </section>
  );
};
