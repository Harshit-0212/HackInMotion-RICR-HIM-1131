import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface ChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
}

export function Chip({ children, active = false, onClick, className = '', icon }: ChipProps) {
  const Component = onClick ? motion.button : motion.span;

  return (
    <Component
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 select-none ${
        active
          ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217] shadow-xs'
          : 'bg-[#E8E1D7] text-[#5F5668] hover:bg-[#6542C5]/10 hover:text-[#6542C5] dark:bg-[#28222F] dark:text-[#B8AFBE] dark:hover:bg-[#B59AF7]/20 dark:hover:text-[#B59AF7]'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </Component>
  );
}

