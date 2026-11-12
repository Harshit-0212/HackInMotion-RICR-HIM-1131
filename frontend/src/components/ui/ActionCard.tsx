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
    border: 'border-[#D8D0C5] dark:border-white/10 hover:border-[#6542C5] dark:hover:border-[#B59AF7]',
    iconBg: 'bg-[#E8E1D7] text-[#211D28] dark:bg-[#28222F] dark:text-[#F5F0E8]',
    actionText: 'text-[#6542C5] dark:text-[#B59AF7] group-hover:text-[#51329F] dark:group-hover:text-[#C6AFFB]',
  },
  accent: {
    border: 'border-[#F2B38C]/70 dark:border-[#F2B38C]/30 hover:border-[#D7713A] dark:hover:border-[#F2B38C]',
    iconBg: 'bg-[#FDF6F0] text-[#D7713A] dark:bg-[#F2B38C]/10 dark:text-[#F2B38C]',
    actionText: 'text-[#D7713A] dark:text-[#F2B38C] group-hover:text-[#B85322] dark:group-hover:text-[#F5BEA5]',
  },
  success: {
    border: 'border-[#2F855A]/40 dark:border-[#48BB78]/30 hover:border-[#2F855A] dark:hover:border-[#48BB78]',
    iconBg: 'bg-[#F2FAF5] text-[#2F855A] dark:bg-[#48BB78]/10 dark:text-[#48BB78]',
    actionText: 'text-[#2F855A] dark:text-[#48BB78] group-hover:text-[#276749]',
  },
  warning: {
    border: 'border-[#DD6B20]/40 dark:border-[#F6AD55]/30 hover:border-[#DD6B20] dark:hover:border-[#F6AD55]',
    iconBg: 'bg-[#FFF9F0] text-[#DD6B20] dark:bg-[#F6AD55]/10 dark:text-[#F6AD55]',
    actionText: 'text-[#DD6B20] dark:text-[#F6AD55] group-hover:text-[#C05621]',
  },
};

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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-[#FBF8F2] dark:bg-[#1D1922] p-5 shadow-sm transition-colors duration-200 ${styles.border} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${styles.iconBg}`}>
            {icon}
          </div>
          {badge && (
            <span className="inline-flex items-center rounded-md bg-[#E8E1D7] dark:bg-[#28222F] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5F5668] dark:text-[#B8AFBE]">
              {badge}
            </span>
          )}
        </div>

        <h3 className="mt-4 font-space text-base font-bold text-[#211D28] dark:text-[#F5F0E8] group-hover:text-[#6542C5] dark:group-hover:text-[#B59AF7] transition-colors">
          {title}
        </h3>
        <p className="mt-1.5 text-xs text-[#5F5668] dark:text-[#B8AFBE] line-clamp-2 leading-relaxed">
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
