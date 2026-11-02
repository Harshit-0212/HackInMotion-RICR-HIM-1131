import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Brain,
  RefreshCw,
  FileText,
  Users,
  Compass,
  Code,
  GraduationCap,
  Target,
  BookOpen,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/store/AuthContext';
import { useAppData } from '@/store/AppDataContext';
import { ContinueLearningCard } from '@/components/dashboard/ContinueLearningCard';
import { TodaysPlanSection } from '@/components/dashboard/TodaysPlanSection';
import { LearningProgressSection } from '@/components/dashboard/LearningProgressSection';
import { MyCoursesSection } from '@/components/dashboard/MyCoursesSection';
import { RecommendedSection } from '@/components/dashboard/RecommendedSection';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { MetricCard } from '@/components/ui/MetricCard';
import { ActionCard } from '@/components/ui/ActionCard';

export function Dashboard() {
  const { user } = useAuth();
  const { plan, progress, weakTopics, isReady, autoAdjustPlan } = useAppData();

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  const todaySession = useMemo(
    () =>
      plan?.sessions.find((s) => s.status === 'in-progress') ??
      plan?.sessions.find((s) => s.status === 'upcoming'),
    [plan],
  );

  const hasMissed = plan?.sessions.some((s) => s.status === 'missed') ?? false;

  // Show loading skeleton while initializing data
  if (!isReady) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  // Polished Empty State if no study plan created yet
  if (!plan) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Contextual Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                <Sparkles size={14} /> Learning Workspace
              </div>
              <h1 className="mt-1 font-space text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome to Cadence, {firstName}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                A focused coding and curriculum environment built for mastery.
              </p>
            </div>
            <Link to="/app/journey">
              <button className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors">
                <Compass size={14} /> Open Journey
              </button>
            </Link>
          </div>

          {/* Quick Metrics (Watermelon UI Metric Blocks) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Curriculum"
              value="5 Stages"
              subtitle="Arrays Fundamentals ready"
              icon={<Compass size={18} className="text-blue-600 dark:text-blue-400" />}
            />
            <MetricCard
              label="Comprehension"
              value="Interactive"
              subtitle="Code trace exercises"
              icon={<GraduationCap size={18} className="text-emerald-600 dark:text-emerald-400" />}
            />
            <MetricCard
              label="Coding Bank"
              value="Active"
              subtitle="Server-judged tests"
              icon={<Code size={18} className="text-purple-600 dark:text-purple-400" />}
            />
            <MetricCard
              label="AI Tutor"
              value="Ready"
              subtitle="Contextual explanations"
              icon={<Brain size={18} className="text-indigo-600 dark:text-indigo-400" />}
            />
          </div>

          {/* Onboarding Call to Action */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#111827] p-6 sm:p-8">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                Getting Started
              </span>
              <h2 className="font-space text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Choose where you want to begin today
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Explore the mastery-based learning journey, trace code logic in comprehension exercises, or configure a customized study plan tailored to your target exam dates.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/app/journey">
                  <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 text-xs font-bold shadow-sm transition-colors">
                    Start Learning Journey <ArrowRight size={14} />
                  </button>
                </Link>
                <Link to="/app/comprehension">
                  <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors">
                    <GraduationCap size={15} className="text-emerald-600 dark:text-emerald-400" />
                    Code Comprehension Hub
                  </button>
                </Link>
                <Link to="/app/coding">
                  <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors">
                    <Code size={15} className="text-purple-600 dark:text-purple-400" />
                    Practice Problems
                  </button>
                </Link>
                <Link to="/app/plan">
                  <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <BookOpen size={15} />
                    Create Study Plan
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Preset Courses Preview */}
          <MyCoursesSection plan={plan} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Contextual Header with concise description */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspace Overview
            </div>
            <h1 className="mt-1 font-space text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cadence Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track active course progress, complete daily sessions, and verify code comprehension.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link to="/app/journey">
              <button className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors">
                <Compass size={14} /> Learning Journey
              </button>
            </Link>
            <Link to="/app/comprehension">
              <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
                <GraduationCap size={14} className="text-emerald-600 dark:text-emerald-400" /> Comprehension
              </button>
            </Link>
          </div>
        </div>

        {/* Adaptive Re-planning notification banner if sessions were missed */}
        {hasMissed && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 shrink-0">
                <RefreshCw size={17} />
              </div>
              <div>
                <h4 className="font-space text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Schedule adjustment recommended
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  You have a pending session from earlier. Auto-adjust will rebalance your study targets.
                </p>
              </div>
            </div>
            <button
              onClick={autoAdjustPlan}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shrink-0"
            >
              Auto-Adjust Schedule
            </button>
          </motion.div>
        )}

        {/* Top Actionable Metric Cards (Watermelon UI Component Pattern) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Daily Goal"
            value={todaySession ? `${todaySession.estimatedMinutes}m` : 'Completed'}
            subtitle={todaySession ? todaySession.topic : 'All tasks up to date'}
            badge={todaySession ? 'Active' : 'Done'}
            icon={<Target size={17} className="text-blue-600 dark:text-blue-400" />}
          />
          <MetricCard
            label="Plan Completion"
            value={`${plan?.completionPercent ?? 0}%`}
            subtitle="Overall syllabus coverage"
            trend={{ value: '+12% this week', isPositive: true }}
            icon={<BookOpen size={17} className="text-indigo-600 dark:text-indigo-400" />}
          />
          <MetricCard
            label="Comprehension"
            value="Stage 1 & 2"
            subtitle="Arrays code trace ready"
            icon={<GraduationCap size={17} className="text-emerald-600 dark:text-emerald-400" />}
          />
          <MetricCard
            label="Weak Spots"
            value={weakTopics?.length || 0}
            subtitle={weakTopics?.length ? 'Targeted review recommended' : 'No gaps detected'}
            badge={weakTopics?.length ? 'Action' : 'Good'}
            icon={<Brain size={17} className="text-purple-600 dark:text-purple-400" />}
          />
        </div>

        {/* PRIMARY HIERARCHY: Continue Learning Hero */}
        <section>
          <ContinueLearningCard plan={plan} todaySession={todaySession} />
        </section>

        {/* PRIMARY HIERARCHY: Today's Plan Checklist & Progress Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TodaysPlanSection plan={plan} />
          <LearningProgressSection progress={progress} />
        </section>

        {/* SECONDARY HIERARCHY: Active Courses Cards */}
        <section>
          <MyCoursesSection plan={plan} />
        </section>

        {/* ACTION CARDS (Watermelon UI Action Card Pattern) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/app/journey">
            <ActionCard
              title="Arrays Fundamentals"
              description="Progress through 5 stages of sequential traversal, comparisons, and boundary checkpoints."
              icon={<Compass size={20} />}
              actionText="Resume journey"
              badge="Curriculum"
              tone="accent"
            />
          </Link>
          <Link to="/app/comprehension">
            <ActionCard
              title="Code Comprehension"
              description="Inspect code snippets, predict output, evaluate boundary conditions, and verify answers."
              icon={<GraduationCap size={20} />}
              actionText="Open exercises"
              badge="Mastery"
              tone="success"
            />
          </Link>
          <Link to="/app/resume">
            <ActionCard
              title="Resume Optimizer"
              description="Build ATS-tailored tech resumes and polish bullet points with Gemini AI."
              icon={<FileText size={20} />}
              actionText="Open builder"
              badge="Career"
              tone="default"
            />
          </Link>
        </section>

        {/* SUPPORTING HIERARCHY: Personalized Recommendations & AI Insight */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecommendedSection weakTopics={weakTopics} />
          <AIInsightCard weakTopics={weakTopics} />
        </section>
      </div>
    </AppLayout>
  );
}
