import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Lightbulb } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

interface AIInsightCardProps {
  weakTopics: string[];
}

export function AIInsightCard({ weakTopics }: AIInsightCardProps) {
  const weakTopicName = weakTopics[0] || 'Graph Traversal (BFS & DFS)';

  const insightMessage = weakTopics.length > 0
    ? `You've been performing well in fundamental sorting algorithms, but your recent mock test shows difficulty with ${weakTopicName}. Spending 20 minutes on BFS and DFS traversal patterns could significantly improve your mastery.`
    : `You've maintained steady progress in Data Structures! Your top area for growth today is Graph Traversal algorithms. A 20-minute focused practice session will help solidify your understanding.`;

  return (
    <Reveal variant="scale-in" delay={0.1}>
      <div className="relative overflow-hidden rounded-3xl border border-[#6542C5]/20 dark:border-[#B59AF7]/20 bg-gradient-to-br from-[#F5F3FD]/80 via-[var(--surface)] to-[#F2B38C]/10 dark:from-[#1D1922] dark:via-[#1D1922] dark:to-[#B59AF7]/5 p-6 shadow-sm flex flex-col justify-between">
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#6542C5]/10 dark:bg-[#B59AF7]/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[#F2B38C]/15 blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between border-b border-[#6542C5]/10 dark:border-[#B59AF7]/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] shadow-sm shadow-[#6542C5]/30">
                <Brain size={16} />
              </div>
              <span className="font-space text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                AI Tutor Intelligence
              </span>
            </div>

            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6542C5] dark:text-[#B59AF7] bg-[#F5F3FD] dark:bg-[#B59AF7]/10 px-2.5 py-0.5 rounded-full border border-[#6542C5]/20 dark:border-[#B59AF7]/30">
              <Lightbulb size={11} /> Contextual Analysis
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
            "{insightMessage}"
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between pt-2">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">
            Tailored for your current study plan
          </span>

          <Link to="/app/tutor">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6542C5] hover:bg-[#5535B0] dark:bg-[#B59AF7] dark:hover:bg-[#C8B2FF] text-white dark:text-[#141217] text-xs font-bold shadow-sm shadow-[#6542C5]/20 transition-all"
            >
              <span>Practice {weakTopicName.split(' ')[0]}</span>
              <ArrowRight size={13} />
            </motion.button>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
