import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  tilt?: boolean;
  onClick?: () => void;
}

/**
 * SpotlightCard component:
 * - A radial cursor glow follows mouse inside card using CSS variables --x / --y
 * - Subtle 3D tilt (max 6deg, perspective 800px, spring-smoothed) that eases back on leave
 * - Gradient border that illuminates near cursor
 * - Fully respects prefers-reduced-motion
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor,
  tilt = true,
  onClick,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse coords relative to card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smooth tilt (max 6 deg)
  const springConfig = { stiffness: 180, damping: 22, mass: 0.2 };
  const rotateX = useSpring(useTransform(mouseY, [-180, 180], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-180, 180], [-6, 6]), springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Set CSS variables for spotlight positioning
    cardRef.current.style.setProperty('--x', `${x}px`);
    cardRef.current.style.setProperty('--y', `${y}px`);

    mouseX.set(x - rect.width / 2);
    mouseY.set(y - rect.height / 2);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: 800,
        transformStyle: 'preserve-3d',
        ...(tilt ? { rotateX, rotateY } : {}),
      }}
      className={`group relative overflow-hidden rounded-3xl border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-6 shadow-sm transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Dynamic Cursor Spotlight Radial Glow */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background:
            spotlightColor ||
            'radial-gradient(350px circle at var(--x, 50%) var(--y, 50%), rgba(101, 66, 197, 0.12), transparent 70%)',
        }}
      />

      {/* Illuminating Gradient Border on Hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          padding: '1px',
          background:
            'radial-gradient(280px circle at var(--x, 50%) var(--y, 50%), rgba(181, 154, 247, 0.4), transparent 80%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
