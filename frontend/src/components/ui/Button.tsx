import { forwardRef, useRef, type ButtonHTMLAttributes } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'gradient';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  magnetic?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[#0F5132] dark:bg-[#2DD4A7] text-white dark:text-[#0B0D10] font-semibold hover:bg-[#0B3F26] dark:hover:bg-[#34D399] active:scale-[0.98] shadow-sm border border-[#0B3F26]/30 dark:border-white/10 transition-all disabled:opacity-50',
  gradient:
    'bg-gradient-to-r from-[#0F5132] via-[#6D4AFF] to-[#C2703A] dark:from-[#2DD4A7] dark:via-[#8B5CF6] dark:to-[#F5B04C] text-white font-semibold shadow-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50',
  secondary:
    'bg-ink-100 text-ink-900 hover:bg-ink-200 active:bg-ink-300 dark:bg-[#1B2027] dark:text-[#F4F1EA] dark:hover:bg-[#262C36] border border-ink-200/60 dark:border-white/[0.08]',
  ghost:
    'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-[#1B2027] dark:hover:text-[#F4F1EA]',
  outline:
    'border border-ink-200 text-ink-700 hover:bg-ink-50 hover:border-ink-300 dark:border-white/[0.1] dark:text-[#F4F1EA] dark:hover:bg-[#14171C]',
  danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] shadow-sm',
  success: 'bg-[#10B981] text-white hover:bg-[#059669] active:bg-[#047857] shadow-sm',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

const MotionButton = motion.create(
  forwardRef<HTMLButtonElement, ButtonProps>(function ButtonInner(props, ref) {
    const { className = '', children, ...rest } = props;
    return (
      <button ref={ref} className={className} {...rest}>
        {children}
      </button>
    );
  }),
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    magnetic = false,
    className = '',
    children,
    disabled,
    ...props
  },
  ref,
) {
  const localRef = useRef<HTMLButtonElement>(null);

  // Set up motion values for magnetic translation
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for translation
  const springConfig = { stiffness: 120, damping: 12, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || disabled || loading || !localRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = localRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    // Pull button up to 16px towards the cursor
    x.set(distanceX * 0.35);
    y.set(distanceY * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const setRefs = (node: HTMLButtonElement) => {
    // @ts-ignore
    localRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  // transition-colors prevents transform lag from conflicting CSS transition rules
  const classes = `inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${magnetic || variant === 'gradient' ? 'magnetic-btn' : ''} ${className}`;

  return (
    <MotionButton
      ref={setRefs}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { scale: 1.025 }}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      style={magnetic && !disabled && !loading ? { x: springX, y: springY } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={classes}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </MotionButton>
  );
});
