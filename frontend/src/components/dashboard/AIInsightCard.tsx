import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Lightbulb } from 'lucide-react';

interface AIInsightCardProps {
  weakTopics: string[];
}

export function AIInsightCard({ weakTopics }: AIInsightCardProps) {
  const weakTopicName = weakTopics[0] || 'Graph Traversal (BFS & DFS)';

  const insightMessage = weakTopics.length > 0
    ? `You've been performing well in fundamental sorting algorithms, but your recent mock test shows difficulty with ${weakTopicName}. Spending 20 minutes on BFS and DFS traversal patterns could significantly improve your mastery.`
    : `You've maintained steady progress in Data Structures! Your top area for growth today is Graph Traversal algorithms. A 20-minute focused practice session will help solidify your understanding.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="relative overflow-hidden rounded-3xl border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 dark:from-[#131B30] dark:via-[#111827] dark:to-[#0F172A] p-6 shadow-sm flex flex-col justify-between"
    >
      {/* Decorative subtle light highlight */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
              <Brain size={16} />
            </div>
            <span className="font-space text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              AI Tutor Intelligence
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/40">
            <Lightbulb size={11} /> Contextual Analysis
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          "{insightMessage}"
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between pt-2">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Tailored for your current study plan
        </span>

        <Link to="/app/tutor">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all"
          >
            <span>Practice {weakTopicName.split(' ')[0]}</span>
            <ArrowRight size={13} />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}
