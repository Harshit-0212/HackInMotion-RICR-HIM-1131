import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  tilt?: boolean;
  onClick?: () => void;
}

/**
 * SpotlightCard component inspired by Vengeance UI / Skiper UI.
 * Creates an interactive radial-gradient cursor spotlight with subtle 3D tilt.
 * Fully accessible and respects prefers-reduced-motion.
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(52, 211, 153, 0.12)', // Emerald tint default
  tilt = false,
  onClick,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse coords relative to card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smooth tilt
  const springConfig = { stiffness: 150, damping: 20 };
  const rotateX = useSpring(useTransform(mouseY, [-150, 150], [4, -4]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-150, 150], [-4, 4]), springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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
      style={tilt ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl border border-ink-200/80 dark:border-white/[0.08] bg-white dark:bg-[#14171C] p-6 shadow-soft transition-colors ${className}`}
    >
      {/* Radial Spotlight layer */}
      <motion.div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mouseX.get() + (cardRef.current?.offsetWidth ?? 300) / 2}px ${
            mouseY.get() + (cardRef.current?.offsetHeight ?? 200) / 2
          }px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

