import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  variant?: 'banner' | 'compact';
}

export const LogoIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo-emblem.png"
        alt="HeatSentinel AI"
        className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(249,115,22,0.25)] transition-transform duration-300 hover:scale-105"
        loading="eager"
      />
    </div>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  variant = 'compact',
}) => {
  if (variant === 'banner') {
    const heightClass = size === 'sm' ? 'h-9' : size === 'lg' ? 'h-14' : 'h-11';
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src="/logo-transparent.png"
          alt="HeatSentinel AI - Autonomous Heat Response Intelligence"
          className={`${heightClass} w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(13,148,136,0.15)]`}
          loading="eager"
        />
      </div>
    );
  }

  // Compact emblem + styled typography (optimal for sidebar width)
  const iconSize = size === 'sm' ? 36 : size === 'lg' ? 48 : 42;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={iconSize} />
      <div className="flex flex-col min-w-0">
        <div className="flex items-center">
          <span className="text-[#0F172A] font-black text-lg tracking-tight leading-none">
            HeatSentinel
          </span>
          <span className="text-[#F97316] font-black text-lg tracking-tight leading-none ml-1.5 px-1.5 py-0.5 rounded-md bg-orange-50 border border-orange-200/60 text-xs">
            AI
          </span>
        </div>
        {showTagline && (
          <p className="text-[8.5px] font-extrabold text-[#0D9488] uppercase tracking-wider mt-0.5 leading-tight whitespace-normal">
            Autonomous Heat Intelligence
          </p>
        )}
      </div>
    </div>
  );
};
