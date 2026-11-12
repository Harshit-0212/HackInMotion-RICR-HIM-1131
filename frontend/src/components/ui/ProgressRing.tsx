import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-40px' });

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[#E8E1D7] dark:stroke-[#28222F]"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="url(#cadenceRingGradient)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: isInView ? offset : circumference }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="cadenceRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6542C5" />
            <stop offset="50%" stopColor="#9B72F5" />
            <stop offset="100%" stopColor="#F2B38C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label && (
          <span className="font-space text-2xl font-bold text-[#211D28] dark:text-[#F5F0E8]">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-xs text-[#8A8192]">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  className = '',
  height = 8,
}: {
  value: number;
  max?: number;
  className?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-40px' });
  const clamped = Math.max(0, Math.min(max, value));
  const percent = Math.round((clamped / max) * 100);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden rounded-full bg-[#E8E1D7] dark:bg-[#28222F] ${className}`}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[#6542C5] to-[#F2B38C]"
        initial={{ width: 0 }}
        animate={{ width: isInView ? `${percent}%` : 0 }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
