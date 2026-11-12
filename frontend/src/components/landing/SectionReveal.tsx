import { motion } from 'framer-motion';
import { staggerContainer, fadeUp, viewportConfig } from '@/lib/animations';
import type { ReactNode } from 'react';

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  id?: string;
  stagger?: number;
  delay?: number;
}

export function SectionReveal({ children, className = '', id, stagger = 0.1, delay = 0 }: SectionRevealProps) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      variants={staggerContainer(stagger, delay)}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function RevealItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  tag,
  title,
  subtitle,
  light = false,
}: {
  tag: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <RevealItem className="mx-auto mb-12 max-w-2xl text-center">
      <motion.span
        variants={fadeUp}
        className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#B59AF7]/30 bg-[#6542C5]/10 px-3 py-1 text-xs font-semibold text-[#B59AF7]"
      >
        {tag}
      </motion.span>
      <motion.h2
        variants={fadeUp}
        className={`font-display text-3xl font-bold tracking-tight sm:text-4xl ${light ? 'text-white' : 'text-ink-900 dark:text-ink-50'}`}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          variants={fadeUp}
          className={`mt-3 text-lg ${light ? 'text-ink-300' : 'text-ink-500 dark:text-ink-400'}`}
        >
          {subtitle}
        </motion.p>
      )}
    </RevealItem>
  );
}
