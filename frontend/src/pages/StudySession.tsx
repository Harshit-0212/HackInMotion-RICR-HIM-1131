import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Check,
  Clock,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  PartyPopper,
  Brain,
  RotateCcw,
  Lightbulb,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppData } from '@/store/AppDataContext';
import { useToast } from '@/store/ToastContext';
import type { SessionAssessmentQuestion, SessionUnderstandingEvaluation } from '@/types';

type Phase = 'studying' | 'assessment' | 'evaluating' | 'success' | 'reinforcement';

export function StudySession() {
  const { plan, generateSessionAssessment, evaluateSessionUnderstanding } = useAppData();
  const { showToast } = useToast();

  const session =
    plan?.sessions.find((s) => s.status === 'in-progress') ?? plan?.sessions.find((s) => s.status === 'upcoming');

  const [notes, setNotes] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>('studying');
  const [generatingAssessment, setGeneratingAssessment] = useState(false);
  const [questions, setQuestions] = useState<SessionAssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [evaluation, setEvaluation] = useState<SessionUnderstandingEvaluation | null>(null);
  const autoTriggeredRef = useRef(false);

  const targetSeconds = (session?.estimatedMinutes ?? 0) * 60;

  useEffect(() => {
    if (!timerRunning || phase !== 'studying') return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning, phase]);

  useEffect(() => {
    if (phase === 'studying' && targetSeconds > 0 && elapsed >= targetSeconds && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      setTimerRunning(false);
      handleTriggerAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, targetSeconds, phase]);

  if (!session) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <p className="text-ink-500">
            No active session.{' '}
            <Link to="/app/plan" className="text-[#6542C5]">
              Back to plan
            </Link>
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleTriggerAssessment = async () => {
    setGeneratingAssessment(true);
    setPhase('assessment');
    setAnswers({});
    setCurrentQ(0);
    try {
      const qs = await generateSessionAssessment(session, notes);
      setQuestions(qs);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not generate the knowledge check.', 'error');
      setPhase('studying');
      autoTriggeredRef.current = false;
    } finally {
      setGeneratingAssessment(false);
    }
  };

  const handleSubmitAssessment = async () => {
    setPhase('evaluating');
    try {
      const qa = questions.map((q, i) => ({
        prompt: q.prompt,
        correctAnswer: q.correctAnswer,
        studentAnswer: answers[i] ?? '',
        topic: q.topic,
      }));
      const result = await evaluateSessionUnderstanding(session.id, qa);
      setEvaluation(result);
      if (result.understood) {
        setPhase('success');
        showToast('Session complete! Streak extended.');
      } else {
        setPhase('reinforcement');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not evaluate your understanding.', 'error');
      setPhase('assessment');
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <Link
          to="/app/plan"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-ink-50"
        >
          <ArrowLeft size={16} /> Back to plan
        </Link>

        <AnimatePresence mode="wait">
          {phase === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md pt-8 text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-[#6542C5] text-white shadow-lift">
                <PartyPopper size={32} />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Session Complete!</h2>
              <p className="mt-2 text-ink-500 dark:text-ink-400">
                You finished <span className="font-semibold">{session.topic}</span>. Your streak and XP have been
                updated.
              </p>
              {evaluation && (
                <p className="mt-3 rounded-xl border border-ink-200 bg-ink-50 p-3 text-left text-sm text-ink-600 dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-300">
                  {evaluation.reasoning}
                </p>
              )}
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/app/tutor">
                  <Button variant="outline">
                    <MessageSquare size={16} /> Ask a doubt
                  </Button>
                </Link>
                <Link to="/app">
                  <Button>Back to dashboard</Button>
                </Link>
              </div>
            </motion.div>
          )}

          {phase === 'reinforcement' && evaluation && (
            <motion.div
              key="reinforcement"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-lg pt-8"
            >
              <Card padding="lg">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-500 to-error-500 text-white shadow-lift">
                    <Brain size={32} />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Not quite there yet</h2>
                  <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{evaluation.reasoning}</p>
                </div>

                {evaluation.weakConcepts.length > 0 && (
                  <div className="mt-5">
                    <h3 className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-50">Needs more work</h3>
                    <div className="flex flex-wrap gap-2">
                      {evaluation.weakConcepts.map((c) => (
                        <Badge key={c} tone="warning">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {evaluation.reinforcementActivities.length > 0 && (
                  <div className="mt-5 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-200">
                      <Lightbulb size={14} /> Suggested next steps
                    </h4>
                    <ul className="space-y-1.5 text-sm text-ink-600 dark:text-ink-300">
                      {evaluation.reinforcementActivities.map((a) => (
                        <li key={a} className="flex gap-2">
                          <span className="text-[#6542C5]">•</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mt-5 text-center text-xs text-ink-400">
                  This session has been kept active and intelligently rescheduled so you can revisit it after some
                  reinforcement.
                </p>

                <div className="mt-5 flex justify-center gap-3">
                  <Link to="/app/tutor">
                    <Button variant="outline">
                      <MessageSquare size={16} /> Ask a doubt
                    </Button>
                  </Link>
                  <Link to="/app/plan">
                    <Button>
                      <RotateCcw size={16} /> Back to plan
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          )}

          {(phase === 'assessment' || phase === 'evaluating') && (
            <motion.div
              key="assessment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto max-w-2xl"
            >
              <Card padding="lg">
                {generatingAssessment || phase === 'evaluating' ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6542C5] border-t-transparent" />
                    <p className="text-sm font-medium text-ink-700 dark:text-ink-200">
                      {phase === 'evaluating'
                        ? 'Evaluating your understanding…'
                        : 'Generating your knowledge check from this session…'}
                    </p>
                  </div>
                ) : questions.length > 0 ? (
                  <>
                    <div className="mb-5 flex items-center justify-between">
                      <Badge tone="primary">
                        Question {currentQ + 1} of {questions.length}
                      </Badge>
                      <span className="text-sm text-ink-400">
                        {Object.keys(answers).length}/{questions.length} answered
                      </span>
                    </div>
                    <div className="mb-2 flex gap-2">
                      <Badge tone="neutral">{questions[currentQ].topic}</Badge>
                      <Badge tone="accent">{questions[currentQ].difficulty}</Badge>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold text-ink-900 dark:text-ink-50">
                      {questions[currentQ].prompt}
                    </h3>
                    <div className="mt-5 space-y-2">
                      {questions[currentQ].options?.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAnswers({ ...answers, [currentQ]: opt })}
                          className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                            answers[currentQ] === opt
                              ? 'border-[#6542C5] bg-primary-50 dark:border-[#6542C5] dark:bg-primary-900/30'
                              : 'border-ink-200 hover:border-ink-300 dark:border-ink-700'
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${answers[currentQ] === opt ? 'border-primary-600 bg-[#6542C5]' : 'border-ink-300 dark:border-ink-600'}`}
                          >
                            {answers[currentQ] === opt && <Check size={12} className="text-white" />}
                          </div>
                          <span className="text-sm text-ink-800 dark:text-ink-100">{opt}</span>
                        </button>
                      ))}
                      {questions[currentQ].type === 'short-answer' && (
                        <input
                          value={answers[currentQ] ?? ''}
                          onChange={(e) => setAnswers({ ...answers, [currentQ]: e.target.value })}
                          placeholder="Type your answer…"
                          className="h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm dark:border-ink-700 dark:bg-ink-900"
                        />
                      )}
                    </div>
                    <div className="mt-6 flex justify-between">
                      <Button
                        variant="ghost"
                        onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                        disabled={currentQ === 0}
                      >
                        <ChevronLeft size={16} /> Previous
                      </Button>
                      {currentQ === questions.length - 1 ? (
                        <Button
                          onClick={handleSubmitAssessment}
                          disabled={Object.keys(answers).length < questions.length}
                        >
                          Submit
                        </Button>
                      ) : (
                        <Button onClick={() => setCurrentQ(currentQ + 1)} disabled={!answers[currentQ]}>
                          Next <ChevronRight size={16} />
                        </Button>
                      )}
                    </div>
                  </>
                ) : null}
              </Card>
            </motion.div>
          )}

          {phase === 'studying' && (
            <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Badge tone="accent">In Progress</Badge>
                  <h1 className="mt-2 font-display text-2xl font-bold text-ink-900 dark:text-ink-50 sm:text-3xl">
                    {session.topic}
                  </h1>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{session.objective}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">
                    <Clock size={12} /> {session.estimatedMinutes} min
                  </Badge>
                  <Badge tone="primary">{session.subject}</Badge>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card padding="lg">
                    <h3 className="mb-2 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
                      Learning notes &amp; materials
                    </h3>
                    <p className="mb-3 text-xs text-ink-500 dark:text-ink-400">
                      Paste notes, key points, or a summary of what you studied. Your AI knowledge check will be
                      generated from your objective and this material.
                    </p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional: paste your notes or a summary of what you covered…"
                      rows={10}
                      className="w-full rounded-xl border border-ink-200 bg-white p-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-[#6542C5] focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                    />
                    <Button className="mt-5" fullWidth size="lg" onClick={handleTriggerAssessment}>
                      <Brain size={18} /> Take Knowledge Check Now
                    </Button>
                  </Card>
                </div>

                <div className="space-y-5">
                  <Card padding="lg">
                    <h3 className="mb-4 font-display text-base font-semibold text-ink-900 dark:text-ink-50">
                      Study Timer
                    </h3>
                    <div className="flex flex-col items-center">
                      <div className="font-display text-4xl font-bold text-ink-900 dark:text-ink-50 tabular-nums">
                        {formatTime(elapsed)}
                      </div>
                      <p className="mt-1 text-xs text-ink-400">of {session.estimatedMinutes} min target</p>
                      <p className="mt-1 text-xs text-ink-400">
                        A knowledge check triggers automatically when you reach the target.
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant={timerRunning ? 'outline' : 'primary'}
                          onClick={() => setTimerRunning(!timerRunning)}
                        >
                          {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                          {timerRunning ? 'Pause' : 'Start'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setElapsed(0);
                            setTimerRunning(false);
                          }}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card
                    padding="lg"
                    className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6542C5] to-accent-500 text-white">
                        <Sparkles size={16} />
                      </div>
                      <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-ink-50">AI Tutor</h3>
                    </div>
                    <p className="text-sm text-ink-600 dark:text-ink-300">Stuck on a concept? Ask Cadence for help.</p>
                    <Link to="/app/tutor" className="mt-3 inline-block">
                      <Button size="sm" variant="outline">
                        <MessageSquare size={14} /> Ask a question
                      </Button>
                    </Link>
                  </Card>

                  <Card padding="lg">
                    <h3 className="mb-3 font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
                      Session info
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-ink-400">Subject</dt>
                        <dd className="font-medium text-ink-700 dark:text-ink-200">{session.subject}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-ink-400">Difficulty</dt>
                        <dd className="font-medium text-ink-700 dark:text-ink-200">{session.difficulty}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-ink-400">Day</dt>
                        <dd className="font-medium text-ink-700 dark:text-ink-200">Day {session.day}</dd>
                      </div>
                    </dl>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
