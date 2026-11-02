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

/**
 * MetricCard - Inspired by Watermelon UI Metric Block (ui.watermelon.sh/blocks/metrics)
 * Clean, restrained, high-contrast metric display tailored for Cadence.
 * Replaces generic AI multi-nested cards with clean typography and semantic accents.
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
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#111827] p-5 text-left transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="font-space text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        {badge && (
          <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
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

