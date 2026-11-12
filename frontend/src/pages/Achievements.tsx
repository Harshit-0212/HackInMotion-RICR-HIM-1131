import { motion } from 'framer-motion';
import { Flame, Target, Brain, BookOpen, Zap, Trophy, Lock, Award } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppData } from '@/store/AppDataContext';

const ICONS: Record<string, typeof Flame> = {
  flame: Flame,
  target: Target,
  brain: Brain,
  book: BookOpen,
  zap: Zap,
  trophy: Trophy,
};

const XP_PER_LEVEL = 500;

export function Achievements() {
  const { progress, achievements } = useAppData();

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  // XP is a derived gamification score from real activity — not a stored/fabricated value.
  const xp = (progress?.topicsMastered ?? 0) * 100 + (progress?.streakDays ?? 0) * 20 + unlocked.length * 150;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpToNext = XP_PER_LEVEL - (xp % XP_PER_LEVEL);

  if (!progress) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader title="Achievements" subtitle="Celebrate your milestones and keep building consistency." />
          <EmptyState
            icon={Trophy}
            title="No achievements yet"
            description="Complete study sessions and mock tests to start unlocking achievements."
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader title="Achievements" subtitle="Celebrate your milestones and keep building consistency." />

        {/* Summary */}
        <div className="grid gap-5 sm:grid-cols-3">
          <Card padding="lg" className="flex items-center gap-4" hover>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-50 text-warning-600 dark:bg-warning-700/20">
              <Flame size={28} />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">
                <AnimatedNumber value={progress.streakDays} suffix=" days" />
              </p>
              <p className="text-sm text-ink-500">Current streak</p>
            </div>
          </Card>
          <Card padding="lg" className="flex items-center gap-4" hover>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-[#6542C5] dark:bg-primary-900/40">
              <Zap size={28} />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">
                <AnimatedNumber value={xp} suffix=" XP" />
              </p>
              <p className="text-sm text-ink-500">
                Level {level} · {xpToNext} to next
              </p>
            </div>
          </Card>
          <Card padding="lg" className="flex items-center gap-4" hover>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 dark:bg-accent-900/40">
              <Trophy size={28} />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">
                <AnimatedNumber value={unlocked.length} />/<AnimatedNumber value={achievements.length} />
              </p>
              <p className="text-sm text-ink-500">Achievements unlocked</p>
            </div>
          </Card>
        </div>

        {/* Unlocked */}
        {unlocked.length > 0 && (
          <>
            <h2 className="mb-4 mt-8 font-display text-lg font-bold text-ink-900 dark:text-ink-50">Unlocked</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unlocked.map((a, i) => {
                const Icon = ICONS[a.icon] ?? Award;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card padding="lg" hover className="border-accent-200 dark:border-accent-800">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-[#6542C5] text-white shadow-soft">
                          <Icon size={26} />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">
                            {a.title}
                          </h3>
                          <p className="text-sm text-ink-500 dark:text-ink-400">{a.description}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Badge tone="success">Unlocked</Badge>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Locked */}
        <h2 className="mb-4 mt-8 font-display text-lg font-bold text-ink-900 dark:text-ink-50">In Progress</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locked.map((a, i) => {
            const pct = a.progress && a.goal ? (a.progress / a.goal) * 100 : 0;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card padding="lg" hover className="opacity-80">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
                      <Lock size={24} />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">{a.title}</h3>
                      <p className="text-sm text-ink-500 dark:text-ink-400">{a.description}</p>
                    </div>
                  </div>
                  {a.progress !== undefined && a.goal !== undefined && (
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-ink-400">Progress</span>
                        <span className="font-semibold text-ink-700 dark:text-ink-200">
                          {a.progress}/{a.goal}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[#6542C5] to-accent-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
