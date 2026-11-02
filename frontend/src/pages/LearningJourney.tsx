/**
 * LearningJourney.tsx
 *
 * The main learning journey page. Lazy-loads the React Flow canvas so it does
 * not block authentication or the dashboard shell.
 *
 * Structure:
 * - Compact header: title, progress, Continue, Map/List toggle
 * - Map view: React Flow canvas (lazy) with controls
 * - List view: fully accessible alternative (no canvas required)
 * - Stage detail drawer: opens on node/row click
 */
import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  List,
  PlayCircle,
  ChevronRight,
  Lock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Star,
  RefreshCw,
  Loader2,
  BookOpen,
  Code,
  Brain,
  Target,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { journeyService } from '@/services/journeyService';
import type { Journey, Stage, StudentJourneyProgress, StageProgressState } from '@/types/journey';

// Lazy-load the canvas so login/dashboard aren't blocked
const JourneyCanvas = lazy(() =>
  import('./JourneyCanvas').then((m) => ({ default: m.JourneyCanvas })),
);

// ─── State utilities ─────────────────────────────────────────────────────────

const STATE_CONFIG: Record<
  StageProgressState,
  {
    label: string;
    icon: React.ElementType;
    tone: 'success' | 'primary' | 'warning' | 'neutral' | 'error';
    nodeClass: string;
    ringClass: string;
  }
> = {
  passed: {
    label: 'Completed',
    icon: CheckCircle2,
    tone: 'success',
    nodeClass: 'bg-success-50 border-success-400 dark:bg-success-700/20 dark:border-success-500',
    ringClass: 'ring-success-400',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircle,
    tone: 'primary',
    nodeClass: 'bg-primary-50 border-primary-400 dark:bg-primary-900/30 dark:border-primary-500',
    ringClass: 'ring-primary-400',
  },
  available: {
    label: 'Available',
    icon: Circle,
    tone: 'primary',
    nodeClass: 'bg-white border-ink-300 dark:bg-ink-800 dark:border-ink-600',
    ringClass: 'ring-ink-300',
  },
  checkpoint_eligible: {
    label: 'Ready for Checkpoint',
    icon: Target,
    tone: 'primary',
    nodeClass: 'bg-primary-50 border-primary-500 dark:bg-primary-900/40 dark:border-primary-400',
    ringClass: 'ring-primary-500',
  },
  locked: {
    label: 'Locked',
    icon: Lock,
    tone: 'neutral',
    nodeClass: 'bg-ink-50 border-ink-200 dark:bg-ink-900 dark:border-ink-700 opacity-60',
    ringClass: 'ring-ink-300',
  },
  needs_review: {
    label: 'Needs Review',
    icon: AlertCircle,
    tone: 'warning',
    nodeClass: 'bg-warning-50 border-warning-400 dark:bg-warning-700/20 dark:border-warning-500',
    ringClass: 'ring-warning-400',
  },
};

function stateConfig(state: StageProgressState) {
  return STATE_CONFIG[state] ?? STATE_CONFIG.locked;
}

// ─── Stage detail drawer ─────────────────────────────────────────────────────

function StageDetailDrawer({
  stage,
  state,
  stages,
  progress,
  onClose,
  journeySlug,
}: {
  stage: Stage;
  state: StageProgressState;
  stages: Stage[];
  progress: StudentJourneyProgress;
  onClose: () => void;
  journeySlug: string;
}) {
  const navigate = useNavigate();
  const cfg = stateConfig(state);
  const Icon = cfg.icon;

  const completedActivityIds = new Set(
    progress.completedActivities.map((a) => a.activityId),
  );
  const completedCount = stage.activityIds.filter((id) => completedActivityIds.has(id)).length;
  const totalRequired = stage.activityIds.length;

  const missingPrereqs = stage.prerequisiteStageIds
    .filter((pid) => progress.stageStates[pid] !== 'passed')
    .map((pid) => stages.find((s) => s.id === pid)?.title ?? pid);

  const ctaLabel =
    state === 'passed'
      ? 'Review Stage'
      : state === 'locked'
        ? 'Prerequisites not met'
        : state === 'needs_review'
          ? 'Review and Retry'
          : completedCount === 0
            ? 'Start Learning'
            : 'Continue Learning';

  const handleCta = () => {
    if (state === 'locked') return;
    navigate(`/app/journey/${journeySlug}/stage/${stage.slug}`);
    onClose();
  };

  const activityTypeIcon = (slug: string) => {
    if (slug.includes('lesson')) return BookOpen;
    if (slug.includes('coding')) return Code;
    if (slug.includes('comprehension')) return Brain;
    return BookOpen;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-y-0 right-0 z-20 w-full max-w-sm border-l border-ink-200 bg-white shadow-lift dark:border-ink-800 dark:bg-ink-900 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-ink-100 dark:border-ink-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge tone={cfg.tone}>
              <Icon size={11} />
              {cfg.label}
            </Badge>
            {stage.type === 'milestone' && (
              <Badge tone="warning">
                <Star size={11} />
                Milestone
              </Badge>
            )}
          </div>
          <h3 className="font-display text-base font-bold text-ink-900 dark:text-ink-50 leading-snug">
            {stage.title}
          </h3>
          {stage.learningGoal && (
            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
              {stage.learningGoal}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Locked warning */}
        {state === 'locked' && missingPrereqs.length > 0 && (
          <div className="rounded-xl bg-ink-50 border border-ink-200 p-4 dark:bg-ink-800/60 dark:border-ink-700">
            <p className="text-xs font-semibold text-ink-700 dark:text-ink-300 mb-2">
              Complete these stages first:
            </p>
            <ul className="space-y-1">
              {missingPrereqs.map((name) => (
                <li key={name} className="flex items-center gap-2 text-xs text-ink-600 dark:text-ink-400">
                  <Lock size={11} className="text-ink-400 shrink-0" />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress */}
        {state !== 'locked' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-ink-700 dark:text-ink-300">Activities</p>
              <span className="text-xs text-ink-500 dark:text-ink-400">
                {completedCount} / {totalRequired}
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-500"
                style={{ width: `${totalRequired > 0 ? (completedCount / totalRequired) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Topics covered */}
        {stage.topicTags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ink-700 dark:text-ink-300 mb-2">Topics covered</p>
            <div className="flex flex-wrap gap-1.5">
              {stage.topicTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Checkpoint requirements */}
        <div className="rounded-xl border border-ink-100 bg-ink-50/50 dark:border-ink-800 dark:bg-ink-800/30 p-4">
          <p className="text-xs font-bold text-ink-700 dark:text-ink-300 mb-3">
            Checkpoint requirements
          </p>
          <div className="space-y-2 text-xs text-ink-600 dark:text-ink-400">
            <div className="flex justify-between">
              <span>Knowledge questions</span>
              <span className="font-medium">{stage.checkpoint.knowledgeQuestionCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Pass score</span>
              <span className="font-medium">{stage.checkpoint.knowledgePassPercent}%</span>
            </div>
            <div className="flex justify-between">
              <span>Coding tasks</span>
              <span className="font-medium">
                {stage.checkpoint.codingPassCount} / {stage.checkpoint.codingTaskCount} must pass
              </span>
            </div>
          </div>
        </div>

        {/* Needs review */}
        {state === 'needs_review' && (
          <div className="rounded-xl border border-warning-300 bg-warning-50 p-4 dark:border-warning-700 dark:bg-warning-700/10">
            <p className="text-xs font-semibold text-warning-800 dark:text-warning-300">
              You didn't pass the checkpoint last time. Review the topics and try again.
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="shrink-0 p-5 border-t border-ink-100 dark:border-ink-800">
        <Button
          onClick={handleCta}
          disabled={state === 'locked'}
          fullWidth
          variant={state === 'passed' ? 'outline' : state === 'needs_review' ? 'primary' : 'primary'}
        >
          {ctaLabel}
          {state !== 'locked' && <ChevronRight size={16} />}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function StageListRow({
  stage,
  index,
  state,
  progress,
  onClick,
}: {
  stage: Stage;
  index: number;
  state: StageProgressState;
  progress: StudentJourneyProgress;
  onClick: () => void;
}) {
  const cfg = stateConfig(state);
  const Icon = cfg.icon;
  const completedCount = stage.activityIds.filter((id) =>
    progress.completedActivities.some((a) => a.activityId === id),
  ).length;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={onClick}
      className={`w-full text-left group flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${cfg.nodeClass}`}
    >
      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${cfg.nodeClass}`}
      >
        <Icon size={18} className={state === 'locked' ? 'text-ink-400' : 'text-current'} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-display text-sm font-bold text-ink-900 dark:text-ink-50 truncate">
            {stage.title}
          </span>
          {stage.type === 'milestone' && (
            <Star size={12} className="text-warning-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-500 dark:text-ink-400">
          <span>
            {completedCount}/{stage.activityIds.length} activities
          </span>
          <Badge tone={cfg.tone} className="text-[10px] py-0">
            {cfg.label}
          </Badge>
        </div>
      </div>

      <ChevronRight
        size={16}
        className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5"
      />
    </motion.button>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function JourneyLoadingSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-ink-200 dark:bg-ink-800 rounded-xl w-64" />
      <div className="h-4 bg-ink-100 dark:bg-ink-800 rounded-lg w-48" />
      <div className="flex gap-3">
        <div className="h-10 bg-ink-100 dark:bg-ink-800 rounded-xl w-32" />
        <div className="h-10 bg-ink-100 dark:bg-ink-800 rounded-xl w-24" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-ink-100 dark:bg-ink-800 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function LearningJourney() {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [progress, setProgress] = useState<StudentJourneyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const navigate = useNavigate();

  // For now, load the first published journey
  // TODO: journey picker if multiple journeys are published
  const JOURNEY_SLUG = 'arrays-fundamentals';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch available journeys first rather than assuming slug exists
      const journeys = await journeyService.listJourneys();
      if (!journeys || journeys.length === 0) {
        setError('no-journey');
        return;
      }
      const activeJourney = journeys.find((j) => j.slug === JOURNEY_SLUG) || journeys[0];

      const [s, p] = await Promise.all([
        journeyService.listStages(activeJourney.slug),
        journeyService.getProgress(activeJourney.slug),
      ]);
      setJourney(activeJourney);
      // Sort stages according to journey.stageIds order
      const ordered = activeJourney.stageIds
        .map((id) => s.find((st) => st.id === id))
        .filter(Boolean) as Stage[];
      setStages(ordered);
      setProgress(p);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load the learning journey.';
      // Distinguish server offline / network error from not found
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('API Error')) {
        setError('connection-error');
      } else if (msg.includes('not found') || msg.includes('404')) {
        setError('no-journey');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Find current stage (first non-passed, non-locked)
  const currentStage = stages.find((s) => {
    const state = progress?.stageStates[s.id];
    return state === 'in_progress' || state === 'available' || state === 'needs_review';
  });

  const passedCount = stages.filter(
    (s) => progress?.stageStates[s.id] === 'passed',
  ).length;

  if (loading) {
    return (
      <AppLayout>
        <JourneyLoadingSkeleton />
      </AppLayout>
    );
  }

  if (error === 'connection-error') {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-lg mx-auto text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center mx-auto">
              <AlertCircle size={28} className="text-warning-600 dark:text-warning-400" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">
              Cannot connect to Cadence learning service
            </h2>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              The server is not responding. Please make sure the Cadence backend service is running on port 3001.
            </p>
            <Button onClick={load} variant="outline" size="sm">
              <RefreshCw size={14} /> Retry Connection
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error === 'no-journey') {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-lg mx-auto text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto">
              <BookOpen size={28} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">
              No journey available yet
            </h2>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              The Arrays Fundamentals journey is being prepared by your instructor. Check back soon.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-lg mx-auto text-center py-16 space-y-4">
            <AlertCircle size={32} className="text-error-500 mx-auto" />
            <p className="text-sm text-ink-600 dark:text-ink-400">{error}</p>
            <Button onClick={load} variant="outline" size="sm">
              <RefreshCw size={14} /> Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[580px] -m-4 sm:-m-6 lg:-m-8">
        {/* ── Compact header ── */}
        <header className="shrink-0 px-4 sm:px-6 pt-4 pb-3 flex flex-wrap items-center gap-3 border-b border-ink-100 dark:border-ink-800">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50 truncate">
              {journey?.title}
            </h1>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              {passedCount} of {stages.length} stages completed
            </p>
          </div>

          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-3 min-w-[140px]">
            <div className="flex-1 h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-700"
                style={{ width: `${stages.length > 0 ? (passedCount / stages.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-ink-700 dark:text-ink-300 whitespace-nowrap">
              {stages.length > 0 ? Math.round((passedCount / stages.length) * 100) : 0}%
            </span>
          </div>

          {/* Continue button */}
          {currentStage && (
            <Button
              size="sm"
              onClick={() => navigate(`/app/journey/${JOURNEY_SLUG}/stage/${currentStage.slug}`)}
            >
              <PlayCircle size={15} />
              Continue
            </Button>
          )}

          {/* View toggle & Code Comprehension link */}
          <div className="flex items-center gap-2">
            <Link to="/app/comprehension">
              <Button size="sm" variant="outline" className="hidden sm:inline-flex">
                <Brain size={15} />
                Comprehension Hub
              </Button>
            </Link>

            <div className="flex rounded-xl border border-ink-200 dark:border-ink-700 overflow-hidden">
              <button
                onClick={() => setView('map')}
                aria-label="Map view"
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
                  view === 'map'
                    ? 'bg-primary-600 text-white'
                    : 'text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'
                }`}
              >
                <Map size={14} />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                onClick={() => setView('list')}
                aria-label="List view"
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors border-l border-ink-200 dark:border-ink-700 ${
                  view === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'
                }`}
              >
                <List size={14} />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <div className="flex-1 relative overflow-hidden">
          {view === 'list' ? (
            /* List view */
            <div className="h-full overflow-y-auto">
              <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-3">
                {stages.length === 0 && (
                  <div className="text-center py-12 text-ink-500 dark:text-ink-400 text-sm">
                    No stages have been published yet.
                  </div>
                )}
                {stages.map((stage, i) => (
                  <StageListRow
                    key={stage.id}
                    stage={stage}
                    index={i}
                    state={(progress?.stageStates[stage.id] ?? 'locked') as StageProgressState}
                    progress={progress!}
                    onClick={() => setSelectedStage(stage)}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Map view (canvas, lazy-loaded) */
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-ink-400">
                    <Loader2 size={28} className="animate-spin" />
                    <span className="text-sm">Loading map…</span>
                  </div>
                </div>
              }
            >
              <JourneyCanvas
                stages={stages}
                progress={progress!}
                journeySlug={JOURNEY_SLUG}
                onStageSelect={setSelectedStage}
              />
            </Suspense>
          )}

          {/* Stage detail drawer */}
          <AnimatePresence>
            {selectedStage && progress && (
              <StageDetailDrawer
                stage={selectedStage}
                state={(progress.stageStates[selectedStage.id] ?? 'locked') as StageProgressState}
                stages={stages}
                progress={progress}
                onClose={() => setSelectedStage(null)}
                journeySlug={JOURNEY_SLUG}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}

