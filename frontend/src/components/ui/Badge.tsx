import type { ReactNode } from 'react';

type Tone = 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';

const TONES: Record<Tone, string> = {
  primary:
    'bg-[#F5F3FD] text-[#6542C5] border-[#C8B8F5] dark:bg-[#B59AF7]/15 dark:text-[#B59AF7] dark:border-[#B59AF7]/30',
  accent:
    'bg-[#FDF6F0] text-[#D7713A] border-[#F2B38C]/50 dark:bg-[#F2B38C]/15 dark:text-[#F2B38C] dark:border-[#F2B38C]/30',
  success:
    'bg-success-50 text-success-700 border-success-200 dark:bg-success-700/20 dark:text-success-200 dark:border-success-700',
  warning:
    'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-700/20 dark:text-warning-200 dark:border-warning-700',
  error: 'bg-error-50 text-error-700 border-error-200 dark:bg-error-700/20 dark:text-error-200 dark:border-error-700',
  neutral: 'bg-ink-100 text-ink-700 border-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:border-ink-700',
};

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
