import {
  forwardRef,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'gradient' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
  > {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  magnetic?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] font-semibold hover:bg-[#51329F] dark:hover:bg-[#C6AFFB] border border-[#51329F]/30 dark:border-white/10 shadow-sm',
  accent:
    'bg-[#F2B38C] text-[#211D28] dark:bg-[#F2B38C] dark:text-[#141217] font-semibold hover:bg-[#EA915E] dark:hover:bg-[#F5BEA5] border border-[#D7713A]/30 shadow-sm',
  gradient:
    'bg-gradient-to-r from-[#6542C5] via-[#9B72F5] to-[#F2B38C] text-white font-semibold shadow-sm hover:opacity-95',
  secondary:
    'bg-[#E8E1D7] text-[#211D28] hover:bg-[#D8D0C5] dark:bg-[#28222F] dark:text-[#F5F0E8] dark:hover:bg-[#332C3C] border border-[#D8D0C5] dark:border-white/10',
  ghost:
    'bg-transparent text-[#5F5668] hover:bg-[#E8E1D7] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:bg-[#28222F] dark:hover:text-[#F5F0E8]',
  outline:
    'border border-[#D8D0C5] text-[#211D28] hover:bg-[#E8E1D7]/50 dark:border-white/10 dark:text-[#F5F0E8] dark:hover:bg-[#1D1922]',
  danger: 'bg-[#E53E3E] text-white hover:bg-[#C53030] shadow-sm',
  success: 'bg-[#2F855A] text-white hover:bg-[#276749] shadow-sm',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    magnetic = true,
    className = '',
    children,
    disabled,
    onClick,
    ...props
  },
  ref,
) {
  const localRef = useRef<HTMLButtonElement | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Magnetic drift setup (~80px reach, subtle spring displacement)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 140, damping: 15, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || disabled || loading || !localRef.current) return;
    const rect = localRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const dist = Math.hypot(distanceX, distanceY);

    if (dist < 80) {
      x.set(distanceX * 0.28);
      y.set(distanceY * 0.28);
    } else {
      x.set(0);
      y.set(0);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create click ripple at the exact click position
    if (localRef.current) {
      const rect = localRef.current.getBoundingClientRect();
      const rippleX = e.clientX - rect.left;
      const rippleY = e.clientY - rect.top;
      const newRipple = { x: rippleX, y: rippleY, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
    }

    if (onClick) onClick(e);
  };

  const setCombinedRef = (node: HTMLButtonElement | null) => {
    localRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as any).current = node;
    }
  };

  const baseClasses = `group relative overflow-hidden inline-flex items-center justify-center rounded-xl font-semibold select-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6542C5] dark:focus-visible:ring-[#B59AF7] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#141217] disabled:cursor-not-allowed disabled:opacity-50 ${
    VARIANTS[variant]
  } ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

  return (
    <motion.button
      ref={setCombinedRef}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      style={magnetic && !disabled && !loading ? { x: springX, y: springY } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={baseClasses}
      {...(props as any)}
    >
      {/* Shine sweep: diagonal light streak passing across on hover */}
      <span className="pointer-events-none absolute -inset-full top-0 block -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100" />

      {/* Click ripple animation */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-white/40"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '120px',
            height: '120px',
            transform: 'translate(-50%, -50%) scale(1)',
          }}
        />
      ))}

      {/* Content with 4px right slide on hover for icons/arrows */}
      <span className="relative z-10 inline-flex items-center gap-1.5 transition-transform duration-200 [&>svg]:transition-transform [&>svg]:duration-200 group-hover:[&>svg:last-child]:translate-x-1">
        {loading && <Loader2 size={16} className="animate-spin shrink-0" />}
        {children}
      </span>
    </motion.button>
  );
});
