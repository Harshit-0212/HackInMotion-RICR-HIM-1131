import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'gradient' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  magnetic?: boolean;
}

// Render-inspired sharp geometry & palette
// Primary: Deep Iris (#6542C5) in light, Soft Iris (#B59AF7) in dark, 0px radius with sweep
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'btn-render-sweep bg-[#6542C5] text-white hover:text-white dark:bg-[#B59AF7] dark:text-[#141217] dark:hover:text-[#141217] font-semibold border border-[#51329F] dark:border-[#B59AF7]/40 shadow-sm disabled:opacity-50',
  accent:
    'btn-render-sweep-accent bg-[#F2B38C] text-[#211D28] hover:text-[#211D28] dark:bg-[#F2B38C] dark:text-[#141217] font-semibold border border-[#D7713A]/30 shadow-sm disabled:opacity-50',
  gradient:
    'btn-render-sweep bg-[#6542C5] text-white font-semibold border border-[#51329F] shadow-sm disabled:opacity-50',
  secondary:
    'btn-render-sweep-dark bg-[#E8E1D7] text-[#211D28] hover:text-[#211D28] dark:bg-[#28222F] dark:text-[#F5F0E8] dark:hover:text-white font-medium border border-[#D8D0C5] dark:border-white/10 shadow-sm disabled:opacity-50',
  outline:
    'bg-transparent text-[#211D28] dark:text-[#F5F0E8] border border-[#D8D0C5] dark:border-white/20 hover:bg-[#E8E1D7]/60 dark:hover:bg-[#28222F] font-medium transition-colors disabled:opacity-50',
  ghost:
    'bg-transparent text-[#5F5668] hover:text-[#211D28] hover:bg-[#E8E1D7]/50 dark:text-[#B8AFBE] dark:hover:text-white dark:hover:bg-[#28222F]/60 font-medium transition-colors disabled:opacity-50',
  danger:
    'bg-[#E53E3E] text-white hover:bg-[#C53030] font-semibold border border-[#C53030] shadow-sm disabled:opacity-50',
  success:
    'bg-[#2F855A] text-white hover:bg-[#276749] font-semibold border border-[#276749] shadow-sm disabled:opacity-50',
};

// Sharp, crisp rectangular heights and paddings (0px border-radius)
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs tracking-wide gap-1.5',
  md: 'h-10 px-4 text-sm tracking-tight gap-2',
  lg: 'h-12 px-6 text-sm font-semibold tracking-normal gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    className = '',
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const isSharp = !className.includes('rounded-');
  const baseClasses = `relative inline-flex items-center justify-center font-medium select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6542C5] dark:focus-visible:ring-[#B59AF7] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#141217] active:translate-y-[1px] disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-150 ${
    isSharp ? 'rounded-none' : ''
  } ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={baseClasses}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin shrink-0 relative z-10" />}
      <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
    </button>
  );
});
