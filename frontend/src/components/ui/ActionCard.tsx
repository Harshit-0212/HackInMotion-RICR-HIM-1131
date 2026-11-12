import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

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

/**
 * ActionCard - Architectural card with sharp geometry (0-2px border-radius)
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
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[2px] border bg-[#FBF8F2] dark:bg-[#1D1922] p-5 shadow-xs transition-colors duration-150 ${styles.border} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-none ${styles.iconBg}`}>
            {icon}
          </div>
          {badge && (
            <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E8E1D7] dark:bg-[#28222F] text-[#5F5668] dark:text-[#B8AFBE] border border-[#D8D0C5] dark:border-white/10">
              {badge}
            </span>
          )}
        </div>

        <h3 className="mt-4 font-space text-base font-bold text-[#211D28] dark:text-[#F5F0E8] tracking-tight">
          {title}
        </h3>
        <p className="mt-1.5 text-xs text-[#5F5668] dark:text-[#B8AFBE] leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-[#D8D0C5]/60 dark:border-white/[0.06] flex items-center gap-1.5 text-xs font-semibold">
        <span className={styles.actionText}>{actionText}</span>
        <ArrowRight size={13} className={`${styles.actionText} transition-transform group-hover:translate-x-1`} />
      </div>
    </div>
  );
}
