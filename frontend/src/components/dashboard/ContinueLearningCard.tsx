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
    done: todaySession?.conceptsDone ?? (plan?.completionPercent ? Math.round((plan.completionPercent / 100) * 10) : 0),
    total: todaySession?.conceptsTotal ?? 10,
    completionPercent: todaySession && todaySession.conceptsTotal > 0
      ? Math.round((todaySession.conceptsDone / todaySession.conceptsTotal) * 100)
      : plan?.completionPercent ?? 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-[#6542C5]/20 bg-gradient-to-br from-[#FBF8F2] via-[#F5F3FD]/40 to-[#F1EDE6] dark:from-[#1D1922] dark:via-[#28222F]/60 dark:to-[#141217] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Decorative background accent shape */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-[#6542C5]/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6542C5]/10 dark:bg-[#B59AF7]/15 px-3 py-1 text-[11px] font-bold text-[#6542C5] dark:text-[#B59AF7] tracking-wide uppercase font-mono">
              <Sparkles size={13} className="text-[#6542C5] dark:text-[#B59AF7]" />
              Continue Learning
            </span>
            <span className="text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE]">
              Primary Active Module
            </span>
          </div>

          <div>
            <h2 className="font-space text-2xl sm:text-3xl font-bold text-[#211D28] dark:text-[#F5F0E8] tracking-tight leading-tight">
              {defaultCourse.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-[#5F5668] dark:text-[#B8AFBE]">
              <BookOpen size={16} className="text-[#6542C5] dark:text-[#B59AF7] shrink-0" />
              <span>Current topic: <strong className="text-[#211D28] dark:text-[#F5F0E8]">{defaultCourse.topic}</strong></span>
            </div>
          </div>

          {/* Progress Indicator Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#5F5668] dark:text-[#B8AFBE]">
                Course Progress
              </span>
              <span className="font-bold text-[#6542C5] dark:text-[#B59AF7] font-space text-sm">
                {defaultCourse.completionPercent}% Complete
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#E8E1D7] dark:bg-[#28222F] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#6542C5] dark:bg-[#B59AF7]"
                initial={{ width: 0 }}
                animate={{ width: `${defaultCourse.completionPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8A8192] font-medium">
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
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-2xl bg-[#6542C5] hover:bg-[#51329F] dark:bg-[#B59AF7] dark:hover:bg-[#C6AFFB] text-white dark:text-[#141217] px-7 text-sm font-bold shadow-md shadow-[#6542C5]/20 transition-all duration-200 w-full sm:w-auto"
            >
              <Play size={16} className="fill-current" />
              <span>Continue Lesson</span>
              <ArrowRight size={16} />
            </motion.button>
          </Link>
          <Link to="/app/plan">
            <button className="text-center text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE] hover:text-[#6542C5] dark:hover:text-[#B59AF7] transition-colors py-1">
              View full syllabus →
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
