import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

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
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-5 text-left transition-all duration-200 shadow-sm hover:border-[#6542C5] dark:hover:border-[#B59AF7]/50 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#5F5668] dark:text-[#B8AFBE]">
          {label}
        </span>
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8E1D7] text-[#6542C5] dark:bg-[#28222F] dark:text-[#B59AF7] border border-[#D8D0C5] dark:border-white/10">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="font-space text-2xl sm:text-3xl font-bold tracking-tight text-[#211D28] dark:text-[#F5F0E8]">
          {value}
        </span>
        {badge && (
          <span className="inline-flex items-center rounded-md bg-[#6542C5]/10 text-[#6542C5] dark:bg-[#B59AF7]/20 dark:text-[#B59AF7] border border-[#6542C5]/20 dark:border-[#B59AF7]/30 px-2 py-0.5 text-[11px] font-semibold">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[#5F5668] dark:text-[#B8AFBE]">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive
                  ? 'text-[#2F855A] dark:text-[#48BB78]'
                  : 'text-[#DD6B20] dark:text-[#F6AD55]'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </Component>
  );
}
