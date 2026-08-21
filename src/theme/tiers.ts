import { Flame, AlertTriangle, AlertCircle, CheckCircle2, LucideIcon } from 'lucide-react';
import { RiskTier } from '../types';

export interface TierConfig {
  id: RiskTier;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  // Accessible WCAG AA Contrast Color Tokens
  // Solid button / solid badge: white text on dark/vivid background
  solidBg: string; // e.g. bg-[#DC2626]
  solidText: string; // text-white
  // Tinted background / pill: dark legible text on light tint (> 4.5:1 contrast)
  tintBg: string; // e.g. bg-[#FEF2F2]
  tintText: string; // e.g. text-[#B91C1C] (AA compliant > 4.5:1 on #FEF2F2)
  tintBorder: string; // e.g. border-red-200
  // Hex color codes for SVG / Map / Canvas
  hex: string;
  hexLight: string;
  // Ring / Accent
  ringColor: string;
  dotColor: string;
}

export const TIER_CONFIG: Record<RiskTier, TierConfig> = {
  CRITICAL: {
    id: 'CRITICAL',
    label: 'Critical Risk',
    shortLabel: 'Critical',
    icon: Flame,
    solidBg: 'bg-[#DC2626]', // WCAG AA compliant red
    solidText: 'text-white',
    tintBg: 'bg-[#FEF2F2]',
    tintText: 'text-[#B91C1C]', // 5.9:1 contrast ratio against #FEF2F2
    tintBorder: 'border-red-200',
    hex: '#DC2626',
    hexLight: '#FEE2E2',
    ringColor: 'ring-[#DC2626]/20',
    dotColor: 'bg-[#DC2626]',
  },
  HIGH: {
    id: 'HIGH',
    label: 'High Risk',
    shortLabel: 'High',
    icon: AlertTriangle,
    solidBg: 'bg-[#EA580C]', // WCAG AA compliant orange
    solidText: 'text-white',
    tintBg: 'bg-[#FFF7ED]',
    tintText: 'text-[#C2410C]', // 4.8:1 contrast ratio against #FFF7ED
    tintBorder: 'border-orange-200',
    hex: '#EA580C',
    hexLight: '#FFEDD5',
    ringColor: 'ring-[#EA580C]/20',
    dotColor: 'bg-[#EA580C]',
  },
  MODERATE: {
    id: 'MODERATE',
    label: 'Moderate Risk',
    shortLabel: 'Moderate',
    icon: AlertCircle,
    solidBg: 'bg-[#D97706]', // WCAG AA compliant amber/gold
    solidText: 'text-white',
    tintBg: 'bg-[#FFFBEB]',
    tintText: 'text-[#B45309]', // 4.6:1 contrast ratio against #FFFBEB
    tintBorder: 'border-amber-200',
    hex: '#D97706',
    hexLight: '#FEF3C7',
    ringColor: 'ring-[#D97706]/20',
    dotColor: 'bg-[#D97706]',
  },
  LOW: {
    id: 'LOW',
    label: 'Low Risk',
    shortLabel: 'Low',
    icon: CheckCircle2,
    solidBg: 'bg-[#0D9488]', // WCAG AA compliant teal
    solidText: 'text-white',
    tintBg: 'bg-[#F0FDFA]',
    tintText: 'text-[#0F766E]', // 4.9:1 contrast ratio against #F0FDFA
    tintBorder: 'border-teal-200',
    hex: '#0D9488',
    hexLight: '#CCFBF1',
    ringColor: 'ring-[#0D9488]/20',
    dotColor: 'bg-[#0D9488]',
  },
};

/**
 * Helper to get tier configuration safely with fallback
 */
export function getTierConfig(tier?: string | RiskTier | null): TierConfig {
  if (!tier) return TIER_CONFIG.LOW;
  const upper = tier.toUpperCase() as RiskTier;
  return TIER_CONFIG[upper] || TIER_CONFIG.LOW;
}

/**
 * Standard accessible badge renderer class strings
 */
export function getTierBadgeClasses(tier?: string | RiskTier | null): {
  badgeClass: string;
  Icon: LucideIcon;
  label: string;
} {
  const config = getTierConfig(tier);
  return {
    badgeClass: `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${config.tintBg} ${config.tintText} ${config.tintBorder}`,
    Icon: config.icon,
    label: config.label,
  };
}
