import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Compass, ArrowRight, Zap, Target } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

interface RecommendedSectionProps {
  weakTopics: string[];
}

export function RecommendedSection({ weakTopics }: RecommendedSectionProps) {
  const recommendations = [
    {
      id: 'rec-1',
      title: weakTopics[0] || 'Graph Traversal (BFS & DFS)',
      reason: 'Recommended to strengthen your weak areas',
      type: 'Weak Topic Focus',
      estimatedTime: '20 min practice',
      icon: Target,
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40',
    },
    {
      id: 'rec-2',
      title: 'Dynamic Programming Patterns',
      reason: 'Based on your recent study activity',
      type: 'Next Logical Topic',
      estimatedTime: '30 min concept',
      icon: Zap,
      tagColor: 'bg-[#F5F3FD] text-[#6542C5] border-[#6542C5]/20 dark:bg-[#B59AF7]/10 dark:text-[#B59AF7] dark:border-[#B59AF7]/30',
    },
    {
      id: 'rec-3',
      title: 'Operating System CPU Scheduling',
      reason: 'Upcoming exam weightage high',
      type: 'Exam Prep',
      estimatedTime: '15 min quiz',
      icon: Compass,
      tagColor: 'bg-[#F5F3FD] text-[#6542C5] border-[#6542C5]/20 dark:bg-[#B59AF7]/10 dark:text-[#B59AF7] dark:border-[#B59AF7]/30',
    },
  ];

  return (
    <Reveal variant="fade-up" delay={0.2}>
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] dark:bg-[#1D1922] p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5F3FD] dark:bg-[#B59AF7]/10 text-[#6542C5] dark:text-[#B59AF7]">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-space text-lg font-bold text-[var(--text-primary)]">
                  Recommended For You
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Personalized topic suggestions based on your performance
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {recommendations.map((item) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 dark:bg-[#28222F]/40 hover:border-[#6542C5]/30 dark:hover:border-[#B59AF7]/30 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] dark:bg-[#1D1922] border border-[var(--border)] text-[var(--text-secondary)] group-hover:text-[#6542C5] dark:group-hover:text-[#B59AF7] transition-colors">
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {item.title}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.tagColor}`}>
                          {item.reason}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
                        {item.type} · {item.estimatedTime}
                      </p>
                    </div>
                  </div>

                  <Link to="/app/assessments" className="shrink-0">
                    <button className="h-8 w-8 rounded-xl bg-[var(--surface)] dark:bg-[#1D1922] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[#6542C5] group-hover:text-white dark:group-hover:bg-[#B59AF7] dark:group-hover:text-[#141217] group-hover:scale-110 transition-all">
                      <ArrowRight size={14} />
                    </button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
