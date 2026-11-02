import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface ActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  actionText: string;
  onClick?: () => void;
  badge?: string;
  tone?: 'default' | 'accent' | 'success' | 'warning';
  className?: string;
}

const toneStyles = {
  default: {
    border: 'border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700',
    iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    actionText: 'text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300',
  },
  accent: {
    border: 'border-blue-200/80 dark:border-blue-900/60 hover:border-blue-300 dark:hover:border-blue-700',
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    actionText: 'text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300',
  },
  success: {
    border: 'border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-300 dark:hover:border-emerald-700',
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    actionText: 'text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300',
  },
  warning: {
    border: 'border-amber-200/80 dark:border-amber-900/60 hover:border-amber-300 dark:hover:border-amber-700',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    actionText: 'text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300',
  },
};

/**
 * ActionCard - Adapted from Watermelon UI Action Card component (ui.watermelon.sh/components/cards)
 * Purposeful, clean card with clear call-to-action link and high-legibility layout.
 */
export function ActionCard({
  title,
  description,
  icon,
  actionText,
  onClick,
  badge,
  tone = 'default',
  className = '',
}: ActionCardProps) {
  const styles = toneStyles[tone];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white dark:bg-[#111827] p-5 shadow-sm transition-colors duration-200 ${styles.border} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${styles.iconBg}`}>
            {icon}
          </div>
          {badge && (
            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {badge}
            </span>
          )}
        </div>

        <h3 className="mt-4 font-space text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-1.5 text-xs font-bold transition-all duration-200">
        <span className={styles.actionText}>{actionText}</span>
        <span className={`transition-transform duration-200 group-hover:translate-x-1 ${styles.actionText}`}>
          →
        </span>
      </div>
    </motion.div>
  );
}

