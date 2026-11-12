import { useEffect, useState } from 'react';
import { motion, useTransform, type MotionValue, useSpring, AnimatePresence } from 'framer-motion';
import {
  Brain,
  AlertCircle,
  Clock,
  Target,
  TrendingUp,
  Zap,
  Flame,
  CheckCircle2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface AICoreProps {
  scrollYProgress: MotionValue<number>;
}

export function AICore({ scrollYProgress }: AICoreProps) {
  // Global springs for rotation and ambient scaling
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -540]);
  const coreScale = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0.95, 1.05, 0.85, 1.0, 0.9]);

  const springScale = useSpring(coreScale, { stiffness: 100, damping: 20 });

  // Opacities for each stage layer
  // Stage 1 (Understand): Bright at start, fades out after 0.18
  const stageOpacity1 = useTransform(scrollYProgress, [0, 0.15, 0.2], [1, 1, 0]);

  // Stage 2 (Weak Spots): Fades in at 0.18, stays till 0.38, fades out by 0.45
  const stageOpacity2 = useTransform(scrollYProgress, [0.15, 0.22, 0.38, 0.45], [0, 1, 1, 0]);

  // Stage 3 (Plan): Fades in at 0.42, stays till 0.63, fades out by 0.70
  const stageOpacity3 = useTransform(scrollYProgress, [0.42, 0.48, 0.63, 0.7], [0, 1, 1, 0]);

  // Stage 4 (Practice/Analytics): Fades in at 0.67, stays till 0.86, fades out by 0.90
  const stageOpacity4 = useTransform(scrollYProgress, [0.67, 0.73, 0.86, 0.9], [0, 1, 1, 0]);

  // Stage 5 (Ecosystem/CTA): Fades in at 0.88, fully visible at 0.94+
  const stageOpacity5 = useTransform(scrollYProgress, [0.88, 0.94, 1.0], [0, 1, 1]);

  return (
    <div className="relative flex h-[350px] w-full items-center justify-center md:h-[450px] lg:h-[500px]">
      {/* Ambient background glow behind the core */}
      <motion.div
        style={{ scale: springScale }}
        className="absolute h-56 w-56 rounded-full bg-gradient-to-tr from-[#6542C5]/25 via-violet-500/20 to-accent-400/20 blur-3xl"
      />

      {/* ========================================================
          CORE STRUCTURE (Orb and Rotating Rings)
          ======================================================== */}
      <motion.div
        style={{ scale: springScale }}
        className="relative flex h-[280px] w-[280px] items-center justify-center md:h-[340px] md:w-[340px]"
      >
        {/* Outer Rotating Dash Ring */}
        <motion.div style={{ rotate: rotate1 }} className="absolute inset-0 select-none pointer-events-none">
          <svg className="h-full w-full opacity-30" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#gradient-cyan-violet)"
              strokeWidth="0.8"
              strokeDasharray="4 6"
            />
            <defs>
              <linearGradient id="gradient-cyan-violet" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Middle Counter-Rotating Node Ring */}
        <motion.div style={{ rotate: rotate2 }} className="absolute inset-4 select-none pointer-events-none">
          <svg className="h-full w-full opacity-20" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#6366F1"
              strokeWidth="1.2"
              strokeDasharray="1 18"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* Central Glowing AI Core Orb */}
        <div className="absolute h-20 w-20 rounded-full border border-white/20 bg-ink-950/70 p-2 shadow-[0_0_35px_rgba(99,102,241,0.35)] backdrop-blur-md flex items-center justify-center z-20">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#6542C5] via-violet-500 to-accent-400 text-white"
          >
            <Brain size={30} className="drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
          </motion.div>
        </div>

        {/* ========================================================
            STAGE 1: Understand You (Data Implosion)
            ======================================================== */}
        <motion.div style={{ opacity: stageOpacity1 }} className="absolute inset-0 z-10 pointer-events-none">
          <Stage1Particles scrollYProgress={scrollYProgress} />
        </motion.div>

        {/* ========================================================
            STAGE 2: Find Weak Spots (Topic Gravitation)
            ======================================================== */}
        <motion.div
          style={{ opacity: stageOpacity2 }}
          className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
        >
          <Stage2WeakSpots scrollYProgress={scrollYProgress} />
        </motion.div>

        {/* ========================================================
            STAGE 3: Build Your Plan (Interactive Timeline)
            ======================================================== */}
        <motion.div
          style={{ opacity: stageOpacity3 }}
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <Stage3Timeline scrollYProgress={scrollYProgress} />
        </motion.div>

        {/* ========================================================
            STAGE 4: Learn & Practice (Focus Metrics Dials)
            ======================================================== */}
        <motion.div
          style={{ opacity: stageOpacity4 }}
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <Stage4Metrics scrollYProgress={scrollYProgress} />
        </motion.div>

        {/* ========================================================
            STAGE 5: Ecosystem Dashboard (Cohesive Grid)
            ======================================================== */}
        <motion.div
          style={{ opacity: stageOpacity5 }}
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <Stage5Ecosystem scrollYProgress={scrollYProgress} />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: Stage 1 - Profile Data Particles Imploding
   ============================================================================ */
function Stage1Particles({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  // Particles coordinates at scroll 0, pulling to center (0, 0) by scroll 0.20
  const particles = [
    { startX: -120, startY: -100, color: 'bg-[#B59AF7]' },
    { startX: 130, startY: -90, color: 'bg-accent-400' },
    { startX: -140, startY: 80, color: 'bg-violet-400' },
    { startX: 120, startY: 100, color: 'bg-pink-400' },
    { startX: 0, startY: -140, color: 'bg-emerald-400' },
    { startX: -10, startY: 130, color: 'bg-coral-400' },
  ];

  return (
    <>
      {particles.map((p, i) => {
        // Linearly interpolate positions to center
        const x = useTransform(scrollYProgress, [0, 0.16], [p.startX, 0]);
        const y = useTransform(scrollYProgress, [0, 0.16], [p.startY, 0]);
        const scale = useTransform(scrollYProgress, [0, 0.16], [1, 0.2]);
        const opacity = useTransform(scrollYProgress, [0, 0.12, 0.16], [0.85, 0.85, 0]);

        return (
          <motion.div
            key={i}
            style={{ x, y, scale, opacity }}
            className={`absolute left-[calc(50%-8px)] top-[calc(50%-8px)] h-4.5 w-4.5 rounded-full ${p.color} border-2 border-ink-950 shadow-[0_0_12px_rgba(255,255,255,0.4)]`}
          />
        );
      })}
    </>
  );
}

/* ============================================================================
   SUB-COMPONENT: Stage 2 - Topic Nodes Gravitating based on Strength
   ============================================================================ */
function Stage2WeakSpots({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  // Weak topics draw closer to the core, strong topics drift away
  // Scroll ranges: 0.15 to 0.40
  const nodes = [
    {
      title: 'Dynamic Programming',
      val: '42%',
      startX: -150,
      startY: -90,
      endX: -90,
      endY: -45,
      type: 'weak',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)] border-error-500/40',
      tag: 'Critical Weakness',
    },
    {
      title: 'Probability',
      val: '51%',
      startX: 140,
      startY: -100,
      endX: 85,
      endY: -50,
      type: 'weak',
      glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)] border-warning-500/30',
      tag: 'Weak Topic',
    },
    {
      title: 'Graph Algorithms',
      val: '68%',
      startX: -130,
      startY: 100,
      endX: -110,
      endY: 85,
      type: 'mid',
      glow: 'border-white/10',
    },
    {
      title: 'Arrays & Strings',
      val: '92%',
      startX: 90,
      startY: 80,
      endX: 160,
      endY: 120, // Drifts further away
      type: 'strong',
      glow: 'shadow-[0_0_12px_rgba(52,211,153,0.25)] border-emerald-400/30',
      tag: 'Mastered',
    },
  ];

  return (
    <>
      {nodes.map((node, i) => {
        const x = useTransform(scrollYProgress, [0.16, 0.28], [node.startX, node.endX]);
        const y = useTransform(scrollYProgress, [0.16, 0.28], [node.startY, node.endY]);
        const scale = useTransform(scrollYProgress, [0.16, 0.28], [0.85, 1.0]);
        const opacity = useTransform(scrollYProgress, [0.15, 0.2, 0.38, 0.44], [0, 1, 1, 0]);

        return (
          <motion.div
            key={i}
            style={{ x, y, scale, opacity }}
            className={`absolute z-30 flex flex-col rounded-xl border bg-ink-950/85 px-3 py-2 backdrop-blur-md ${node.glow} w-[150px] pointer-events-auto`}
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-[10px] font-bold text-ink-300">{node.title}</span>
              <span
                className={`text-xs font-bold ${
                  node.type === 'weak'
                    ? 'text-coral-400'
                    : node.type === 'strong'
                      ? 'text-emerald-400'
                      : 'text-[#B59AF7]'
                }`}
              >
                {node.val}
              </span>
            </div>
            {node.tag && (
              <span
                className={`mt-1 text-[8px] font-semibold uppercase tracking-wide ${
                  node.type === 'weak' ? 'text-error-400' : 'text-emerald-400'
                }`}
              >
                {node.tag}
              </span>
            )}
          </motion.div>
        );
      })}
    </>
  );
}

/* ============================================================================
   SUB-COMPONENT: Stage 3 - Re-planning Timeline Construction
   ============================================================================ */
function Stage3Timeline({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  // Stage 3 range: 0.45 to 0.65
  // Draws timeline line and slides study cards in sequence
  const lineLength = useTransform(scrollYProgress, [0.44, 0.56], ['0%', '100%']);

  const steps = [
    { time: '09:00', task: 'Dynamic Programming', duration: '45 min', range: [0.46, 0.5] },
    { time: '11:00', task: 'Graph Algorithms', duration: '60 min', range: [0.5, 0.54] },
    { time: '16:00', task: 'Active Revision', duration: '30 min', range: [0.54, 0.58] },
    { time: '19:00', task: 'Practice Quiz', duration: '30 min', range: [0.58, 0.62] },
  ];

  return (
    <div className="relative flex h-[360px] w-[310px] items-center justify-start pl-8 pointer-events-auto">
      {/* Vertical timeline track line */}
      <div className="absolute left-[36px] top-4 h-[300px] w-0.5 bg-white/10">
        <motion.div
          className="absolute top-0 w-full bg-gradient-to-b from-[#6542C5] to-accent-400"
          style={{ height: lineLength }}
        />
      </div>

      <div className="flex flex-col gap-4.5 w-full">
        {steps.map((step, i) => {
          // Slide in from left or right depending on scroll
          const cardOpacity = useTransform(scrollYProgress, [step.range[0], step.range[1]], [0, 1]);
          const cardX = useTransform(scrollYProgress, [step.range[0], step.range[1]], [25, 0]);
          const nodeScale = useTransform(scrollYProgress, [step.range[0], step.range[1]], [0.3, 1.0]);

          return (
            <div key={i} className="flex items-center gap-4 relative">
              {/* Timeline circle node */}
              <motion.div
                style={{ scale: nodeScale }}
                className="absolute left-[-5px] z-10 flex h-4 w-4 items-center justify-center rounded-full bg-ink-950 border-2 border-[#6542C5] shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
              </motion.div>

              {/* Step Card */}
              <motion.div
                style={{ opacity: cardOpacity, x: cardX }}
                className="ml-6 flex-1 flex items-center justify-between rounded-xl border border-white/10 bg-ink-900/80 p-2.5 backdrop-blur-md shadow-card"
              >
                <div>
                  <span className="text-[10px] font-bold text-accent-400 flex items-center gap-1">
                    <Clock size={10} /> {step.time}
                  </span>
                  <p className="text-[11px] font-bold text-white mt-0.5 truncate max-w-[140px]">{step.task}</p>
                </div>
                <Badge tone="neutral" className="text-[9px] px-1.5 py-0.5">
                  {step.duration}
                </Badge>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: Stage 4 - Focus Metrics and Rationale Panel
   ============================================================================ */
function Stage4Metrics({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  // Stage 4 range: 0.67 to 0.86
  // Progress circles and feedback panel
  const metrics = [
    { title: 'Focus', val: 94, color: 'stroke-accent-400', max: 0.72 },
    { title: 'Retention', val: 81, color: 'stroke-violet-400', max: 0.75 },
    { title: 'Overall', val: 67, color: 'stroke-primary-400', max: 0.78 },
  ];

  // AI Dialog panel reveal range
  const promptOpacity = useTransform(scrollYProgress, [0.77, 0.83], [0, 1]);
  const promptY = useTransform(scrollYProgress, [0.77, 0.83], [20, 0]);

  return (
    <div className="relative flex flex-col items-center justify-center w-[300px] h-[340px] pointer-events-auto">
      {/* Gauge Grid */}
      <div className="flex justify-center gap-4 w-full mb-5">
        {metrics.map((m, i) => {
          // Circular path fill maps from scroll progress
          const pathFill = useTransform(scrollYProgress, [0.68, m.max], [0, m.val]);
          const scale = useTransform(scrollYProgress, [0.68, m.max], [0.8, 1.0]);

          return (
            <motion.div
              key={i}
              style={{ scale }}
              className="flex flex-col items-center rounded-xl border border-white/5 bg-ink-950/70 p-2 w-[76px] backdrop-blur-md"
            >
              {/* SVG Radial Progress */}
              <div className="relative h-11 w-11 flex items-center justify-center">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-white/10"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    className={m.color}
                    strokeWidth="3.5"
                    strokeDasharray="100, 100"
                    fill="none"
                    // Maps dynamic percentage to SVG path length
                    style={{
                      strokeDasharray: useTransform(pathFill, (val) => `${val}, 100`),
                    }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-white leading-none">{m.val}%</span>
              </div>
              <span className="mt-1.5 text-[9px] font-bold text-ink-300 uppercase tracking-wide">{m.title}</span>
            </motion.div>
          );
        })}
      </div>

      {/* AI Decision Panel */}
      <motion.div
        style={{ opacity: promptOpacity, y: promptY }}
        className="w-[280px] rounded-2xl border border-[#6542C5]/20 bg-gradient-to-br from-primary-950/80 to-ink-950/90 p-3.5 backdrop-blur-md shadow-glow-violet"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles size={11} className="text-[#B59AF7] animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#B59AF7]">Nova Adaptation Engine</span>
        </div>
        <p className="text-[10.5px] leading-relaxed text-ink-200">
          "Your attention retention fell in Dynamic Programming. I've re-shuffled tomorrow's schedule to give you a
          15-min diagnostic session."
        </p>
      </motion.div>
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: Stage 5 - Final Adaptive Study Ecosystem Grid
   ============================================================================ */
function Stage5Ecosystem({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  // Stage 5 range: 0.88 to 1.0
  // Renders dashboard nodes orbiting the AI core
  const nodes = [
    { title: '7 Day Streak', val: 'Level 6', icon: Flame, color: 'text-coral-400 bg-coral-500/10', x: -125, y: -100 },
    {
      title: "Today's focus",
      val: 'DP Practice',
      icon: Target,
      color: 'text-[#B59AF7] bg-[#6542C5]/10',
      x: 125,
      y: -100,
    },
    {
      title: 'Retention Score',
      val: '81% Mastered',
      icon: TrendingUp,
      color: 'text-accent-300 bg-accent-500/10',
      x: -125,
      y: 100,
    },
    {
      title: 'Next concept',
      val: 'Graphs Node',
      icon: BookOpen,
      color: 'text-emerald-400 bg-emerald-500/10',
      x: 125,
      y: 100,
    },
  ];

  return (
    <>
      {nodes.map((node, i) => {
        const x = useTransform(scrollYProgress, [0.88, 0.95], [node.x * 1.5, node.x]);
        const y = useTransform(scrollYProgress, [0.88, 0.95], [node.y * 1.5, node.y]);
        const scale = useTransform(scrollYProgress, [0.88, 0.95], [0.6, 1.0]);
        const opacity = useTransform(scrollYProgress, [0.88, 0.93], [0, 1]);

        return (
          <motion.div
            key={i}
            style={{ x, y, scale, opacity }}
            className="absolute flex items-center gap-2.5 rounded-xl border border-white/10 bg-ink-900/90 p-2.5 shadow-card w-[160px] pointer-events-auto backdrop-blur-sm z-30"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${node.color}`}>
              <node.icon size={16} />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-ink-400 truncate uppercase tracking-wider">{node.title}</p>
              <p className="text-[11px] font-bold text-white mt-0.5 truncate">{node.val}</p>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}
