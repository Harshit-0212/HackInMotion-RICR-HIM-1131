import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Brain,
  RefreshCw,
  FileText,
  Compass,
  Code,
  GraduationCap,
  Target,
  BookOpen,
  Flame,
  Shield,
  Award,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/store/AuthContext';
import { useAppData } from '@/store/AppDataContext';
import { TodaysPlanSection } from '@/components/dashboard/TodaysPlanSection';
import { LearningProgressSection } from '@/components/dashboard/LearningProgressSection';
import { MyCoursesSection } from '@/components/dashboard/MyCoursesSection';
import { RecommendedSection } from '@/components/dashboard/RecommendedSection';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Reveal, Stagger } from '@/components/ui/Reveal';
import { Chip } from '@/components/ui/Chip';
import { ConfettiCanvas } from '@/components/ui/ConfettiCanvas';
import { gamificationService, type UserGamificationData } from '@/services/gamificationService';
import { learningFeaturesService } from '@/services/learningFeaturesService';
import { Layers, Calendar, BrainCircuit } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { plan, progress, weakTopics, isReady, autoAdjustPlan } = useAppData();
  const [gamification, setGamification] = useState<UserGamificationData | null>(null);
  const [dueCardsCount, setDueCardsCount] = useState<number>(3);
  const [nextCalendarEvent, setNextCalendarEvent] = useState<string>('Operating Systems Mock Quiz');
  const [lastInterviewScore, setLastInterviewScore] = useState<number | null>(84);

  useEffect(() => {
    gamificationService.getProfile().then(setGamification).catch(() => {});
    learningFeaturesService.getDueFlashcards().then((c) => c && setDueCardsCount(c.length)).catch(() => {});
    learningFeaturesService.getCalendarEvents().then((evs) => evs && evs.length > 0 && setNextCalendarEvent(evs[0].title)).catch(() => {});
    learningFeaturesService.getInterviewReports().then((r) => r && r.length > 0 && setLastInterviewScore(r[0].overallScore)).catch(() => {});
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Learner';

  const todaySession = useMemo(
    () =>
      plan?.sessions.find((s) => s.status === 'in-progress') ??
      plan?.sessions.find((s) => s.status === 'upcoming'),
    [plan],
  );

  const hasMissed = plan?.sessions.some((s) => s.status === 'missed') ?? false;

  // Single source of truth for completion
  const overallPercent = plan?.completionPercent ?? progress?.overallCompletion ?? 0;
  const isPlanCompleted = overallPercent >= 100;

  // Real streak calculation derived from backend gamification/progress
  const streakDays = gamification?.currentStreak ?? progress?.streakDays ?? 0;

  if (!isReady) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  // Proper Empty State for new users with no plan
  if (!plan) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#D8D0C5] dark:border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6542C5] dark:text-[#B59AF7]">
                <Sparkles size={14} /> Learning Workspace
              </div>
              <h1 className="mt-1 font-space text-2xl sm:text-3xl font-bold tracking-tight text-[#211D28] dark:text-[#F5F0E8]">
                Welcome to Cadence, {firstName}
              </h1>
              <p className="mt-1 text-sm text-[#5F5668] dark:text-[#B8AFBE]">
                Your personal AI coding coach and structured computer science curriculum.
              </p>
            </div>
            <Link to="/app/journey">
              <button className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-[#6542C5] hover:bg-[#51329F] dark:bg-[#B59AF7] dark:hover:bg-[#C6AFFB] px-4 text-xs font-bold text-white dark:text-[#141217] shadow-sm transition-colors">
                <Compass size={14} /> Open Journey
              </button>
            </Link>
          </div>

          <SpotlightCard className="p-8 text-center max-w-2xl mx-auto space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-[#6542C5]/10 text-[#6542C5] dark:bg-[#B59AF7]/15 dark:text-[#B59AF7] flex items-center justify-center mx-auto">
              <Sparkles size={28} />
            </div>
            <h2 className="font-space text-2xl font-bold text-[#211D28] dark:text-[#F5F0E8]">
              Ready to start your learning path?
            </h2>
            <p className="text-sm text-[#5F5668] dark:text-[#B8AFBE] leading-relaxed max-w-md mx-auto">
              You haven't set up a study plan yet. Start with our verified curriculum, or explore code comprehension drills and algorithmic challenges.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link to="/app/journey">
                <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#6542C5] hover:bg-[#51329F] dark:bg-[#B59AF7] dark:hover:bg-[#C6AFFB] text-white dark:text-[#141217] font-bold text-xs px-5 shadow-sm transition-colors">
                  <Compass size={15} /> Launch Arrays Fundamentals
                </button>
              </Link>
              <Link to="/app/comprehension">
                <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7]/40 text-[#211D28] dark:text-[#F5F0E8] font-semibold text-xs px-5 hover:bg-[#E8E1D7] transition-colors">
                  <GraduationCap size={15} /> Try Comprehension
                </button>
              </Link>
            </div>
          </SpotlightCard>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ConfettiCanvas active={isPlanCompleted} />

      <div className="space-y-6">
        {/* Welcome Header */}
        <Reveal variant="fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#D8D0C5] dark:border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6542C5] dark:text-[#B59AF7]">
                <Sparkles size={14} /> Learning Workspace
              </div>
              <h1 className="mt-1 font-space text-2xl sm:text-3xl font-bold tracking-tight text-[#211D28] dark:text-[#F5F0E8]">
                Welcome back, {firstName}
              </h1>
              <p className="mt-1 text-sm text-[#5F5668] dark:text-[#B8AFBE]">
                {todaySession
                  ? `Today's target: ${todaySession.topic} (~${todaySession.estimatedMinutes} mins)`
                  : 'All sessions up to date! Great consistency.'}
              </p>
            </div>
            <Link to="/app/journey">
              <button className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-[#6542C5] hover:bg-[#51329F] dark:bg-[#B59AF7] dark:hover:bg-[#C6AFFB] px-4 text-xs font-bold text-white dark:text-[#141217] shadow-sm transition-colors">
                <Compass size={14} /> Open Journey
              </button>
            </Link>
          </div>
        </Reveal>

        {/* Schedule Adjustment Callout */}
        {hasMissed && (
          <Reveal variant="fade-up">
            <div className="rounded-2xl border border-[#DD6B20]/40 dark:border-[#F6AD55]/30 bg-[#FFF9F0] dark:bg-[#DD6B20]/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEEFD6] dark:bg-[#DD6B20]/20 text-[#DD6B20] dark:text-[#F6AD55] shrink-0">
                  <RefreshCw size={17} />
                </div>
                <div>
                  <h4 className="font-space text-xs font-bold uppercase tracking-wider text-[#DD6B20] dark:text-[#F6AD55]">
                    Schedule adjustment recommended
                  </h4>
                  <p className="text-xs text-[#5F5668] dark:text-[#B8AFBE] mt-0.5">
                    You have a pending session from earlier. Auto-adjust will rebalance your study targets.
                  </p>
                </div>
              </div>
              <button
                onClick={autoAdjustPlan}
                className="px-3.5 py-1.5 rounded-xl bg-[#DD6B20] hover:bg-[#C05621] text-white text-xs font-bold transition-colors shrink-0"
              >
                Auto-Adjust Schedule
              </button>
            </div>
          </Reveal>
        )}

        {/* ============================================================
            12-COLUMN RESPONSIVE BENTO GRID (Phase 5)
            ============================================================ */}
        <Stagger className="grid grid-cols-1 md:grid-cols-12 gap-5" stagger={0.06}>
          {/* Bento Item 1: Hero Continue Learning Card (8 cols x 2 rows) */}
          <div className="md:col-span-8 md:row-span-2">
            <SpotlightCard className="h-full flex flex-col justify-between bg-gradient-to-br from-[#6542C5] via-[#51329F] to-[#3E2579] text-white border-[#51329F]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider font-mono">
                    <Sparkles size={13} /> Active Course
                  </span>
                  <span className="text-xs opacity-80">
                    {todaySession?.subject || 'Computer Science'}
                  </span>
                </div>

                <div>
                  <h2 className="font-space text-2xl sm:text-3xl font-bold tracking-tight">
                    {plan.goalTitle || 'Data Structures & Algorithms'}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm opacity-85">
                    Current Focus:{' '}
                    <strong>{todaySession?.topic || 'Graph Traversal (BFS & DFS)'}</strong>
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center text-xs opacity-90">
                    <span>Course Progress</span>
                    <span className="font-space font-bold text-sm">
                      <AnimatedNumber value={overallPercent} suffix="%" />
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#F2B38C]"
                      initial={{ width: 0 }}
                      animate={{ width: `${overallPercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] opacity-75 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> ~{todaySession?.estimatedMinutes || 45} min estimated
                    </span>
                    <span>
                      {todaySession?.conceptsDone ?? 0} of {todaySession?.conceptsTotal ?? 10} concepts completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Large CTA with dynamic completed state */}
              <div className="pt-6 mt-4 border-t border-white/15 flex items-center justify-between flex-wrap gap-3">
                {isPlanCompleted ? (
                  <Link to="/app/assessments">
                    <button className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#F2B38C] text-[#211D28] hover:bg-[#F5BEA5] px-6 text-sm font-bold shadow-md transition-colors">
                      <Sparkles size={16} /> Take a Mock Test
                    </button>
                  </Link>
                ) : (
                  <Link to="/app/session">
                    <button className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white text-[#51329F] hover:bg-[#F5F3FD] px-6 text-sm font-bold shadow-md transition-colors">
                      <Play size={16} className="fill-current" /> Continue Lesson <ArrowRight size={16} />
                    </button>
                  </Link>
                )}

                <Link to="/app/plan" className="text-xs font-semibold opacity-85 hover:opacity-100 underline">
                  View Syllabus →
                </Link>
              </div>
            </SpotlightCard>
          </div>

          {/* Bento Item 2: Weak Spots Tall Card (4 cols x 2 rows) */}
          <div className="md:col-span-4 md:row-span-2">
            <SpotlightCard className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#D8D0C5] dark:border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-[#F2B38C]/20 text-[#D7713A] dark:text-[#F2B38C] flex items-center justify-center">
                      <Brain size={16} />
                    </div>
                    <div>
                      <h3 className="font-space text-sm font-bold text-[#211D28] dark:text-[#F5F0E8]">
                        Weak Spots
                      </h3>
                      <p className="text-[10px] text-[#8A8192]">Click topic to drill</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#D7713A] bg-[#FDF6F0] dark:bg-[#F2B38C]/15 px-2 py-0.5 rounded-full font-mono">
                    {weakTopics?.length || 0} Topics
                  </span>
                </div>

                <div className="space-y-2">
                  {weakTopics && weakTopics.length > 0 ? (
                    weakTopics.map((topic) => (
                      <Link key={topic} to="/app/assessments" className="block">
                        <div className="p-3 rounded-2xl border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7]/30 hover:border-[#6542C5] dark:hover:border-[#B59AF7] transition-colors flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#211D28] dark:text-[#F5F0E8] truncate">
                            {topic}
                          </span>
                          <span className="text-[10px] font-bold text-[#6542C5] dark:text-[#B59AF7]">
                            Practice →
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-[#8A8192] space-y-1">
                      <CheckCircle2 size={24} className="mx-auto text-[#2F855A] dark:text-[#48BB78]" />
                      <p className="font-semibold text-[#211D28] dark:text-[#F5F0E8]">No gaps detected!</p>
                      <p className="text-[11px]">Keep maintaining your consistency.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#D8D0C5] dark:border-white/10">
                <Link to="/app/assessments">
                  <button className="w-full py-2 rounded-xl bg-[#E8E1D7] dark:bg-[#28222F] text-xs font-bold text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white transition-colors text-center">
                    Full Diagnostic Quiz
                  </button>
                </Link>
              </div>
            </SpotlightCard>
          </div>

          {/* Bento Item 3: Daily Goal Progress Ring Tile (4 cols) */}
          <div className="md:col-span-4">
            <SpotlightCard className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8192]">Daily Goal</span>
                <p className="font-space text-2xl font-bold text-[#211D28] dark:text-[#F5F0E8] mt-1">
                  {todaySession ? `${todaySession.estimatedMinutes}m` : 'Done'}
                </p>
                <p className="text-[11px] text-[#5F5668] dark:text-[#B8AFBE] mt-0.5 truncate max-w-[140px]">
                  {todaySession ? todaySession.topic : 'Target complete'}
                </p>
              </div>
              <ProgressRing
                value={todaySession ? Math.round((todaySession.conceptsDone / (todaySession.conceptsTotal || 10)) * 100) : 100}
                size={76}
                stroke={7}
                label={`${todaySession ? todaySession.conceptsDone : 10}`}
                sublabel="done"
              />
            </SpotlightCard>
          </div>

          {/* Bento Item 4: Comprehension Small Tile (4 cols) */}
          <div className="md:col-span-4">
            <SpotlightCard className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8192]">Comprehension</span>
                <p className="font-space text-2xl font-bold text-[#211D28] dark:text-[#F5F0E8] mt-1">
                  Stage 1 & 2
                </p>
                <p className="text-[11px] text-[#5F5668] dark:text-[#B8AFBE] mt-0.5">
                  Arrays code trace ready
                </p>
              </div>
              <Link to="/app/comprehension">
                <div className="h-12 w-12 rounded-2xl bg-[#6542C5]/10 text-[#6542C5] dark:bg-[#B59AF7]/15 dark:text-[#B59AF7] flex items-center justify-center hover:scale-105 transition-transform">
                  <GraduationCap size={22} />
                </div>
              </Link>
            </SpotlightCard>
          </div>

          {/* Bento Item 5: Streak + Gamification Wide Card with Mini Heatmap (4 cols) */}
          <div className="md:col-span-4">
            <SpotlightCard className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8192]">Study Streak</span>
                  <p className="font-space text-2xl font-bold text-[#211D28] dark:text-[#F5F0E8] mt-1 flex items-center gap-1.5">
                    <Flame size={22} className="text-[#D7713A] dark:text-[#F2B38C] fill-current" />
                    <AnimatedNumber value={streakDays} suffix={streakDays === 1 ? ' day' : ' days'} />
                  </p>
                  <p className="text-[11px] text-[#5F5668] dark:text-[#B8AFBE] mt-0.5">
                    {gamification?.streakFreezesAvailable ?? 1} freeze available
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#F2B38C]/15 text-[#D7713A] dark:text-[#F2B38C] flex items-center justify-center">
                  <Shield size={22} />
                </div>
              </div>

              {/* GitHub-style 7-day mini activity dots with stagger */}
              <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[10px] text-[#8A8192] font-medium">Past 7 days</span>
                <div className="flex items-center gap-1.5">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                    const isActive = i < Math.min(streakDays, 7);
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 400 }}
                        title={`${day}: ${isActive ? 'Active' : 'Rest'}`}
                        className={`h-4 w-4 rounded-md flex items-center justify-center text-[9px] font-bold ${
                          isActive
                            ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
                            : 'bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]'
                        }`}
                      >
                        {day}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </SpotlightCard>
          </div>
        </Stagger>

        {/* PRIMARY: Today's Plan Checklist & Progress Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TodaysPlanSection plan={plan} />
          <LearningProgressSection progress={progress} />
        </section>

        {/* SECONDARY: Active Courses Cards */}
        <section>
          <MyCoursesSection plan={plan} />
        </section>

        {/* Quick Review & Retention Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/app/flashcards" className="block">
            <SpotlightCard className="p-4 hover:border-[#6542C5] dark:hover:border-[#B59AF7] transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6542C5] dark:text-[#B59AF7] flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#211D28] dark:text-[#F5F0E8]">{dueCardsCount} Flashcards Due</p>
                  <p className="text-[10px] text-[#8A8192]">SM-2 Spaced Repetition</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-[#8A8192]" />
            </SpotlightCard>
          </Link>

          <Link to="/app/calendar" className="block">
            <SpotlightCard className="p-4 hover:border-[#6542C5] dark:hover:border-[#B59AF7] transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#211D28] dark:text-[#F5F0E8] truncate max-w-[150px]">{nextCalendarEvent}</p>
                  <p className="text-[10px] text-[#8A8192]">Next Upcoming Target</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-[#8A8192]" />
            </SpotlightCard>
          </Link>

          <Link to="/app/interview" className="block">
            <SpotlightCard className="p-4 hover:border-[#6542C5] dark:hover:border-[#B59AF7] transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BrainCircuit size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#211D28] dark:text-[#F5F0E8]">Mock Interview: {lastInterviewScore ?? '--'}%</p>
                  <p className="text-[10px] text-[#8A8192]">Practice AI Interview</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-[#8A8192]" />
            </SpotlightCard>
          </Link>
        </section>

        {/* SUPPORTING: Recommendations & AI Insight */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecommendedSection weakTopics={weakTopics} />
          <AIInsightCard weakTopics={weakTopics} />
        </section>
      </div>
    </AppLayout>
  );
}
