import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Flame, Clock, Brain, Target, TrendingUp, Zap, Activity, AlertCircle } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

const RECOMMENDATIONS = [
  'Focus on Dynamic Programming — your weakest topic',
  'Review Graph Algorithms before moving to advanced topics',
  'Take a 15-min break. Your retention drops after 45 min',
  'Quiz yourself on Normalization to solidify mastery',
];

const AI_STATUS = [
  'AI analyzing your progress...',
  'Nova detected a weak area in Dynamic Programming.',
  'Recommended: 35 min focused session.',
  'Recently mastered: DBMS Normalization',
];

export function LiveStudyDashboard() {
  const [progress, setProgress] = useState(0);
  const [recIndex, setRecIndex] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [timer, setTimer] = useState(2340);
  const [confidence, setConfidence] = useState(82);
  const [mastered, setMastered] = useState(6);
  const [retention, setRetention] = useState(0);
  const [focusScore, setFocusScore] = useState(0);
  const [studyPct, setStudyPct] = useState(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 85, damping: 20 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set(e.clientX / innerWidth - 0.5);
      mouseY.set(e.clientY / innerHeight - 0.5);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Dashboards shift opposite to floating insights to create depth
  const parallaxX = useTransform(springX, [-0.5, 0.5], [-12, 12]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-12, 12]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 40 ? 40 : p + 1));
      setStudyPct((p) => (p >= 34 ? 34 : p + 1));
      setFocusScore((f) => (f >= 87 ? 87 : f + 1));
    }, 35);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const recInterval = setInterval(() => {
      setRecIndex((i) => (i + 1) % RECOMMENDATIONS.length);
    }, 4000);
    return () => clearInterval(recInterval);
  }, []);

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % AI_STATUS.length);
    }, 3200);
    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    const timerInterval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    const confInterval = setInterval(() => {
      setConfidence((c) => {
        const next = c + (Math.random() - 0.45) * 3;
        return Math.max(75, Math.min(95, Math.round(next)));
      });
    }, 2200);
    return () => clearInterval(confInterval);
  }, []);

  useEffect(() => {
    const masterInterval = setInterval(() => {
      setRetention((r) => (r >= 78 ? 78 : r + 1));
    }, 35);
    return () => clearInterval(masterInterval);
  }, []);

  const formatTimer = (s: number) => {
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-md"
    >
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-full">
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#6542C5]/35 via-violet-500/25 to-accent-500/30 blur-2xl animate-border-glow" />

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900/75 p-6 backdrop-blur-2xl shadow-lift">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-400">Good afternoon, Harshit</p>
              <p className="font-display text-lg font-bold text-white">Today's Focus</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex items-center gap-2 rounded-full border border-coral-400/30 bg-coral-500/10 px-3 py-1"
            >
              <Flame size={14} className="text-coral-400" />
              <span className="text-xs font-semibold text-coral-300">
                <AnimatedNumber value={7} suffix=" day streak" />
              </span>
            </motion.div>
          </div>

          <div className="mb-5 rounded-2xl border border-white/10 bg-gradient-to-br from-primary-900/50 via-violet-900/35 to-accent-900/25 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-xl font-bold text-white">Dynamic Programming</p>
                <p className="mt-0.5 text-sm text-ink-300">Intermediate · 2/5 concepts</p>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-[#6542C5] via-violet-500 to-accent-400 px-3 py-1.5 text-xs font-semibold text-white shadow-glow">
                In Progress
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 via-violet-400 to-accent-400"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-ink-400">
              <span>{progress}% complete</span>
              <span>~45 min remaining</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={recIndex}
              initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="mb-5 flex items-start gap-3 rounded-xl border border-[#B59AF7]/20 bg-[#6542C5]/8 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6542C5] to-violet-500 text-white">
                <Brain size={14} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#B59AF7]">AI Recommendation</p>
                <p className="text-sm text-ink-200">{RECOMMENDATIONS[recIndex]}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={Clock} label="Focus Timer" value={formatTimer(timer)} accent="text-accent-300" pulse />
            <StatTile icon={Target} label="Mastered" value={`${mastered} topics`} accent="text-[#B59AF7]" />
            <StatTile icon={TrendingUp} label="Retention" value={`${retention}%`} accent="text-violet-300" />
            <StatTile icon={Activity} label="AI Confidence" value={`${confidence}%`} accent="text-coral-300" live />
            <StatTile icon={Zap} label="Focus Score" value={`${focusScore}%`} accent="text-accent-300" />
            <StatTile icon={Target} label="Study Progress" value={`${studyPct}%`} accent="text-pink-300" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-ink-400">Weak topics:</span>
            {['Dynamic Programming', 'Graph Algorithms'].map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + i * 0.2 }}
                className="flex items-center gap-1 rounded-lg border border-coral-400/25 bg-coral-500/8 px-2 py-0.5 text-xs text-coral-300"
              >
                <AlertCircle size={10} />
                {t}
              </motion.span>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={statusIndex}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.35 }}
                className="text-xs text-ink-300"
              >
                {AI_STATUS[statusIndex]}
              </motion.span>
            </AnimatePresence>
            <Zap size={12} className="ml-auto text-accent-400" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
  pulse,
  live,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  accent: string;
  pulse?: boolean;
  live?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.025 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-xl border border-white/10 bg-white/5 p-3"
    >
      <div className="mb-1.5 flex items-center justify-between">
        <Icon size={14} className={accent} />
        {live && <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />}
        {pulse && <span className="h-1.5 w-1.5 rounded-full bg-coral-400 animate-pulse" />}
      </div>
      <p className="font-display text-lg font-bold text-white tabular-nums">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </motion.div>
  );
}
