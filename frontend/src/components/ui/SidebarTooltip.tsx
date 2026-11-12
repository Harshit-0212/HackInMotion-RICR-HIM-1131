import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface SidebarTooltipProps {
  content: ReactNode;
  children: ReactNode;
  enabled?: boolean;
}

export function SidebarTooltip({ content, children, enabled = true }: SidebarTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const show = () => {
    if (!enabled) return;
    updatePosition();
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
  };

  useEffect(() => {
    if (visible && enabled) {
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [visible, enabled]);

  return (
    <div
      ref={triggerRef}
      className="relative flex items-center w-full justify-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {enabled &&
        visible &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.1 }}
              style={{
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                transform: 'translateY(-50%)',
                zIndex: 9999,
              }}
              className="pointer-events-none whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium shadow-md transition-colors
                bg-[#1b382b] text-[#f4f7f4] border border-[#2d5542]
                dark:bg-[#f5f0e8] dark:text-[#141217] dark:border-white/20"
              role="tooltip"
            >
              {content}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

