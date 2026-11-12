import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  ArrowRight,
  Play,
  Target,
  Brain,
  Sparkles,
  CalendarRange,
  MessageSquare,
  ClipboardList,
  RefreshCw,
  Trophy,
  Flame,
  Zap,
  BookOpen,
  Mic,
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
  BarChart3,
} from 'lucide-react';
import { PublicNav } from '@/components/layout/PublicNav';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { AnimatedBackground } from '@/components/landing/AnimatedBackground';
import { PremiumCard } from '@/components/landing/PremiumCard';
import { SectionReveal, RevealItem, SectionHeading } from '@/components/landing/SectionReveal';
import { useLenis } from '@/hooks/useLenis';
import { useTheme } from '@/store/ThemeContext';
import { viewportConfig } from '@/lib/animations';
import { ScrollyTimeline } from '@/components/landing/ScrollyTimeline';
import { AICore } from '@/components/landing/AICore';

const PROBLEM_CARDS = [
  {
    icon: Users,
    title: 'Same plan for everyone',
    text: 'Classrooms move at one pace. If you fall behind or race ahead, the plan ignores it.',
  },
  {
    icon: AlertCircle,
    title: 'Weak areas ignored',
    text: 'You keep revising what you already know while the topics that hurt you stay weak.',
  },
  {
    icon: Clock,
    title: 'Last-minute cramming',
    text: 'Without a schedule tied to a deadline, everything piles into the night before the exam.',
  },
  {
    icon: MessageSquare,
    title: 'No instant doubt support',
    text: "A doubt at midnight kills momentum. Waiting for the next class isn't good enough.",
  },
];

const STEPS = [
  {
    icon: Target,
    title: 'Set Your Goal',
    text: "Tell Cadence what you're preparing for, your subjects, and your exam deadline.",
  },
  {
    icon: Brain,
    title: 'Assess Your Knowledge',
    text: "A short diagnostic finds exactly where you're strong and where you need work.",
  },
  {
    icon: Sparkles,
    title: 'Get Your AI Study Plan',
    text: 'Cadence builds a day-by-day plan tuned to your level, time, and weak topics.',
  },
  {
    icon: TrendingUp,
    title: 'Learn + Track + Adapt',
    text: 'Study, take quizzes, and watch your plan re-adapt as you improve.',
  },
];

const FEATURES = [
  {
    icon: CalendarRange,
    title: 'Personalized Study Plans',
    text: 'Day-by-day sessions built from your goal, deadline, and available hours.',
  },
  {
    icon: MessageSquare,
    title: 'AI Study Assistant',
    text: 'Ask questions in plain language and get explanations tuned to your level.',
  },
  {
    icon: Brain,
    title: 'Knowledge Assessment',
    text: 'Short diagnostics pinpoint strong, weak, and critical topics in minutes.',
  },
  {
    icon: RefreshCw,
    title: 'Adaptive Re-planning',
    text: 'Missed a session? Cadence reshuffles your plan so you still land on target.',
  },
  {
    icon: ClipboardList,
    title: 'Mock Tests',
    text: 'Generate quizzes by subject, topic, and difficulty — then see your weak spots.',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    text: 'Visualize study time, mastery, and accuracy trends week over week.',
  },
  {
    icon: Zap,
    title: 'Spaced Repetition',
    text: 'Topics you struggle with come back at the right interval so they stick.',
  },
  {
    icon: Mic,
    title: 'Voice Doubt Solving',
    text: 'Tap the mic, ask your question out loud, and get a spoken explanation back.',
  },
];

const PERSONALIZATION = [
  { label: 'Knowledge level', value: 'Beginner → Advanced' },
  { label: 'Weak areas', value: 'Detected from quizzes' },
  { label: 'Available hours', value: 'Per day, per week' },
  { label: 'Exam deadline', value: 'Countdown driven' },
  { label: 'Previous performance', value: 'Accuracy trend' },
];

export function Landing() {
  useLenis(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`${theme} relative min-h-screen overflow-x-clip ${isDark ? 'bg-[#141217] text-[#F5F0E8]' : 'bg-[#F1EDE6] text-[#211D28]'} transition-colors duration-300`}
    >
      <AnimatedBackground />
      <PublicNav />
      <ScrollyJourney />
      <Features />
      <ProgressPreview />
      <AIPreview />
      <Gamification />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function ScrollyJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 25, restDelta: 0.001 });

  // Scroll to targeted learning stage index
  const handleStageClick = (index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop = rect.top + scrollTop;
    const scrollRange = rect.height - window.innerHeight;
    const targetScroll = containerTop + index * 0.25 * scrollRange;
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  };

  const STAGES = [
    { num: '01', label: 'Understand You' },
    { num: '02', label: 'Find Weak Spots' },
    { num: '03', label: 'Build Your Plan' },
    { num: '04', label: 'Learn & Practice' },
    { num: '05', label: 'Your Path' },
  ];

  const baseBg = isDark ? '#141217' : '#F1EDE6';
  const glowColor1 = isDark ? 'rgba(101, 66, 197, 0.14)' : 'rgba(101, 66, 197, 0.06)';
  const glowColor2 = isDark ? 'rgba(155, 114, 245, 0.14)' : 'rgba(101, 66, 197, 0.06)';
  const glowColor3 = isDark ? 'rgba(242, 179, 140, 0.11)' : 'rgba(242, 179, 140, 0.07)';
  const glowColor4 = isDark ? 'rgba(215, 113, 58, 0.14)' : 'rgba(242, 179, 140, 0.07)';
  const glowColor5 = isDark ? 'rgba(101, 66, 197, 0.18)' : 'rgba(101, 66, 197, 0.08)';

  // Map progress to distinct ambient backgrounds
  const bgOpacity1 = useTransform(smoothProgress, [0, 0.16, 0.2], [1, 1, 0]);
  const bgOpacity2 = useTransform(smoothProgress, [0.15, 0.22, 0.38, 0.44], [0, 1, 1, 0]);
  const bgOpacity3 = useTransform(smoothProgress, [0.38, 0.45, 0.61, 0.67], [0, 1, 1, 0]);
  const bgOpacity4 = useTransform(smoothProgress, [0.61, 0.67, 0.85, 0.91], [0, 1, 1, 0]);
  const bgOpacity5 = useTransform(smoothProgress, [0.85, 0.91, 1.0], [0, 1, 1]);

  // Stage content transitions (slide up + fade in/out)
  const opacity1 = useTransform(smoothProgress, [0, 0.15, 0.2], [1, 1, 0]);
  const y1 = useTransform(smoothProgress, [0, 0.15, 0.2], [0, 0, -35]);

  const opacity2 = useTransform(smoothProgress, [0.15, 0.22, 0.38, 0.44], [0, 1, 1, 0]);
  const y2 = useTransform(smoothProgress, [0.15, 0.22, 0.38, 0.44], [35, 0, 0, -35]);

  const opacity3 = useTransform(smoothProgress, [0.38, 0.45, 0.61, 0.67], [0, 1, 1, 0]);
  const y3 = useTransform(smoothProgress, [0.38, 0.45, 0.61, 0.67], [35, 0, 0, -35]);

  const opacity4 = useTransform(smoothProgress, [0.61, 0.67, 0.85, 0.91], [0, 1, 1, 0]);
  const y4 = useTransform(smoothProgress, [0.61, 0.67, 0.85, 0.91], [35, 0, 0, -35]);

  const opacity5 = useTransform(smoothProgress, [0.85, 0.91, 1.0], [0, 1, 1]);
  const y5 = useTransform(smoothProgress, [0.85, 0.91, 1.0], [35, 0, 0]);

  // Status updates matching current progress
  const stage1Status = useTransform(
    smoothProgress,
    [0, 0.08, 0.16],
    ['Analyzing your learning profile...', 'Analyzing your learning profile...', 'Learning profile created.'],
  );
  const stage2Status = useTransform(
    smoothProgress,
    [0.2, 0.28, 0.38],
    ['Scanning for weak areas...', 'Weak topic detected.', 'Dynamic Programming needs practice.'],
  );
  const stage3Status = useTransform(
    smoothProgress,
    [0.42, 0.52, 0.62],
    ['Generating your personalized plan...', 'Generating your plan...', 'Your plan is ready.'],
  );
  const stage4Status = useTransform(
    smoothProgress,
    [0.65, 0.74, 0.84],
    ['Detecting learning patterns...', 'Learning patterns detected.', "Cadence adapted tomorrow's schedule."],
  );

  return (
    <div ref={containerRef} className="relative h-[500vh] w-full">
      {/* Sticky Journey Frame */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center">
        {/* Dynamic Backgrounds */}
        <motion.div
          style={{
            opacity: bgOpacity1,
            background: `radial-gradient(circle at 50% 50%, ${glowColor1} 0%, ${baseBg} 85%)`,
          }}
          className="absolute inset-0 -z-10"
        />
        <motion.div
          style={{
            opacity: bgOpacity2,
            background: `radial-gradient(circle at 50% 50%, ${glowColor2} 0%, ${baseBg} 85%)`,
          }}
          className="absolute inset-0 -z-10"
        />
        <motion.div
          style={{
            opacity: bgOpacity3,
            background: `radial-gradient(circle at 50% 50%, ${glowColor3} 0%, ${baseBg} 85%)`,
          }}
          className="absolute inset-0 -z-10"
        />
        <motion.div
          style={{
            opacity: bgOpacity4,
            background: `radial-gradient(circle at 50% 50%, ${glowColor4} 0%, ${baseBg} 85%)`,
          }}
          className="absolute inset-0 -z-10"
        />
        <motion.div
          style={{
            opacity: bgOpacity5,
            background: `radial-gradient(circle at 50% 50%, ${glowColor5} 0%, ${baseBg} 85%)`,
          }}
          className="absolute inset-0 -z-10"
        />

        {/* Fine grid */}
        <div className="absolute inset-0 bg-grid-fine opacity-20 -z-10" />

        {/* Side Timeline Tracker */}
        <ScrollyTimeline scrollYProgress={smoothProgress} stages={STAGES} onStageClick={handleStageClick} />

        {/* Main Grid Wrapper */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 items-center justify-center h-full pt-16 pb-12">
          {/* Info cards (Left) */}
          <div className="relative w-full lg:col-span-6 flex flex-col justify-center min-h-[180px] md:min-h-[220px] lg:min-h-[400px]">
            {/* Stage 1 */}
            <motion.div style={{ opacity: opacity1, y: y1 }} className="absolute inset-0 flex flex-col justify-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#6542C5] dark:text-[#B59AF7]">
                01 — Understand You
              </span>
              <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white mt-2 sm:text-4xl lg:text-5xl leading-tight">
                Cadence learns how <br /> you learn.
              </h1>
              <p className="text-xs sm:text-base text-slate-600 dark:text-ink-300 mt-4 max-w-md">
                We begin by assessing your current profile: strong topics, available study hours, specific exam
                deadlines, and personal style preferences.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 max-w-md">
                <span className="rounded-none border border-[#D8D0C5] bg-[#E8E1D7] dark:border-white/10 dark:bg-white/5 px-2.5 py-0.5 text-xs text-[#211D28] dark:text-[#D8D0C5]">
                  Strong: Arrays
                </span>
                <span className="rounded-none border border-[#D8D0C5] bg-[#E8E1D7] dark:border-white/10 dark:bg-white/5 px-2.5 py-0.5 text-xs text-[#211D28] dark:text-[#D8D0C5]">
                  Weak: DP
                </span>
                <span className="rounded-none border border-[#D8D0C5] bg-[#E8E1D7] dark:border-white/10 dark:bg-white/5 px-2.5 py-0.5 text-xs text-[#211D28] dark:text-[#D8D0C5]">
                  Time: 2 hrs/day
                </span>
                <span className="rounded-none border border-[#D8D0C5] bg-[#E8E1D7] dark:border-white/10 dark:bg-white/5 px-2.5 py-0.5 text-xs text-[#211D28] dark:text-[#D8D0C5]">
                  Deadline: Oct 15
                </span>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6542C5] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6542C5]"></span>
                </span>
                <motion.span className="text-xs font-semibold text-[#6542C5] dark:text-[#B59AF7]">
                  {stage1Status}
                </motion.span>
              </div>
            </motion.div>

            {/* Stage 2 */}
            <motion.div
              style={{ opacity: opacity2, y: y2 }}
              className="absolute inset-0 flex flex-col justify-center pointer-events-none"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#6542C5] dark:text-[#B59AF7]">
                02 — Find Your Weak Spots
              </span>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white mt-2 sm:text-4xl lg:text-5xl leading-tight">
                Know what needs <br /> your attention.
              </h2>
              <p className="text-xs sm:text-base text-slate-600 dark:text-ink-300 mt-4 max-w-md">
                No more guessing. Cadence conducts quick smart quizzes that pinpoint topic mastery level, helping you
                focus where it makes the biggest difference.
              </p>

              <div className="mt-6 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6542C5] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6542C5]"></span>
                </span>
                <motion.span className="text-xs font-semibold text-[#6542C5] dark:text-[#B59AF7]">
                  {stage2Status}
                </motion.span>
              </div>
            </motion.div>

            {/* Stage 3 */}
            <motion.div
              style={{ opacity: opacity3, y: y3 }}
              className="absolute inset-0 flex flex-col justify-center pointer-events-none"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#F2B38C] dark:text-[#F2B38C]">
                03 — Build Your Plan
              </span>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white mt-2 sm:text-4xl lg:text-5xl leading-tight">
                Your plan changes <br /> with you.
              </h2>
              <p className="text-xs sm:text-base text-slate-600 dark:text-ink-300 mt-4 max-w-md">
                Cadence designs a calendar mapped to your schedule. If you miss a session, the AI adapts and
                automatically reshuffles your topics so you stay on track.
              </p>

              <div className="mt-6 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F2B38C] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F2B38C]"></span>
                </span>
                <motion.span className="text-xs font-semibold text-[#D7713A] dark:text-[#F2B38C]">
                  {stage3Status}
                </motion.span>
              </div>
            </motion.div>

            {/* Stage 4 */}
            <motion.div
              style={{ opacity: opacity4, y: y4 }}
              className="absolute inset-0 flex flex-col justify-center pointer-events-none"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                04 — Learn & Practice
              </span>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white mt-2 sm:text-4xl lg:text-5xl leading-tight">
                Every session teaches <br /> Cadence something new.
              </h2>
              <p className="text-xs sm:text-base text-slate-600 dark:text-ink-300 mt-4 max-w-md">
                As you practice, Cadence observes your retention curve and focus duration, adjusting the difficulty
                levels in real-time to match your growth.
              </p>

              <div className="mt-6 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <motion.span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {stage4Status}
                </motion.span>
              </div>
            </motion.div>

            {/* Stage 5 */}
            <motion.div style={{ opacity: opacity5, y: y5 }} className="absolute inset-0 flex flex-col justify-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#6542C5] dark:text-[#B59AF7]">
                05 — Your Path
              </span>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white mt-2 sm:text-4xl lg:text-5xl leading-tight">
                Your study plan <br /> is never finished.
              </h2>
              <p className="text-xs sm:text-base text-slate-600 dark:text-ink-300 mt-4 max-w-md">
                A living study ecosystem that learns from your daily performance and evolves to ensure perfect
                retention.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/signup">
                  <Button size="lg" variant="primary" className="btn-render-sweep-lg">
                    Build My Study Plan <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/app">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#6542C5]/40 bg-transparent text-[#6542C5] hover:border-[#6542C5] dark:border-[#B59AF7]/40 dark:text-[#B59AF7] dark:hover:border-[#B59AF7]"
                  >
                    Explore Demo
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* AI Core Protagonist (Right) */}
          <div className="w-full lg:col-span-6 flex items-center justify-center relative mt-4 lg:mt-0">
            <AICore scrollYProgress={smoothProgress} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Features() {
  return (
    <SectionReveal id="features" className="py-20" stagger={0.06}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading light tag="Features" title="Everything you need to study smarter" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <PremiumCard key={f.title} glow={i % 3 === 0} tilt={i === 2 || i === 5} className="p-5">
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
                transition={{ duration: 0.4 }}
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-none bg-[#F5F3FD] dark:bg-[#B59AF7]/10 text-[#6542C5] dark:text-[#B59AF7]"
              >
                <f.icon size={20} />
              </motion.div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-ink-400">{f.text}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

function ProgressPreview() {
  const weekData = [
    { d: 'Mon', h: 1.6 },
    { d: 'Tue', h: 2 },
    { d: 'Wed', h: 1.25 },
    { d: 'Thu', h: 2.2 },
    { d: 'Fri', h: 1 },
    { d: 'Sat', h: 2.3 },
    { d: 'Sun', h: 1.7 },
  ];

  const topics = [
    { t: 'Dynamic Programming', v: 42, color: 'from-[#D7713A] to-[#F2B38C]' },
    { t: 'Graph Algorithms', v: 58, color: 'from-[#C05800] to-[#D7713A]' },
    { t: 'DBMS', v: 81, color: 'from-[#6542C5] to-[#F2B38C]' },
    { t: 'Operating Systems', v: 73, color: 'from-[#B59AF7] to-[#6542C5]' },
    { t: 'Computer Networks', v: 67, color: 'from-[#F2B38C] to-[#B59AF7]' },
  ];

  return (
    <SectionReveal id="progress" className="surface-premium py-20" stagger={0.1}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          light
          tag="Progress"
          title="See exactly where you stand"
          subtitle="Live metrics that update as you learn"
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <PremiumCard glow className="p-6">
            <div className="flex flex-col items-center">
              <ProgressRing value={34} size={140} label="34%" sublabel="overall" />
              <p className="mt-4 text-sm text-slate-500 dark:text-ink-400">Overall completion</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-accent-300">
                <TrendingUp size={12} />
                <AnimatedNumber value={12} prefix="+" suffix="% this week" />
              </div>
            </div>
          </PremiumCard>
          <PremiumCard glow className="p-6 lg:col-span-2">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Weekly study hours</h3>
            <div className="mt-6 flex items-end justify-between gap-2">
              {weekData.map((bar, i) => (
                <div key={bar.d} className="flex flex-1 flex-col items-center gap-2">
                  <motion.div
                    className="w-full bg-gradient-to-t from-[#6542C5] via-[#9B72F5] to-[#F2B38C]"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${(bar.h / 2.5) * 140}px` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <span className="text-xs text-slate-400 dark:text-ink-500">{bar.d}</span>
                </div>
              ))}
            </div>
          </PremiumCard>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <PremiumCard className="p-6">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Topic strength</h3>
            <div className="mt-4 space-y-3">
              {topics.map((row, i) => (
                <div key={row.t}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-ink-300">{row.t}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      <AnimatedNumber value={row.v} suffix="%" duration={1000 + i * 200} />
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${row.color}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${row.v}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>
          <PremiumCard className="p-6">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Upcoming sessions</h3>
            <div className="mt-4 space-y-3">
              {[
                { day: 'Today', topic: 'Dynamic Programming', tone: 'primary' as const },
                { day: 'Tomorrow', topic: 'Graph Algorithms', tone: 'accent' as const },
                { day: 'Friday', topic: 'Mock Test', tone: 'warning' as const },
                { day: 'Saturday', topic: 'Revision', tone: 'neutral' as const },
              ].map((s, i) => (
                <motion.div
                  key={s.day}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between rounded-none border border-[#D8D0C5] bg-[#FBF8F2] dark:border-white/10 dark:bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-xs text-slate-400 dark:text-ink-500">{s.day}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.topic}</p>
                  </div>
                  <Badge tone={s.tone}>Scheduled</Badge>
                </motion.div>
              ))}
            </div>
          </PremiumCard>
        </div>
      </div>
    </SectionReveal>
  );
}

function AIPreview() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <SectionReveal id="ai-preview" className="py-20" stagger={0.1}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading light tag="AI tutor" title="Ask anything. Get a real answer." />
        <RevealItem>
          <div className="relative mx-auto max-w-2xl">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#6542C5]/10 via-[#B59AF7]/10 to-[#F2B38C]/10 dark:from-[#6542C5]/20 dark:to-[#F2B38C]/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 dark:border-white/10 dark:bg-[#111827]/90 p-6 backdrop-blur-2xl sm:p-8 shadow-sm">
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportConfig}
                  className="flex justify-end"
                >
                  <div className="max-w-[80%] rounded-none bg-[#6542C5] dark:bg-[#B59AF7] px-4 py-3 text-sm text-white dark:text-[#141217]">
                    Can you explain dynamic programming in simple terms?
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportConfig}
                  transition={{ delay: 0.15 }}
                  className="flex gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-gradient-to-br from-[#6542C5] via-[#9B72F5] to-[#F2B38C] text-white">
                    <Sparkles size={14} />
                  </div>
                  <div className="max-w-[85%] rounded-none border border-[#D8D0C5] bg-[#FBF8F2] px-4 py-3 text-sm text-[#211D28] dark:border-white/10 dark:bg-white/5 dark:text-[#D8D0C5]">
                    Think of dynamic programming as solving a big problem by remembering solutions to smaller problems
                    you've already solved, instead of recomputing them.
                    <span className="ml-1 inline-flex gap-0.5">
                      <span className="animate-blink">.</span>
                      <span className="animate-blink" style={{ animationDelay: '0.2s' }}>
                        .
                      </span>
                      <span className="animate-blink" style={{ animationDelay: '0.4s' }}>
                        .
                      </span>
                    </span>
                  </div>
                </motion.div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Explain like I'm a beginner", 'Give me an example', 'Quiz me on this'].map((p, i) => (
                  <motion.button
                    key={p}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="rounded-none border border-[#D8D0C5] bg-[#FBF8F2] px-3 py-1.5 text-xs font-medium text-[#211D28] transition hover:border-[#6542C5]/60 hover:bg-[#F5F3FD] dark:border-white/15 dark:bg-white/5 dark:text-[#D8D0C5] dark:hover:border-[#B59AF7]/40 dark:hover:bg-[#B59AF7]/10 dark:hover:text-[#B59AF7]"
                  >
                    {p}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </RevealItem>
      </div>
    </SectionReveal>
  );
}

function Gamification() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const badges = [
    {
      icon: Flame,
      title: '7 Day Streak',
      color: isDark ? 'text-[#F2B38C] bg-[#F2B38C]/15' : 'text-[#C05800] bg-[#C05800]/10',
    },
    {
      icon: Target,
      title: 'First Goal',
      color: isDark ? 'text-[#B59AF7] bg-[#6542C5]/15' : 'text-[#6542C5] bg-[#F5F3FD]',
    },
    {
      icon: Brain,
      title: 'Quiz Master',
      color: isDark ? 'text-accent-300 bg-accent-500/15' : 'text-[#6542C5] bg-[#F5F3FD]',
    },
    {
      icon: BookOpen,
      title: '10 Topics',
      color: isDark ? 'text-emerald-400 bg-emerald-500/15' : 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: Zap,
      title: 'Consistency',
      color: isDark ? 'text-violet-300 bg-violet-500/15' : 'text-violet-600 bg-violet-50',
    },
    {
      icon: Trophy,
      title: 'Comeback Kid',
      color: isDark ? 'text-[#F2B38C] bg-[#F2B38C]/15' : 'text-[#C05800] bg-[#C05800]/10',
    },
  ];

  return (
    <SectionReveal className="surface-premium py-20" stagger={0.08}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading light tag="Gamification" title="Stay motivated, build consistency" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Flame,
              value: 7,
              suffix: ' days',
              label: 'Current streak — keep it alive!',
              color: isDark ? 'text-[#F2B38C] bg-[#F2B38C]/15' : 'text-[#C05800] bg-[#C05800]/10',
            },
            {
              icon: Zap,
              value: 2450,
              suffix: ' XP',
              label: 'Level 6 · 550 XP to level 7',
              color: isDark
                ? 'text-[#B59AF7] bg-[#6542C5]/15'
                : 'text-[#6542C5] bg-[#F5F3FD]',
            },
            {
              icon: Trophy,
              value: 2,
              suffix: '/6 unlocked',
              label: 'Achievements earned',
              color: isDark ? 'text-accent-300 bg-accent-500/15' : 'text-[#6542C5] bg-[#F5F3FD]',
              extra: true,
            },
          ].map((stat) => (
            <PremiumCard key={stat.label} glow className="flex items-center gap-4 p-5">
              <div className={`flex h-14 w-14 items-center justify-center rounded-none ${stat.color}`}>
                <stat.icon size={26} />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.extra ? (
                    <>
                      <AnimatedNumber value={2} />/<AnimatedNumber value={6} /> unlocked
                    </>
                  ) : (
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  )}
                </p>
                <p className="text-sm text-slate-500 dark:text-ink-400">{stat.label}</p>
              </div>
            </PremiumCard>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {badges.map((b) => (
            <PremiumCard key={b.title} className="flex flex-col items-center gap-2 p-4 text-center">
              <div className={`flex h-12 w-12 items-center justify-center rounded-none ${b.color}`}>
                <b.icon size={22} />
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-ink-200">{b.title}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

function FinalCTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={viewportConfig}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative overflow-hidden rounded-none border border-[#6542C5]/30 dark:border-[#B59AF7]/20 p-8 sm:p-12" style={{ background: "linear-gradient(135deg, #3E2579 0%, #6542C5 40%, #D7713A 100%)" }}>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-[#F2B38C]/20 blur-2xl" />
            <div className="relative text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Stop Studying More. Start Studying Smarter.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/80">
                Build your personalized plan in under two minutes and see the difference adaptive learning makes.
              </p>
              <Link to="/signup" className="mt-8 inline-block">
                <Button
                  size="lg"
                  variant="secondary"
                  className="btn-render-sweep-lg bg-white text-[#3E2579] hover:bg-[#F5F3FD] shadow-md rounded-none"
                >
                  Create My Personalized Plan <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
