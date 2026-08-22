import React from 'react';
import { LucideIcon } from 'lucide-react';
import { PlaceholderPageProps } from '../types';

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description = 'This section is under construction.',
  icon: Icon,
}) => {
  return (
    <div
      id={`page-container-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-80px)] bg-[#F8FAFC]"
    >
      <div className="w-full max-w-lg bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center shadow-sm flex flex-col items-center justify-center gap-5">
        <div className="w-20 h-20 opacity-30 flex items-center justify-center text-[#64748B]">
          {Icon ? (
            <Icon size={56} strokeWidth={1.5} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L21 19H3L12 3Z" fill="#64748B" stroke="#64748B" strokeWidth="2" />
            </svg>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-[#64748B] leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <div className="px-6 py-2 rounded-full border border-slate-200 text-xs font-bold uppercase tracking-widest text-[#64748B]">
            System Ready
          </div>
          <div className="px-6 py-2 rounded-full border border-[#0D9488]/20 bg-[#CCFBF1] text-xs font-bold uppercase tracking-widest text-[#0D9488]">
            V1.0.4-Stable
          </div>
        </div>
      </div>
    </div>
  );
};
