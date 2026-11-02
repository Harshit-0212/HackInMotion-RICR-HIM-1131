/**
 * CodeComprehensionList.tsx
 *
 * Dedicated discoverable route and view for all Code Comprehension activities.
 * Lists approved exercises (Predict Output, Find the Bug, Explain Code, Trace, etc.)
 * across the curriculum, showing:
 * - Exercise title
 * - Parent Stage / Pattern
 * - Language badge
 * - Exercise type badge
 * - Lock/Prerequisite status
 * - Completion status
 * - Start / Continue / Review action
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
  Filter,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MetricCard } from '@/components/ui/MetricCard';
import { journeyService } from '@/services/journeyService';
import type { Stage, Activity, StudentJourneyProgress } from '@/types/journey';

interface ComprehensionItem {
  activity: Activity;
  stage: Stage;
  isLocked: boolean;
  isCompleted: boolean;
}

export function CodeComprehensionList() {
  const [items, setItems] = useState<ComprehensionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'completed'>('all');
  const navigate = useNavigate();

  const JOURNEY_SLUG = 'arrays-fundamentals';

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const journeys = await journeyService.listJourneys();
        if (!journeys || journeys.length === 0) {
          setItems([]);
          return;
        }
        const activeJourney = journeys.find((j) => j.slug === JOURNEY_SLUG) || journeys[0];

        const [stages, progress] = await Promise.all([
          journeyService.listStages(activeJourney.slug),
          journeyService.getProgress(activeJourney.slug),
        ]);

        const completedSet = new Set(progress.completedActivities.map((a) => a.activityId));
        const collected: ComprehensionItem[] = [];

        for (const stage of stages) {
          const acts = await journeyService.listActivities(stage.slug);
          const compActs = acts.filter((a) => a.type.startsWith('comprehension'));
          const stageState = progress.stageStates[stage.id] ?? 'locked';
          const isLocked = stageState === 'locked';

          for (const ca of compActs) {
            collected.push({
              activity: ca,
              stage,
              isLocked,
              isCompleted: completedSet.has(ca.id),
            });
          }
        }

        setItems(collected);
      } catch (err: unknown) {
        console.error('Failed to load code comprehension list:', err);
        setError('Could not connect to the curriculum service. Please check your network.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function formatExerciseType(type: string): string {
    switch (type) {
      case 'comprehension_trace':
        return 'State Trace';
      case 'comprehension_bug':
        return 'Find the Bug';
      case 'comprehension_output':
        return 'Predict Output';
      case 'comprehension_explain':
        return 'Explain Intent';
      default:
        return 'Comprehension';
    }
  }

  const completedCount = items.filter((i) => i.isCompleted).length;
  const unlockedCount = items.filter((i) => !i.isLocked).length;

  const filteredItems = items.filter((item) => {
    if (filter === 'completed') return item.isCompleted;
    if (filter === 'unlocked') return !item.isLocked;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Contextual Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <GraduationCap size={15} /> Mastery Assessment
            </div>
            <h1 className="mt-1 font-space text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Code Comprehension Hub
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Practice reading, mentally executing, and tracing code snippets before writing solutions.
            </p>
          </div>
          <Link to="/app/journey">
            <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
              <BookOpen size={14} /> Full Roadmap
            </button>
          </Link>
        </div>

        {/* Quick Stat Metric Cards (Watermelon UI Pattern) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Total Exercises"
            value={items.length}
            subtitle="Curriculum drills"
            icon={<GraduationCap size={18} className="text-emerald-600 dark:text-emerald-400" />}
          />
          <MetricCard
            label="Completed"
            value={completedCount}
            subtitle={items.length ? `${Math.round((completedCount / items.length) * 100)}% verified` : '0%'}
            badge={completedCount > 0 ? 'Progress' : undefined}
            icon={<CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400" />}
          />
          <MetricCard
            label="Available Now"
            value={unlockedCount}
            subtitle="Unlocked stages"
            icon={<Code size={18} className="text-purple-600 dark:text-purple-400" />}
          />
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === 'unlocked'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Available ({unlockedCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === 'completed'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-[#111827] animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200/80 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20 p-5 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center space-y-2">
            <GraduationCap size={32} className="mx-auto text-slate-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">No exercises match filter</h3>
            <p className="text-xs text-slate-500">
              Try switching back to 'All' to see all available comprehension drills.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, idx) => {
              const lang = item.activity.comprehensionContent?.language?.toUpperCase() || 'PYTHON';
              return (
                <motion.div
                  key={item.activity.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.18 }}
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-150 ${
                    item.isLocked
                      ? 'border-slate-200/70 bg-slate-50/60 dark:border-slate-800/60 dark:bg-slate-900/40 opacity-70'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800/90 dark:bg-[#111827] dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${
                        item.isCompleted
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : item.isLocked
                          ? 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                          : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}
                    >
                      {item.isCompleted ? (
                        <CheckCircle2 size={18} />
                      ) : item.isLocked ? (
                        <Lock size={18} />
                      ) : (
                        <GraduationCap size={18} />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                          {lang}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                          {formatExerciseType(item.activity.type)}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          • {item.stage.title}
                        </span>
                      </div>
                      <h3 className="font-space font-bold text-sm text-slate-900 dark:text-white truncate">
                        {item.activity.title}
                      </h3>
                      {item.isLocked && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Locked: Complete {item.stage.title} prerequisites to unlock.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-end">
                    {item.isLocked ? (
                      <button
                        disabled
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold text-slate-400 cursor-not-allowed"
                      >
                        <Lock size={13} /> Locked
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          navigate(
                            `/app/journey/${JOURNEY_SLUG}/stage/${item.stage.slug}?activity=${item.activity.id}`
                          )
                        }
                        className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold transition-colors ${
                          item.isCompleted
                            ? 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        }`}
                      >
                        {item.isCompleted ? 'Review Drill' : 'Start Drill'}
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
