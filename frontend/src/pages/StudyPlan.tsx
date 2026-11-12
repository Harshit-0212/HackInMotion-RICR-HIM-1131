import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Lock,
  Play,
  RefreshCw,
  Calendar,
  Clock,
  Target,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  AlertCircle,
  Brain,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAppData } from '@/store/AppDataContext';
import { useToast } from '@/store/ToastContext';
import type { DiagnosticEvaluation, SessionAssessmentQuestion, StudySession } from '@/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES: { id: 'morning' | 'afternoon' | 'evening' | 'night'; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'night', label: 'Night' },
];

const STATUS_CONFIG = {
  completed: { icon: Check, tone: 'success' as const, label: 'Completed', color: 'bg-success-500' },
  'in-progress': { icon: Play, tone: 'accent' as const, label: 'In Progress', color: 'bg-accent-500' },
  upcoming: { icon: Clock, tone: 'primary' as const, label: 'Upcoming', color: 'bg-[#6542C5]' },
  locked: { icon: Lock, tone: 'neutral' as const, label: 'Locked', color: 'bg-ink-300' },
  missed: { icon: AlertTriangle, tone: 'error' as const, label: 'Missed', color: 'bg-error-500' },
};

export function StudyPlan() {
  const { plan, goal, markSessionComplete, autoAdjustPlan, rescheduleSession, resetPlan } = useAppData();
  const { showToast } = useToast();
  const [adjusting, setAdjusting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<StudySession | null>(null);
  const [newDate, setNewDate] = useState('');

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetPlan();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not start a new plan.', 'error');
    } finally {
      setResetting(false);
    }
  };

  if (!plan) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="Your Personalized Study Plan"
            subtitle="Tell Cadence your goal and it'll build a real, AI-generated schedule."
          />
          <CreatePlanForm />
        </div>
      </AppLayout>
    );
  }

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const hasMissed = plan.sessions.some((s) => s.status === 'missed');

  const handleAutoAdjust = async () => {
    setAdjusting(true);
    await autoAdjustPlan();
    setAdjusting(false);
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget || !newDate) return;
    await rescheduleSession(rescheduleTarget.id, new Date(newDate).toISOString());
    setRescheduleTarget(null);
    setNewDate('');
  };

  const handleComplete = async (sessionId: string) => {
    await markSessionComplete(sessionId);
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Your Personalized Study Plan"
          subtitle={goal?.title ?? plan.goalTitle}
          action={
            <div className="flex items-center gap-2">
              {hasMissed && (
                <Button onClick={handleAutoAdjust} loading={adjusting}>
                  <RefreshCw size={16} /> Auto-adjust
                </Button>
              )}
              <Button variant="outline" onClick={handleReset} loading={resetting}>
                Start a new plan
              </Button>
            </div>
          }
        />

        {/* Plan summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard icon={Target} label="Goal" value={goal?.title ?? plan.goalTitle} />
          <SummaryCard
            icon={Calendar}
            label="Exam Date"
            value={new Date(plan.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          />
          <SummaryCard icon={Clock} label="Days Remaining" value={`${daysRemaining} days`} />
          <SummaryCard icon={Sparkles} label="Completion" value={`${plan.completionPercent}%`} />
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <Card>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-ink-700 dark:text-ink-200">Plan completion</span>
              <span className="font-semibold text-ink-900 dark:text-ink-50">{plan.completionPercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#6542C5] to-accent-500"
                initial={{ width: 0 }}
                animate={{ width: `${plan.completionPercent}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            {plan.lastAdaptedAt && (
              <p className="mt-2 text-xs text-accent-600 dark:text-accent-400">
                <RefreshCw size={11} className="inline" /> Last adapted{' '}
                {new Date(plan.lastAdaptedAt).toLocaleDateString()}
              </p>
            )}
          </Card>
        </div>

        {/* Adaptive banner */}
        {hasMissed && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
            <Card
              padding="lg"
              className="border-warning-200 bg-warning-50 dark:border-warning-700 dark:bg-warning-700/20"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-100 text-warning-700 dark:bg-warning-700/40 dark:text-warning-200">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">
                      Your plan needs adjustment
                    </h3>
                    <p className="text-sm text-ink-600 dark:text-ink-300">
                      You missed a session. Auto-adjust to reshuffle, or reschedule manually.
                    </p>
                  </div>
                </div>
                <Button onClick={handleAutoAdjust} loading={adjusting} className="shrink-0">
                  <RefreshCw size={14} /> Auto-adjust my plan
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Timeline */}
        <div className="mt-6">
          <h2 className="mb-4 font-display text-lg font-bold text-ink-900 dark:text-ink-50">Timeline</h2>
          <div className="relative">
            <div className="absolute left-[19px] top-0 h-full w-0.5 bg-ink-200 dark:bg-ink-800" />
            <div className="space-y-4">
              {plan.sessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <SessionRow
                    session={session}
                    onComplete={() => handleComplete(session.id)}
                    onReschedule={() => {
                      setRescheduleTarget(session);
                      setNewDate(session.date.slice(0, 10));
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!rescheduleTarget} onClose={() => setRescheduleTarget(null)} title="Reschedule session" size="sm">
        {rescheduleTarget && (
          <div>
            <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
              Move <span className="font-semibold text-ink-900 dark:text-ink-50">{rescheduleTarget.topic}</span> to a
              new date.
            </p>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm dark:border-ink-700 dark:bg-ink-900"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRescheduleTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleReschedule} disabled={!newDate}>
                Reschedule
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <Card padding="sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-[#6542C5] dark:bg-primary-900/40 dark:text-[#B59AF7]">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-400 dark:text-ink-500">{label}</p>
          <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function SessionRow({
  session,
  onComplete,
  onReschedule,
}: {
  session: StudySession;
  onComplete: () => void;
  onReschedule: () => void;
}) {
  const config = STATUS_CONFIG[session.status];
  const StatusIcon = config.icon;
  const isLocked = session.status === 'locked';
  const isCompleted = session.status === 'completed';

  return (
    <div className="relative flex gap-4">
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white text-white dark:border-ink-950 ${config.color}`}
      >
        <StatusIcon size={16} />
      </div>
      <Card
        padding="md"
        className={`flex-1 ${isLocked ? 'opacity-60' : ''} ${isCompleted ? 'border-success-200 dark:border-success-700' : ''}`}
        hover={!isLocked}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-ink-400 dark:text-ink-500">Day {session.day}</span>
              <Badge tone={config.tone}>{config.label}</Badge>
            </div>
            <h3 className="mt-1 font-display text-base font-semibold text-ink-900 dark:text-ink-50">{session.topic}</h3>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{session.objective}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="neutral">
                <Clock size={11} /> {session.estimatedMinutes} min
              </Badge>
              <Badge tone="accent">{session.difficulty}</Badge>
              <Badge tone="primary">{session.subject}</Badge>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {!isLocked && !isCompleted && (
              <Link to="/app/session">
                <Button size="sm">
                  <Play size={14} /> Start
                </Button>
              </Link>
            )}
            {!isCompleted && (
              <Button size="sm" variant="success" onClick={onComplete}>
                <Check size={14} /> Mark done
              </Button>
            )}
            {!isLocked && (
              <>
                <Button size="sm" variant="outline" onClick={onReschedule}>
                  Reschedule
                </Button>
                <Link to="/app/tutor">
                  <Button size="sm" variant="ghost">
                    <MessageSquare size={14} />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        {!isLocked && session.conceptsTotal > 0 && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6542C5] to-accent-500 transition-all"
                style={{ width: `${(session.conceptsDone / session.conceptsTotal) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-ink-400">
              {session.conceptsDone}/{session.conceptsTotal} concepts
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

type SetupStep = 'setup' | 'diagnostic' | 'diagnosing' | 'result';

function CreatePlanForm() {
  const { createGoal, runDiagnostic, evaluateDiagnostic, generatePlan } = useAppData();
  const { showToast } = useToast();

  const [step, setStep] = useState<SetupStep>('setup');
  const [title, setTitle] = useState('');
  const [subjects, setSubjects] = useState('');
  const [topics, setTopics] = useState('');
  const [deadline, setDeadline] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [studyDays, setStudyDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('evening');
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);
  const [questions, setQuestions] = useState<SessionAssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticEvaluation | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    setStudyDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const canSubmit =
    title.trim().length > 0 && subjects.trim().length > 0 && deadline.length > 0 && studyDays.length > 0;
  const subjectList = () =>
    subjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  const topicList = () =>
    topics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const startDiagnostic = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoadingDiagnostic(true);
    setStep('diagnostic');
    try {
      const qs = await runDiagnostic(subjectList(), topicList());
      setQuestions(qs);
      setAnswers({});
      setCurrentQ(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build your diagnostic. Please try again.');
      setStep('setup');
    } finally {
      setLoadingDiagnostic(false);
    }
  };

  const submitDiagnostic = async () => {
    setStep('diagnosing');
    try {
      const qa = questions.map((q, i) => ({
        prompt: q.prompt,
        correctAnswer: q.correctAnswer,
        studentAnswer: answers[i] ?? '',
        topic: q.topic,
      }));
      const evaluation = await evaluateDiagnostic(subjectList(), qa);
      setDiagnosticResult(evaluation);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not evaluate your diagnostic. Please try again.');
      setStep('diagnostic');
    }
  };

  const finishSetup = async () => {
    if (!diagnosticResult) return;
    setGeneratingPlan(true);
    setError(null);
    try {
      await createGoal({
        type: 'exam',
        title: title.trim(),
        subjects: subjectList(),
        topics: topicList(),
        deadline: new Date(deadline).toISOString(),
        availableTime: { hoursPerDay, studyDays, preferredTime },
        knowledgeLevel: diagnosticResult.knowledgeLevel,
      });
      await generatePlan();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate your study plan. Please try again.');
      showToast('Could not generate your study plan.', 'error');
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (step === 'diagnostic' || step === 'diagnosing') {
    const q = questions[currentQ];
    return (
      <Card padding="lg" className="max-w-2xl">
        <div className="mb-4 flex items-center gap-2">
          <Brain size={18} className="text-[#6542C5]" />
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">Quick diagnostic</h3>
        </div>
        {loadingDiagnostic || !q ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6542C5] border-t-transparent" />
            <p className="text-sm font-medium text-ink-700 dark:text-ink-200">
              Building a diagnostic from your subjects…
            </p>
          </div>
        ) : step === 'diagnosing' ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6542C5] border-t-transparent" />
            <p className="text-sm font-medium text-ink-700 dark:text-ink-200">Evaluating your starting knowledge…</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <Badge tone="primary">
                Question {currentQ + 1} of {questions.length}
              </Badge>
              <span className="text-sm text-ink-400">
                {Object.keys(answers).length}/{questions.length} answered
              </span>
            </div>
            <Badge tone="neutral">{q.topic}</Badge>
            <h4 className="mt-3 font-display text-base font-semibold text-ink-900 dark:text-ink-50">{q.prompt}</h4>
            <div className="mt-4 space-y-2">
              {q.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [currentQ]: opt })}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition ${
                    answers[currentQ] === opt
                      ? 'border-[#6542C5] bg-primary-50 dark:border-[#6542C5] dark:bg-primary-900/30'
                      : 'border-ink-200 hover:border-ink-300 dark:border-ink-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
              {q.type === 'short-answer' && (
                <input
                  value={answers[currentQ] ?? ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQ]: e.target.value })}
                  placeholder="Type your answer…"
                  className="h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm dark:border-ink-700 dark:bg-ink-900"
                />
              )}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>
                <ChevronLeft size={16} /> Previous
              </Button>
              {currentQ === questions.length - 1 ? (
                <Button onClick={submitDiagnostic} disabled={Object.keys(answers).length < questions.length}>
                  Finish diagnostic
                </Button>
              ) : (
                <Button onClick={() => setCurrentQ(currentQ + 1)} disabled={!answers[currentQ]}>
                  Next <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    );
  }

  if (step === 'result' && diagnosticResult) {
    return (
      <Card padding="lg" className="max-w-2xl">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-[#6542C5]" />
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">Diagnostic complete</h3>
        </div>
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6542C5] dark:text-[#B59AF7]">
            AI-assessed level
          </p>
          <p className="mt-1 font-display text-xl font-bold capitalize text-ink-900 dark:text-ink-50">
            {diagnosticResult.knowledgeLevel}
          </p>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{diagnosticResult.reasoning}</p>
        </div>
        {diagnosticResult.weakTopics.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-ink-700 dark:text-ink-200">Areas to prioritize</p>
            <div className="flex flex-wrap gap-2">
              {diagnosticResult.weakTopics.map((t) => (
                <Badge key={t} tone="warning">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-700 dark:bg-error-700/10 dark:text-error-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <Button size="lg" fullWidth className="mt-5" onClick={finishSetup} loading={generatingPlan}>
          <Sparkles size={16} /> Build my study plan
        </Button>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="max-w-2xl">
      <h3 className="mb-5 font-display text-lg font-semibold text-ink-900 dark:text-ink-50">Set up your study plan</h3>

      <div className="space-y-4">
        <Input
          label="Goal"
          placeholder="e.g. CSE Semester Exams"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="Subjects (comma separated)"
          placeholder="e.g. DSA, DBMS, Operating Systems"
          value={subjects}
          onChange={(e) => setSubjects(e.target.value)}
          required
        />
        <Input
          label="Topics (comma separated, optional)"
          placeholder="e.g. Dynamic Programming, Normalization"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
        />
        <Input
          label="Deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          required
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Hours per day</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="flex-1 accent-primary-600"
            />
            <Badge tone="primary">{hoursPerDay}h/day</Badge>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Study days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  studyDays.includes(d)
                    ? 'border-[#6542C5] bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                    : 'border-ink-200 text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Preferred time</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setPreferredTime(t.id)}
                className={`rounded-xl border p-2.5 text-sm font-medium transition ${
                  preferredTime === t.id
                    ? 'border-[#6542C5] bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                    : 'border-ink-200 text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-primary-200 bg-primary-50 p-3.5 text-sm text-primary-700 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-200">
          <Brain size={14} className="mr-1.5 inline" />
          Instead of picking a level yourself, you'll take a short AI-generated diagnostic next — Cadence uses your
          actual answers to judge your starting knowledge.
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-700 dark:bg-error-700/10 dark:text-error-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button size="lg" fullWidth onClick={startDiagnostic} disabled={!canSubmit}>
          <Brain size={16} /> Take the diagnostic
        </Button>
      </div>
    </Card>
  );
}
