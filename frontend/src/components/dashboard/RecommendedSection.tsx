import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Compass, ArrowRight, Zap, Target } from 'lucide-react';

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
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40',
    },
    {
      id: 'rec-3',
      title: 'Operating System CPU Scheduling',
      reason: 'Upcoming exam weightage high',
      type: 'Exam Prep',
      estimatedTime: '15 min quiz',
      icon: Compass,
      tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/40',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-space text-lg font-bold text-slate-900 dark:text-white">
                Recommended For You
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized topic suggestions based on your performance
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {recommendations.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.tagColor}`}>
                        {item.reason}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {item.type} • {item.estimatedTime}
                    </p>
                  </div>
                </div>

                <Link to="/app/assessments" className="shrink-0">
                  <button className="h-8 w-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                    <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
