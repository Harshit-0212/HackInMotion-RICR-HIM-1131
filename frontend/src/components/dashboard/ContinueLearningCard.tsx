import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
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
    completionPercent: todaySession && todaySession.conceptsTotal > 0
      ? Math.round((todaySession.conceptsDone / todaySession.conceptsTotal) * 100)
      : plan?.completionPercent ?? 70,
  };

  return (
    <div className="border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-6 shadow-sm rounded-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold text-[#6542C5] dark:text-[#B59AF7] bg-[#F5F3FD] dark:bg-[#B59AF7]/10 border border-[#6542C5]/20 dark:border-[#B59AF7]/30 uppercase tracking-wider font-mono">
              <Sparkles size={12} />
              Current Module
            </span>
            <span className="text-xs text-[#8A8192]">
              {defaultCourse.subject}
            </span>
          </div>

          <div>
            <h2 className="font-space text-2xl font-bold text-[#211D28] dark:text-[#F5F0E8] tracking-tight">
              {defaultCourse.title}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#5F5668] dark:text-[#B8AFBE]">
              <BookOpen size={14} className="text-[#6542C5] dark:text-[#B59AF7] shrink-0" />
              <span>Current Focus: <strong className="text-[#211D28] dark:text-[#F5F0E8] font-semibold">{defaultCourse.topic}</strong></span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#5F5668] dark:text-[#B8AFBE]">
                Session Progress: <span className="font-semibold text-[#211D28] dark:text-[#F5F0E8]">{defaultCourse.done} of {defaultCourse.total} concepts completed</span>
              </span>
              <span className="font-mono font-bold text-[#6542C5] dark:text-[#B59AF7] text-sm">
                {defaultCourse.completionPercent}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#E8E1D7] dark:bg-[#28222F] overflow-hidden">
              <motion.div
                className="h-full bg-[#6542C5] dark:bg-[#B59AF7]"
                initial={{ width: 0 }}
                animate={{ width: `${defaultCourse.completionPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8A8192]">
              <span className="flex items-center gap-1">
                <Clock size={12} /> ~{defaultCourse.estimatedMinutes} min estimated
              </span>
              <span>Difficulty: <span className="capitalize font-medium text-[#211D28] dark:text-[#F5F0E8]">{defaultCourse.difficulty}</span></span>
            </div>
          </div>
        </div>

        {/* Action Button: Sharp rectangular with sweep */}
        <div className="shrink-0">
          <Link to="/app/journey">
            <button className="btn-render-sweep inline-flex h-11 items-center justify-center gap-2 bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] hover:text-white dark:hover:text-[#141217] px-6 text-xs font-bold border border-[#51329F] dark:border-[#B59AF7]/40 shadow-sm transition-all rounded-none">
              <span className="relative z-10 inline-flex items-center gap-2">
                Continue Studying <ArrowRight size={14} />
              </span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
