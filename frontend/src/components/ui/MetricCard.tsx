import type { ReactNode } from 'react';

export interface StatTrend {
  value: string;
  isPositive?: boolean;
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: StatTrend;
  badge?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * MetricCard - Crisp, architectural data tile with Graphite/Iris/Apricot geometry (0-2px border-radius)
 */
export function MetricCard({
  label,
  value,
  subtitle,
  icon,
  trend,
  badge,
  className = '',
  onClick,
}: MetricCardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`relative overflow-hidden rounded-[2px] border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-4 text-left transition-colors duration-150 shadow-xs hover:border-[#6542C5] dark:hover:border-[#B59AF7]/50 ${
        onClick ? 'cursor-pointer w-full' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5F5668] dark:text-[#B8AFBE]">
          {label}
        </span>
        {icon && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#E8E1D7]/60 text-[#6542C5] dark:bg-[#28222F] dark:text-[#B59AF7] border border-[#D8D0C5] dark:border-white/10 rounded-[2px]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-space text-2xl font-bold tracking-tight text-[#211D28] dark:text-[#F5F0E8]">
          {value}
        </span>
        {badge && (
          <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono font-semibold uppercase bg-[#6542C5]/10 text-[#6542C5] dark:bg-[#B59AF7]/20 dark:text-[#B59AF7] border border-[#6542C5]/20 dark:border-[#B59AF7]/30">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#8A8192] truncate">
          {trend && (
            <span
              className={`font-semibold font-mono text-[11px] ${
                trend.isPositive ? 'text-[#2F855A] dark:text-[#48BB78]' : 'text-[#E53E3E] dark:text-[#FC8181]'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
      )}
    </Component>
  );
}
