import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, TrendingUp } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

const PHASES = [
  { id: 'analyzing', text: 'AI analyzing your learning...', duration: 2800 },
  { id: 'noticed', text: 'Nova noticed something.', duration: 2200 },
  {
    id: 'insight',
    text: 'You perform better when difficult concepts are split into shorter focused sessions.',
    duration: 4000,
  },
  { id: 'recommendation', text: 'Recommended session ready.', duration: 5000 },
];

export function AIInsightPanel() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const currentPhase = PHASES[phaseIndex];
  const showDetails = currentPhase.id === 'recommendation';

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhaseIndex((i) => (i + 1) % PHASES.length);
    }, currentPhase.duration);
    return () => clearTimeout(timer);
  }, [phaseIndex, currentPhase.duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-xl"
    >
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#6542C5]/20 via-violet-500/15 to-accent-400/20 blur-2xl animate-border-glow" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-2xl sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6542C5] via-violet-500 to-accent-400 text-white shadow-glow"
          >
            <Sparkles size={18} />
          </motion.div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#B59AF7]">Nova AI Insight</p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
              <span className="text-xs text-ink-400">Live analysis</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={currentPhase.id}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-lg font-semibold leading-snug text-white sm:text-xl"
          >
            {currentPhase.text}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="rounded-xl border border-[#B59AF7]/20 bg-[#6542C5]/10 p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-[#B59AF7]">
                  <Clock size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wide">Recommended session</span>
                </div>
                <p className="font-display text-3xl font-bold text-white">
                  <AnimatedNumber value={35} suffix=" min" />
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="rounded-xl border border-accent-400/20 bg-accent-500/10 p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-accent-300">
                  <TrendingUp size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wide">Expected retention</span>
                </div>
                <p className="font-display text-3xl font-bold text-white">
                  +<AnimatedNumber value={18} suffix="%" />
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
