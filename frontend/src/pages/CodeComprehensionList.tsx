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
  Brain,
  Code,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load exercises.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatExerciseType = (type: string) => {
    switch (type) {
      case 'comprehension_predict':
        return 'Predict Output';
      case 'comprehension_find_bug':
        return 'Find the Bug';
      case 'comprehension_explain':
        return 'Explain Code';
      case 'comprehension_trace':
        return 'Trace Execution';
      case 'comprehension_fix_bug':
        return 'Fix the Bug';
      case 'comprehension_edge_case':
        return 'Edge Case Reasoning';
      default:
        return 'Code Comprehension';
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ink-100 dark:border-ink-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                <Brain size={18} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Active Code Reasoning
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">
              Code Comprehension
            </h1>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Practice reading, mentally executing, and debugging real language-specific code blocks.
            </p>
          </div>

          <Link to="/app/journey">
            <Button variant="outline" size="sm">
              <BookOpen size={15} /> Learning Roadmap
            </Button>
          </Link>
        </div>

        {/* List of exercises */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-ink-100 dark:bg-ink-800 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-error-200 bg-error-50 p-6 text-center text-sm text-error-700">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-ink-200 bg-white dark:bg-ink-900 p-8 text-center space-y-2">
            <Brain size={32} className="mx-auto text-ink-400" />
            <h3 className="font-bold text-ink-900 dark:text-ink-50">No published comprehension drills</h3>
            <p className="text-xs text-ink-500">
              Curriculum exercises will appear here once approved by your instructor.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const lang = item.activity.comprehensionContent?.language?.toUpperCase() || 'CODE';
              return (
                <motion.div
                  key={item.activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-200 ${
                    item.isLocked
                      ? 'border-ink-200 bg-ink-50/70 dark:border-ink-800 dark:bg-ink-900/40 opacity-70'
                      : 'border-ink-200 bg-white hover:border-primary-300 hover:shadow-card dark:border-ink-800 dark:bg-ink-900'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        item.isCompleted
                          ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                          : item.isLocked
                          ? 'bg-ink-200 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                          : 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                      }`}
                    >
                      {item.isCompleted ? (
                        <CheckCircle2 size={18} />
                      ) : item.isLocked ? (
                        <Lock size={18} />
                      ) : (
                        <Brain size={18} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge tone="accent" className="text-[10px] py-0 font-mono">
                          {lang}
                        </Badge>
                        <Badge tone="primary" className="text-[10px] py-0">
                          {formatExerciseType(item.activity.type)}
                        </Badge>
                        <span className="text-xs text-ink-400 truncate">
                          • {item.stage.title}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-ink-900 dark:text-ink-50 truncate">
                        {item.activity.title}
                      </h3>
                      {item.isLocked && (
                        <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                          Locked: Complete {item.stage.title} prerequisites first.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-end">
                    {item.isLocked ? (
                      <Button disabled size="sm" variant="outline">
                        <Lock size={14} /> Locked
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={item.isCompleted ? 'outline' : 'primary'}
                        onClick={() =>
                          navigate(
                            `/app/journey/${JOURNEY_SLUG}/stage/${item.stage.slug}?activity=${item.activity.id}`
                          )
                        }
                      >
                        {item.isCompleted ? 'Review Drill' : 'Start Drill'}
                        <ArrowRight size={14} />
                      </Button>
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

