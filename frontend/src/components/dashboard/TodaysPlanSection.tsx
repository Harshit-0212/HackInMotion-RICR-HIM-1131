import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, ArrowUpRight, CalendarDays } from 'lucide-react';
import type { StudyPlan, StudySession } from '@/types';

interface TodaysPlanSectionProps {
  plan: StudyPlan | null;
}

export function TodaysPlanSection({ plan }: TodaysPlanSectionProps) {
  // Extract or build clear today items
  const sessions: StudySession[] = plan?.sessions || [];
  
  // Default checklist for college student if sessions list is empty
  const defaultTasks = [
    { id: '1', title: 'Complete Operating Systems lesson', status: 'completed', topic: 'Process Scheduling', time: '30 min' },
    { id: '2', title: 'Practice 10 DSA questions', status: 'in-progress', topic: 'Graph Traversal (BFS & DFS)', time: '45 min' },
    { id: '3', title: 'Review DBMS normalization', status: 'upcoming', topic: '3NF & BCNF Rules', time: '25 min' },
    { id: '4', title: 'Complete pending assignment', status: 'upcoming', topic: 'Network Protocols', time: '20 min' },
  ];

  const tasks = sessions.length > 0
    ? sessions.slice(0, 4).map((s, idx) => ({
        id: s.id,
        title: `${s.subject ? s.subject + ': ' : ''}${s.topic}`,
        status: s.status === 'completed' ? 'completed' : s.status === 'in-progress' ? 'in-progress' : 'upcoming',
        topic: s.objective,
        time: `${s.estimatedMinutes} min`,
      }))
    : defaultTasks;

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <CalendarDays size={18} />
            </div>
            <div>
              <h3 className="font-space text-lg font-bold text-slate-900 dark:text-white">
                Today's Learning Plan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {completedCount} of {tasks.length} tasks completed
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-space bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg">
            {progressPercent}% Done
          </span>
        </div>

        {/* Task checklist */}
        <div className="space-y-3">
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in-progress';

            return (
              <div
                key={task.id}
                className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/20'
                    : isInProgress
                    ? 'border-[#6542C5]/30 bg-[#F5F3FD]/60 dark:border-[#B59AF7]/30 dark:bg-[#B59AF7]/10'
                    : 'border-slate-100 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-800/20'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                    ) : isInProgress ? (
                      <Circle className="size-5 text-[#6542C5] dark:text-[#B59AF7] dark:text-[#B59AF7] animate-pulse fill-blue-100 dark:fill-blue-900/40" />
                    ) : (
                      <Circle className="size-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold ${
                        isCompleted
                          ? 'text-slate-500 dark:text-slate-400 line-through'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.topic && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {task.topic}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    <Clock size={11} /> {task.time}
                  </span>
                  {isInProgress && (
                    <span className="text-[10px] font-mono font-bold text-[#6542C5] dark:text-[#B59AF7] uppercase bg-[#F5F3FD] dark:bg-[#B59AF7]/20 px-2 py-0.5 rounded-none border border-[#6542C5]/20 dark:border-[#B59AF7]/30">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Target daily time: <strong>60 min</strong>
        </span>
        <Link
          to="/app/plan"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#6542C5] dark:text-[#B59AF7] dark:text-[#B59AF7] hover:underline"
        >
          View Full Plan <ArrowUpRight size={13} />
        </Link>
      </div>
    </motion.div>
  );
}
