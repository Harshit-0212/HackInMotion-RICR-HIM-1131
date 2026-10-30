import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import type { StudySession, StudyPlan } from '@/types';

interface ContinueLearningCardProps {
  plan: StudyPlan | null;
  todaySession: StudySession | undefined;
}

export function ContinueLearningCard({ plan, todaySession }: ContinueLearningCardProps) {
  const defaultCourse = {
    title: plan?.goalTitle || 'Data Structures & Algorithms',
    topic: todaySession?.topic || 'Graph Traversal (BFS & DFS)',
    subject: todaySession?.subject || 'Computer Science',
    estimatedMinutes: todaySession?.estimatedMinutes || 45,
    difficulty: todaySession?.difficulty || 'medium',
    done: todaySession?.conceptsDone ?? 7,
    total: todaySession?.conceptsTotal ?? 10,
    completionPercent: todaySession
      ? Math.round((todaySession.conceptsDone / todaySession.conceptsTotal) * 100)
      : plan?.completionPercent ?? 78,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-white via-blue-50/40 to-slate-50 dark:from-[#111827] dark:via-[#131C2E] dark:to-[#0F172A] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Decorative background accent shape */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-500/15 px-3 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 tracking-wide uppercase">
              <Sparkles size={13} className="text-blue-600 dark:text-blue-400" />
              Continue Learning
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Primary Active Module
            </span>
          </div>

          <div>
            <h2 className="font-space text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {defaultCourse.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <BookOpen size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Current topic: <strong className="text-slate-900 dark:text-white">{defaultCourse.topic}</strong></span>
            </div>
          </div>

          {/* Progress Indicator Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Course Progress
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-space text-sm">
                {defaultCourse.completionPercent}% Complete
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${defaultCourse.completionPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Clock size={12} /> {defaultCourse.estimatedMinutes} min estimated session
              </span>
              <span>{defaultCourse.done} of {defaultCourse.total} concepts completed</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex sm:flex-col justify-start lg:justify-end items-stretch gap-3 shrink-0">
          <Link to="/app/session">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-7 text-sm font-bold shadow-md shadow-blue-600/25 transition-all duration-200 w-full sm:w-auto"
            >
              <Play size={16} className="fill-current" />
              <span>Continue Lesson</span>
              <ArrowRight size={16} />
            </motion.button>
          </Link>
          <Link to="/app/plan">
            <button className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1">
              View full syllabus →
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
