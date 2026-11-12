import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, ArrowUpRight, CalendarDays, ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import type { StudyPlan, StudySession } from '@/types';

interface TodaysPlanSectionProps {
  plan: StudyPlan | null;
}

export function TodaysPlanSection({ plan }: TodaysPlanSectionProps) {
  const sessions: StudySession[] = plan?.sessions || [];

  const defaultTasks = [
    { id: '1', title: 'Complete Operating Systems lesson', status: 'completed', topic: 'Process Scheduling', time: '30 min' },
    { id: '2', title: 'Practice 10 DSA questions', status: 'in-progress', topic: 'Graph Traversal (BFS & DFS)', time: '45 min' },
    { id: '3', title: 'Review DBMS normalization', status: 'upcoming', topic: '3NF & BCNF Rules', time: '25 min' },
    { id: '4', title: 'Complete pending assignment', status: 'upcoming', topic: 'Network Protocols', time: '20 min' },
  ];

  const tasks = sessions.length > 0
    ? sessions.slice(0, 4).map((s) => ({
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
    <Reveal variant="fade-up" delay={0.1}>
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] dark:bg-[#1D1922] p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F3FD] dark:bg-[#B59AF7]/10 text-[#6542C5] dark:text-[#B59AF7]">
                <CalendarDays size={18} />
              </div>
              <div>
                <h3 className="font-space text-lg font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                  Today's Learning Plan
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {completedCount} of {tasks.length} tasks completed
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-[#6542C5] dark:text-[#B59AF7] font-space bg-[#F5F3FD] dark:bg-[#B59AF7]/10 px-2.5 py-1 rounded-lg">
              {progressPercent}% Done
            </span>
          </div>

          {/* Task checklist */}
          <div className="space-y-2.5">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in-progress';

              return (
                <motion.div
                  key={task.id}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={`group flex items-start justify-between gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                    isCompleted
                      ? 'border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/20'
                      : isInProgress
                      ? 'border-[#6542C5]/30 bg-[#F5F3FD]/60 dark:border-[#B59AF7]/30 dark:bg-[#B59AF7]/10'
                      : 'border-[var(--border)] bg-[var(--surface-muted)]/50 hover:border-[#6542C5]/20 dark:hover:border-[#B59AF7]/20'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                      ) : isInProgress ? (
                        <Circle className="size-5 text-[#6542C5] dark:text-[#B59AF7] animate-pulse fill-[#F5F3FD] dark:fill-[#B59AF7]/10" />
                      ) : (
                        <Circle className="size-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold ${
                          isCompleted
                            ? 'text-slate-500 dark:text-slate-400 line-through'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.topic && (
                        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
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
                      <span className="text-[10px] font-mono font-bold text-[#6542C5] dark:text-[#B59AF7] uppercase bg-[#F5F3FD] dark:bg-[#B59AF7]/10 px-2 py-0.5 rounded-lg border border-[#6542C5]/20 dark:border-[#B59AF7]/30">
                        In Progress
                      </span>
                    )}
                    <ChevronRight
                      size={14}
                      className="opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all text-[#6542C5] dark:text-[#B59AF7]"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">
            Target daily time: <strong className="text-[var(--text-primary)]">60 min</strong>
          </span>
          <Link
            to="/app/plan"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#6542C5] dark:text-[#B59AF7] hover:underline"
          >
            View Full Plan <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
