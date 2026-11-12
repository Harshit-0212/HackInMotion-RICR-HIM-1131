import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Brain,
  FileText,
  Compass,
  Code,
  GraduationCap,
  Target,
  BookOpen,
  Flame,
  Shield,
  Award,
  Zap,
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
import { gamificationService, type UserGamificationData } from '@/services/gamificationService';

export function Dashboard() {
  const { user } = useAuth();
  const { plan, progress, weakTopics, isReady, autoAdjustPlan } = useAppData();
  const [gamification, setGamification] = useState<UserGamificationData | null>(null);

  useEffect(() => {
    gamificationService.getProfile().then(setGamification).catch(() => {});
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Learner';

  const todaySession = useMemo(
    () =>
      plan?.sessions.find((s) => s.status === 'in-progress') ??
      plan?.sessions.find((s) => s.status === 'upcoming'),
    [plan],
  );

  const hasMissed = plan?.sessions.some((s) => s.status === 'missed') ?? false;

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8D0C5] dark:border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#6542C5] dark:text-[#B59AF7]">
                <Sparkles size={14} /> Cadence Workspace
              </div>
              <h1 className="mt-1 font-space text-2xl sm:text-3xl font-bold tracking-tight text-[#211D28] dark:text-[#F5F0E8]">
                Welcome, {firstName}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#5F5668] dark:text-[#B8AFBE]">
                Master core computer science algorithms and code comprehension with rigorous verification.
              </p>
            </div>
            <Link to="/app/journey">
              <button className="btn-render-sweep inline-flex h-9 items-center gap-1.5 bg-[#6542C5] dark:bg-[#B59AF7] px-4 text-xs font-bold text-white dark:text-[#141217] shadow-sm rounded-none">
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Compass size={14} /> Open Journey
                </span>
              </button>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard
              label="Curriculum"
              value="5 Stages"
              subtitle="Arrays Fundamentals ready"
              icon={<Compass size={16} />}
            />
            <MetricCard
              label="Comprehension"
              value="Interactive"
              subtitle="Code trace exercises"
              icon={<GraduationCap size={16} />}
            />
            <MetricCard
              label="Coding Practice"
              value="Active"
              subtitle="Server-judged tests"
              icon={<Code size={16} />}
            />
            <MetricCard
              label="AI Study Tutor"
              value="Ready"
              subtitle="Personal Gemini mentor"
              icon={<Brain size={16} />}
            />
          </div>

          {/* Onboarding Call to Action */}
          <div className="border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-6 sm:p-8 rounded-none shadow-xs">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F5F3FD] dark:bg-[#B59AF7]/10 text-[#6542C5] dark:text-[#B59AF7] border border-[#6542C5]/20 dark:border-[#B59AF7]/30">
                Getting Started
              </span>
              <h2 className="font-space text-2xl font-bold tracking-tight text-[#211D28] dark:text-[#F5F0E8]">
                Select your focus area for today
              </h2>
              <p className="text-xs sm:text-sm text-[#5F5668] dark:text-[#B8AFBE] leading-relaxed">
                Step through the interactive learning journey, test your code tracing abilities with comprehension exercises, or configure a structured syllabus.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-2">
                <Link to="/app/journey">
                  <button className="btn-render-sweep inline-flex h-9 items-center justify-center gap-2 bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] px-4 text-xs font-bold shadow-sm rounded-none">
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      Start Journey <ArrowRight size={13} />
                    </span>
                  </button>
                </Link>
                <Link to="/app/comprehension">
                  <button className="btn-render-sweep-dark inline-flex h-9 items-center justify-center gap-2 border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7] dark:bg-[#28222F] px-4 text-xs font-semibold text-[#211D28] dark:text-[#F5F0E8] rounded-none">
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-[#6542C5] dark:text-[#B59AF7]" />
                      Code Comprehension
                    </span>
                  </button>
                </Link>
                <Link to="/app/coding">
                  <button className="btn-render-sweep-dark inline-flex h-9 items-center justify-center gap-2 border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7] dark:bg-[#28222F] px-4 text-xs font-semibold text-[#211D28] dark:text-[#F5F0E8] rounded-none">
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      <Code size={14} className="text-[#6542C5] dark:text-[#B59AF7]" />
                      Practice Bank
                    </span>
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <MyCoursesSection plan={plan} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8D0C5] dark:border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#8A8192]">
              Workspace Overview
            </div>
            <h1 className="mt-1 font-space text-2xl sm:text-3xl font-bold tracking-tight text-[#211D28] dark:text-[#F5F0E8]">
              Dashboard
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-[#5F5668] dark:text-[#B8AFBE]">
              Track curriculum stages, practice algorithmic problems, and build steady study momentum.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app/journey">
              <button className="btn-render-sweep inline-flex h-8 items-center gap-1.5 bg-[#6542C5] dark:bg-[#B59AF7] px-3.5 text-xs font-bold text-white dark:text-[#141217] shadow-sm rounded-none">
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Compass size={13} /> Learning Journey
                </span>
              </button>
            </Link>
            <Link to="/app/comprehension">
              <button className="btn-render-sweep-dark inline-flex h-8 items-center gap-1.5 border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7] dark:bg-[#28222F] px-3.5 text-xs font-semibold text-[#211D28] dark:text-[#F5F0E8] rounded-none">
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-[#6542C5] dark:text-[#B59AF7]" /> Comprehension
                </span>
              </button>
            </Link>
          </div>
        </div>

        {/* Schedule adjustment alert */}
        {hasMissed && (
          <div className="border border-[#F2B38C] bg-[#FDF6F0] dark:border-[#F2B38C]/30 dark:bg-[#F2B38C]/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-none">
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-[#D7713A] dark:text-[#F2B38C] shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-[#211D28] dark:text-[#F5F0E8]">
                  Schedule adjustment recommended
                </h4>
                <p className="text-xs text-[#5F5668] dark:text-[#B8AFBE] mt-0.5">
                  You have a pending session from earlier. Auto-adjust will rebalance your study targets.
                </p>
              </div>
            </div>
            <button
              onClick={autoAdjustPlan}
              className="px-3 py-1.5 bg-[#D7713A] hover:bg-[#B85322] text-white text-xs font-bold shrink-0 rounded-none transition-colors"
            >
              Auto-Adjust Schedule
            </button>
          </div>
        )}

        {/* Real Gamification Streak & Stats Bar */}
        {gamification && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-3 rounded-none flex items-center gap-3">
              <div className="p-2 bg-[#FDF6F0] dark:bg-[#F2B38C]/10 text-[#D7713A] dark:text-[#F2B38C]">
                <Flame size={18} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-[#8A8192]">Day Streak</div>
                <div className="font-space font-bold text-lg text-[#211D28] dark:text-[#F5F0E8]">
                  {gamification.currentStreak} {gamification.currentStreak === 1 ? 'day' : 'days'}
                </div>
              </div>
            </div>

            <div className="border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-3 rounded-none flex items-center gap-3">
              <div className="p-2 bg-[#F5F3FD] dark:bg-[#B59AF7]/10 text-[#6542C5] dark:text-[#B59AF7]">
                <Shield size={18} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-[#8A8192]">Freezes</div>
                <div className="font-space font-bold text-lg text-[#211D28] dark:text-[#F5F0E8]">
                  {gamification.streakFreezesAvailable} available
                </div>
              </div>
            </div>

            <div className="border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-3 rounded-none flex items-center gap-3">
              <div className="p-2 bg-[#F2FAF5] dark:bg-[#48BB78]/10 text-[#2F855A] dark:text-[#48BB78]">
                <Award size={18} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-[#8A8192]">Level {gamification.level}</div>
                <div className="font-space font-bold text-lg text-[#211D28] dark:text-[#F5F0E8]">
                  {gamification.totalXp} XP
                </div>
              </div>
            </div>

            <div className="border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-3 rounded-none flex items-center gap-3">
              <div className="p-2 bg-[#E8E1D7] dark:bg-[#28222F] text-[#5F5668] dark:text-[#B8AFBE]">
                <Target size={18} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-[#8A8192]">Weekly Quests</div>
                <div className="font-space font-bold text-lg text-[#211D28] dark:text-[#F5F0E8]">
                  {(gamification.weeklyQuests || []).filter((q) => !q.completed).length} in progress
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actionable Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            label="Daily Goal"
            value={todaySession ? `${todaySession.estimatedMinutes}m` : 'Completed'}
            subtitle={todaySession ? todaySession.topic : 'All tasks up to date'}
            badge={todaySession ? 'Active' : 'Done'}
            icon={<Target size={16} />}
          />
          <MetricCard
            label="Plan Completion"
            value={`${plan?.completionPercent ?? 0}%`}
            subtitle="Overall syllabus coverage"
            trend={{ value: '+12% this week', isPositive: true }}
            icon={<BookOpen size={16} />}
          />
          <MetricCard
            label="Comprehension"
            value="Stage 1 & 2"
            subtitle="Arrays code trace ready"
            icon={<GraduationCap size={16} />}
          />
          <MetricCard
            label="Weak Spots"
            value={weakTopics?.length || 0}
            subtitle={weakTopics?.length ? 'Targeted review recommended' : 'No gaps detected'}
            badge={weakTopics?.length ? 'Review' : 'Clear'}
            icon={<Brain size={16} />}
          />
        </div>

        {/* PRIMARY: Continue Learning Module */}
        <section>
          <ContinueLearningCard plan={plan} todaySession={todaySession} />
        </section>

        {/* Plan Checklist & Progress */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <TodaysPlanSection plan={plan} />
          <LearningProgressSection progress={progress} />
        </section>

        {/* Active Courses */}
        <section>
          <MyCoursesSection plan={plan} />
        </section>

        {/* Quick Action Tiles */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <Link to="/app/journey">
            <ActionCard
              title="Arrays Fundamentals"
              description="Progress through 5 stages of sequential traversal, comparisons, and boundary checkpoints."
              icon={<Compass size={18} />}
              actionText="Resume journey"
              badge="Curriculum"
              tone="accent"
            />
          </Link>
          <Link to="/app/comprehension">
            <ActionCard
              title="Code Comprehension"
              description="Inspect code snippets, predict output, evaluate boundary conditions, and verify answers."
              icon={<GraduationCap size={18} />}
              actionText="Open exercises"
              badge="Mastery"
              tone="success"
            />
          </Link>
          <Link to="/app/resume">
            <ActionCard
              title="Resume Optimizer"
              description="Build ATS-tailored tech resumes and polish bullet points with Gemini AI."
              icon={<FileText size={18} />}
              actionText="Open builder"
              badge="Career"
              tone="default"
            />
          </Link>
        </section>

        {/* Personalized Recommendations & AI Insight */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <RecommendedSection weakTopics={weakTopics} />
          <AIInsightCard weakTopics={weakTopics} />
        </section>
      </div>
    </AppLayout>
  );
}
