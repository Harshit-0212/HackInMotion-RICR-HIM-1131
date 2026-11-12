/**
 * StageDetail.tsx — The per-stage learning workspace.
 *
 * Shows the list of activities in a stage, allows the student to:
 * - Read lessons
 * - Complete comprehension exercises
 * - Open coding practice problems
 * - Start/continue the checkpoint when eligible
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Lock,
  BookOpen,
  Code,
  Brain,
  Target,
  Loader2,
  AlertCircle,
  RefreshCw,
  PlayCircle,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { journeyService } from '@/services/journeyService';
import type {
  Stage,
  Activity,
  ActivityType,
  StudentJourneyProgress,
  StageProgressState,
} from '@/types/journey';

// ─── Activity type metadata ───────────────────────────────────────────────────

const ACTIVITY_META: Record<
  ActivityType,
  { label: string; icon: React.ElementType; color: string }
> = {
  lesson: { label: 'Lesson', icon: BookOpen, color: 'text-[#6542C5] dark:text-[#B59AF7]' },
  comprehension_predict: { label: 'Predict Output', icon: Brain, color: 'text-violet-600 dark:text-violet-400' },
  comprehension_trace: { label: 'Trace Execution', icon: Brain, color: 'text-violet-600 dark:text-violet-400' },
  comprehension_explain: { label: 'Explain Code', icon: Brain, color: 'text-violet-600 dark:text-violet-400' },
  comprehension_find_bug: { label: 'Find the Bug', icon: Brain, color: 'text-error-600 dark:text-error-400' },
  comprehension_fix_bug: { label: 'Fix the Bug', icon: Code, color: 'text-error-600 dark:text-error-400' },
  comprehension_edge_case: { label: 'Edge Case', icon: Brain, color: 'text-warning-600 dark:text-warning-400' },
  coding_practice: { label: 'Coding Practice', icon: Code, color: 'text-success-600 dark:text-success-400' },
};

// ─── Activity row ─────────────────────────────────────────────────────────────

function ActivityRow({
  activity,
  completed,
  index,
  onOpen,
}: {
  activity: Activity;
  completed: boolean;
  index: number;
  onOpen: () => void;
}) {
  const meta = ACTIVITY_META[activity.type] ?? ACTIVITY_META.lesson;
  const Icon = meta.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      onClick={onOpen}
      className="w-full text-left group flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-4 transition-all duration-200 hover:shadow-card hover:border-primary-200 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {/* Completion indicator */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
          completed
            ? 'bg-success-100 dark:bg-success-700/20'
            : 'bg-ink-100 dark:bg-ink-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20'
        }`}
      >
        {completed ? (
          <Check size={16} className="text-success-600 dark:text-success-400" />
        ) : (
          <Icon size={16} className={meta.color} />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink-900 dark:text-ink-50 truncate">{activity.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-ink-500 dark:text-ink-400">{meta.label}</span>
          {!activity.isRequired && (
            <Badge tone="neutral" className="text-[10px] py-0">
              Optional
            </Badge>
          )}
        </div>
      </div>

      <ChevronRight
        size={16}
        className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5"
      />
    </motion.button>
  );
}

// ─── Lesson viewer ────────────────────────────────────────────────────────────

function LessonViewer({
  activity,
  onComplete,
}: {
  activity: Activity;
  onComplete: () => void;
}) {
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    setSaving(true);
    try {
      await journeyService.completeActivity(activity.id);
      setDone(true);
      onComplete();
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {activity.lessonContent ? (
        <div
          className="prose dark:prose-invert max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: activity.lessonContent.body }}
        />
      ) : (
        <p className="text-ink-500">No lesson content available.</p>
      )}

      {/* Hints */}
      {activity.lessonContent?.hints && activity.lessonContent.hints.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-ink-700 dark:text-ink-300 uppercase tracking-wider">
            Hints
          </p>
          {activity.lessonContent.hints.map((h) => (
            <details
              key={h.step}
              className="rounded-xl border border-ink-200 dark:border-ink-700 overflow-hidden"
            >
              <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-ink-800 dark:text-ink-200 list-none flex items-center justify-between">
                <span>Hint {h.step}: {h.title}</span>
                <ChevronRight size={14} className="text-ink-400" />
              </summary>
              <div className="px-4 py-3 text-sm text-ink-600 dark:text-ink-400 border-t border-ink-100 dark:border-ink-800 bg-ink-50 dark:bg-ink-800/50">
                {h.content}
              </div>
            </details>
          ))}
        </div>
      )}

      {!done ? (
        <Button onClick={handleComplete} loading={saving}>
          <Check size={16} />
          Mark as Read
        </Button>
      ) : (
        <div className="flex items-center gap-2 text-success-600 dark:text-success-400 text-sm font-semibold">
          <Check size={16} />
          Lesson completed
        </div>
      )}
    </div>
  );
}

// ─── Comprehension viewer ─────────────────────────────────────────────────────

function ComprehensionViewer({
  activity,
  onComplete,
}: {
  activity: Activity;
  onComplete: () => void;
}) {
  const cc = activity.comprehensionContent!;
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{
    correct: boolean | null;
    explanation: string;
    reviewedAnswer?: string;
    relevance: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await journeyService.submitComprehensionAnswer(activity.id, answer);
      setResult(res);
      onComplete();
    } catch {
      // show generic error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Code snippet */}
      <div className="rounded-xl border border-ink-200 dark:border-ink-700 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-ink-100 dark:bg-ink-800 border-b border-ink-200 dark:border-ink-700">
          <Code size={13} className="text-ink-400" />
          <span className="text-xs font-semibold text-ink-600 dark:text-ink-300">
            {cc.language}
          </span>
        </div>
        <pre className="p-4 text-xs font-mono text-ink-800 dark:text-ink-200 overflow-x-auto bg-ink-50 dark:bg-ink-900">
          <code>{cc.codeSnippet}</code>
        </pre>
      </div>

      {/* Task prompt */}
      <div className="rounded-xl bg-primary-50 border border-primary-200 dark:bg-primary-900/20 dark:border-primary-800 p-4">
        <p className="text-sm font-semibold text-primary-900 dark:text-primary-200">{cc.prompt}</p>
      </div>

      {/* Answer input (before submission) */}
      {!result && (
        <div className="space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here…"
            rows={3}
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-[#6542C5] focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:placeholder-ink-500 resize-none"
          />
          <Button onClick={handleSubmit} loading={submitting} disabled={!answer.trim()}>
            Submit Answer
          </Button>
        </div>
      )}

      {/* Result feedback */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {result.correct !== null && (
              <div
                className={`rounded-xl border p-4 ${
                  result.correct
                    ? 'bg-success-50 border-success-300 dark:bg-success-700/20 dark:border-success-700'
                    : 'bg-error-50 border-error-300 dark:bg-error-700/20 dark:border-error-700'
                }`}
              >
                <p
                  className={`text-sm font-bold ${
                    result.correct
                      ? 'text-success-700 dark:text-success-300'
                      : 'text-error-700 dark:text-error-300'
                  }`}
                >
                  {result.correct ? '✓ Correct!' : '✗ Not quite.'}
                </p>
                {!result.correct && result.reviewedAnswer && (
                  <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                    Expected: <code className="font-mono">{result.reviewedAnswer}</code>
                  </p>
                )}
              </div>
            )}

            <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-800/50">
              <p className="text-xs font-bold text-ink-700 dark:text-ink-300 mb-1">Explanation</p>
              <p className="text-sm text-ink-600 dark:text-ink-400">{result.explanation}</p>
            </div>

            {result.relevance && (
              <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4 dark:border-primary-900 dark:bg-primary-900/10">
                <p className="text-xs font-bold text-primary-700 dark:text-[#B59AF7] mb-1">
                  Why this matters
                </p>
                <p className="text-sm text-primary-800 dark:text-primary-200">{result.relevance}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main StageDetail page ────────────────────────────────────────────────────

export function StageDetail() {
  const { journeySlug, stageSlug } = useParams<{
    journeySlug: string;
    stageSlug: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [stage, setStage] = useState<Stage | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [progress, setProgress] = useState<StudentJourneyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active activity in the overlay
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);

  const load = useCallback(async () => {
    if (!journeySlug || !stageSlug) return;
    setLoading(true);
    setError(null);
    try {
      const [s, acts, p] = await Promise.all([
        journeyService.getStage(stageSlug),
        journeyService.listActivities(stageSlug),
        journeyService.getProgress(journeySlug),
      ]);
      setStage(s);
      setActivities(acts);
      setProgress(p);

      // Auto-open activity if query parameter is present (e.g. from comprehension hub)
      const targetActId = searchParams.get('activity');
      if (targetActId) {
        const found = acts.find((a) => a.id === targetActId);
        if (found) setActiveActivity(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load stage.');
    } finally {
      setLoading(false);
    }
  }, [journeySlug, stageSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const stageState = (progress?.stageStates[stage?.id ?? ''] ?? 'locked') as StageProgressState;
  const completedIds = new Set(progress?.completedActivities.map((a) => a.activityId) ?? []);

  const completedCount = activities.filter((a) => completedIds.has(a.id)).length;
  const requiredActivities = activities.filter((a) => a.isRequired);
  const requiredCompleted = requiredActivities.filter((a) => completedIds.has(a.id)).length;
  const checkpointEligible =
    stageState !== 'locked' && requiredCompleted === requiredActivities.length;

  const handleActivityComplete = async () => {
    // Reload progress silently
    try {
      const p = await journeyService.getProgress(journeySlug!);
      setProgress(p);
    } catch {}
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-ink-200 dark:bg-ink-800 rounded-xl w-48" />
          <div className="h-4 bg-ink-100 dark:bg-ink-800 rounded-lg w-72" />
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-ink-100 dark:bg-ink-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !stage) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 text-center py-16 space-y-4">
          <AlertCircle size={32} className="text-error-500 mx-auto" />
          <p className="text-sm text-ink-600 dark:text-ink-400">{error ?? 'Stage not found.'}</p>
          <Button onClick={load} variant="outline" size="sm">
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400 mb-5">
          <Link
            to={`/app/journey`}
            className="hover:text-[#6542C5] dark:hover:text-[#B59AF7] transition-colors"
          >
            Learning Journey
          </Link>
          <ChevronRight size={12} />
          <span className="text-ink-900 dark:text-ink-100 font-medium">{stage.title}</span>
        </nav>

        {/* Stage header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              tone={
                stageState === 'passed'
                  ? 'success'
                  : stageState === 'needs_review'
                    ? 'warning'
                    : stageState === 'locked'
                      ? 'neutral'
                      : 'primary'
              }
            >
              {stageState.replace('_', ' ')}
            </Badge>
            {stage.type === 'milestone' && <Badge tone="warning">Milestone</Badge>}
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50 mb-1">
            {stage.title}
          </h1>
          {stage.learningGoal && (
            <p className="text-sm text-ink-500 dark:text-ink-400">{stage.learningGoal}</p>
          )}

          {/* Progress */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6542C5] transition-all duration-500"
                style={{
                  width: `${activities.length > 0 ? (completedCount / activities.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-ink-700 dark:text-ink-300 whitespace-nowrap">
              {completedCount} / {activities.length}
            </span>
          </div>
        </div>

        {/* Checkpoint eligibility notice */}
        {checkpointEligible && stageState !== 'passed' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-xl border border-primary-300 bg-primary-50 p-4 dark:border-primary-700 dark:bg-primary-900/20 flex items-start gap-3"
          >
            <Target size={18} className="text-[#6542C5] dark:text-[#B59AF7] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary-800 dark:text-primary-200">
                Ready for the checkpoint!
              </p>
              <p className="text-xs text-primary-700 dark:text-[#B59AF7] mt-0.5">
                You've completed all required activities. Take the checkpoint to unlock the next stage.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                navigate(`/app/journey/${journeySlug}/stage/${stageSlug}/checkpoint`)
              }
              className="shrink-0"
            >
              Start Checkpoint
            </Button>
          </motion.div>
        )}

        {/* Passed notice */}
        {stageState === 'passed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-5 rounded-xl border border-success-300 bg-success-50 p-4 dark:border-success-700 dark:bg-success-700/10 flex items-center gap-3"
          >
            <Check size={18} className="text-success-600 dark:text-success-400 shrink-0" />
            <p className="text-sm font-bold text-success-700 dark:text-success-300">
              Stage passed — you can review any activity below.
            </p>
          </motion.div>
        )}

        {/* Activity list */}
        <div className="space-y-3">
          {activities.length === 0 && (
            <p className="text-sm text-ink-500 dark:text-ink-400 py-6 text-center">
              No activities published yet.
            </p>
          )}
          {activities.map((activity, i) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              completed={completedIds.has(activity.id)}
              index={i}
              onOpen={() => setActiveActivity(activity)}
            />
          ))}
        </div>
      </div>

      {/* Activity detail panel (slide-in overlay) */}
      <AnimatePresence>
        {activeActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink-950/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveActivity(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-ink-200 bg-white p-6 shadow-lift dark:border-ink-800 dark:bg-ink-900"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="min-w-0">
                  <Badge tone="primary" className="mb-2">
                    {ACTIVITY_META[activeActivity.type]?.label}
                  </Badge>
                  <h2 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">
                    {activeActivity.title}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveActivity(null)}
                  aria-label="Close"
                  className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
                >
                  ✕
                </button>
              </div>

              {/* Content based on type */}
              {activeActivity.type === 'lesson' && (
                <LessonViewer
                  activity={activeActivity}
                  onComplete={() => {
                    setActiveActivity(null);
                    handleActivityComplete();
                  }}
                />
              )}

              {activeActivity.type.startsWith('comprehension') && activeActivity.comprehensionContent && (
                <ComprehensionViewer
                  activity={activeActivity}
                  onComplete={handleActivityComplete}
                />
              )}

              {activeActivity.type === 'coding_practice' && activeActivity.codingProblemId && (
                <div className="space-y-4">
                  <p className="text-sm text-ink-600 dark:text-ink-400">
                    Open this problem in the coding workspace. When you pass all test cases, your
                    completion will be recorded.
                  </p>
                  <Link
                    to={`/app/journey/${journeySlug}/practice/${activeActivity.codingProblemId}`}
                    onClick={() => setActiveActivity(null)}
                  >
                    <Button>
                      <Code size={16} />
                      Open Coding Problem
                      <ExternalLink size={14} />
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

