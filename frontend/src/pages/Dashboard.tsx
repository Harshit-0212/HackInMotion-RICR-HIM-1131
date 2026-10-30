import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Brain, RefreshCw, FileText, Users } from 'lucide-react';
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

export function Dashboard() {
  const { user } = useAuth();
  const { plan, progress, weakTopics, isReady, autoAdjustPlan } = useAppData();

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  const todaySession = useMemo(
    () => plan?.sessions.find((s) => s.status === 'in-progress') ?? plan?.sessions.find((s) => s.status === 'upcoming'),
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
        <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
          {/* Welcome Header */}
          <div className="space-y-1">
            <h1 className="font-space text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Welcome to InteLearn, {firstName} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your intelligent digital workspace for college learning.
            </p>
          </div>

          {/* Onboarding Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-blue-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 shadow-sm"
          >
            <div className="grid gap-8 items-center md:grid-cols-12 relative z-10">
              <div className="md:col-span-7 space-y-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 px-3.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40">
                  <Sparkles size={13} /> Personal Learning Workspace
                </span>
                <h2 className="font-space text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                  Build your personalized study roadmap.
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
                  Set up your courses, exam target dates, and weak areas. InteLearn will tailor daily study plans, practice quizzes, and AI tutor assistance for you.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link to="/app/plan">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 text-sm font-bold shadow-sm transition-all"
                    >
                      Build Your Study Plan <ArrowRight size={16} />
                    </motion.button>
                  </Link>
                  <Link to="/app/tutor">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all"
                    >
                      <Brain size={16} className="text-indigo-600 dark:text-indigo-400" /> Ask AI Tutor
                    </motion.button>
                  </Link>
                  <Link to="/app/groups">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-6 text-sm font-bold text-emerald-700 dark:text-emerald-300 transition-all"
                    >
                      <Users size={16} className="text-emerald-600 dark:text-emerald-400" /> Study Groups
                    </motion.button>
                  </Link>
                  <Link to="/app/resume">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-950/30 px-6 text-sm font-bold text-purple-700 dark:text-purple-300 transition-all"
                    >
                      <FileText size={16} className="text-purple-600 dark:text-purple-400" /> Resume Maker
                    </motion.button>
                  </Link>
                </div>
              </div>

              {/* Decorative Onboarding Graphic */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative h-48 w-48 sm:h-56 sm:w-56 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl animate-pulse" />
                  <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                    <Brain size={36} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Preset Courses Preview for College Students */}
          <MyCoursesSection plan={plan} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-7">

        {/* Adaptive Re-planning notification banner if sessions were missed */}
        {hasMissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 shrink-0">
                <RefreshCw size={18} />
              </div>
              <div>
                <h4 className="font-space text-sm font-bold text-slate-900 dark:text-white">
                  Schedule adjustment recommended
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  You have a pending session from earlier. Click auto-adjust to rebalance your calendar.
                </p>
              </div>
            </div>
            <button
              onClick={autoAdjustPlan}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shrink-0"
            >
              Auto-Adjust Schedule
            </button>
          </motion.div>
        )}

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

        {/* RESUME & STUDY GROUPS CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-blue-950/20 p-5 flex flex-col justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20 shrink-0">
                <FileText size={22} />
              </div>
              <div>
                <h4 className="font-space text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Resume Maker & AI Optimizer <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Build ATS-ready resumes, polish achievements with Gemini AI, and export PDF.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/app/resume">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  Open Resume Maker <ArrowRight size={13} />
                </motion.button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 p-5 flex flex-col justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
                <Users size={22} />
              </div>
              <div>
                <h4 className="font-space text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Collaborative Study Groups <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Join real-time peer study groups, discuss topics with AI, and prepare together.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/app/groups">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  Explore Groups <ArrowRight size={13} />
                </motion.button>
              </Link>
            </div>
          </div>
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
