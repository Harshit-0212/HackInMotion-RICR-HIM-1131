/**
 * StageCheckpoint.tsx — Graded Checkpoint Assessment page.
 *
 * Requirements:
 * - Knowledge questions (MCQ/True-False)
 * - Coding tasks
 * - Shows pass criteria upfront
 * - Answers saved safely across refresh
 * - Post-submission verdict, score breakdown, recovery guidance, and weak skill mapping
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code,
  FileCheck,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { journeyService } from '@/services/journeyService';
import type {
  Stage,
  CheckpointAttempt,
  GradedAttempt,
  KnowledgeQuestion,
} from '@/types/journey';

export function StageCheckpoint() {
  const { journeySlug, stageSlug } = useParams<{ journeySlug: string; stageSlug: string }>();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage | null>(null);
  const [attempt, setAttempt] = useState<CheckpointAttempt | null>(null);
  const [gradedResult, setGradedResult] = useState<GradedAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save debouncing
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initCheckpoint = useCallback(async () => {
    if (!stageSlug) return;
    setLoading(true);
    setError(null);
    try {
      const s = await journeyService.getStage(stageSlug);
      setStage(s);

      const att = await journeyService.startCheckpoint(stageSlug);
      setAttempt(att);
      setAnswers(att.knowledgeAnswers || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkpoint.');
    } finally {
      setLoading(false);
    }
  }, [stageSlug]);

  useEffect(() => {
    initCheckpoint();
  }, [initCheckpoint]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (gradedResult || !attempt) return;
    const nextAnswers = { ...answers, [questionId]: optionId };
    setAnswers(nextAnswers);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      journeyService.saveCheckpointProgress(attempt.id, nextAnswers).catch(() => {});
    }, 600);
  };

  const handleSubmit = async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      const result = await journeyService.submitCheckpoint(attempt.id, answers);
      setGradedResult(result);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout focusMode>
        <div className="h-screen flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#6542C5]" />
          <p className="text-sm text-ink-500">Preparing checkpoint assessment…</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !stage || !attempt) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto p-8 text-center space-y-4">
          <ShieldAlert size={40} className="text-error-500 mx-auto" />
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">Checkpoint Unavailable</h2>
          <p className="text-sm text-ink-500">{error || 'Could not initialize checkpoint.'}</p>
          <div className="pt-2">
            <Link to={`/app/journey/${journeySlug}/stage/${stageSlug}`}>
              <Button variant="outline">Back to Stage</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const questions = attempt.knowledgeQuestions;
  const currentQ: KnowledgeQuestion | undefined = questions[currentIdx];
  const allAnswered = questions.every((q) => answers[q.id]);

  // If already graded or just submitted
  if (gradedResult) {
    const isPassed = gradedResult.verdict === 'pass';
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6">
          <div
            className={`rounded-2xl border p-6 text-center space-y-3 ${
              isPassed
                ? 'bg-success-50 border-success-300 dark:bg-success-900/20 dark:border-success-700'
                : 'bg-error-50 border-error-300 dark:bg-error-900/20 dark:border-error-700'
            }`}
          >
            {isPassed ? (
              <CheckCircle2 size={48} className="text-success-600 dark:text-success-400 mx-auto" />
            ) : (
              <XCircle size={48} className="text-error-600 dark:text-error-400 mx-auto" />
            )}
            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">
              {isPassed ? 'Checkpoint Passed!' : 'Needs Review'}
            </h1>
            <p className="text-sm text-ink-600 dark:text-ink-300 max-w-md mx-auto">
              {isPassed
                ? 'Great job demonstrating mastery. The subsequent stage has unlocked.'
                : 'You did not meet the minimum pass requirements this time. Targeted review is recommended before retrying.'}
            </p>

            <div className="flex justify-center gap-6 pt-2">
              <div className="text-center">
                <span className="block text-2xl font-extrabold text-ink-900 dark:text-ink-50">
                  {gradedResult.knowledgeScore}%
                </span>
                <span className="text-xs text-ink-500">Knowledge Score (Pass: {attempt.blueprint.knowledgePassPercent}%)</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-extrabold text-ink-900 dark:text-ink-50">
                  {gradedResult.codingPassCount}/{attempt.codingTasks.length}
                </span>
                <span className="text-xs text-ink-500">Coding Tasks (Required: {attempt.blueprint.codingPassCount})</span>
              </div>
            </div>
          </div>

          {/* Identified Weak Skills */}
          {gradedResult.weakConceptTags.length > 0 && (
            <div className="rounded-2xl border border-warning-200 bg-warning-50/50 dark:border-warning-800 dark:bg-warning-900/10 p-5 space-y-2">
              <div className="flex items-center gap-2 text-warning-800 dark:text-warning-300 font-bold text-sm">
                <AlertTriangle size={16} />
                <span>Identified Focus Areas</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {gradedResult.weakConceptTags.map((tag) => (
                  <Badge key={tag} tone="warning">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Review Questions */}
          <div className="space-y-4 pt-4">
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Question Review</h2>
            {gradedResult.knowledgeQuestions.map((q, idx) => {
              const grade = gradedResult.knowledgeGrades.find((g) => g.questionId === q.id);
              const userAns = answers[q.id];
              return (
                <div
                  key={q.id}
                  className={`rounded-xl border p-4 space-y-3 ${
                    grade?.correct
                      ? 'border-success-200 bg-success-50/30 dark:border-success-900/50 dark:bg-success-950/10'
                      : 'border-error-200 bg-error-50/30 dark:border-error-900/50 dark:bg-error-950/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                      {idx + 1}. {q.prompt}
                    </p>
                    {grade?.correct ? (
                      <Badge tone="success">Correct</Badge>
                    ) : (
                      <Badge tone="error">Incorrect</Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 pl-2">
                    {q.options.map((opt) => {
                      const isSelected = userAns === opt.id;
                      const isCorrect = q.correctOptionId === opt.id;
                      let badge = null;
                      if (isCorrect) badge = '✓ Correct';
                      else if (isSelected) badge = '✗ Your answer';

                      return (
                        <div
                          key={opt.id}
                          className={`text-xs p-2 rounded-lg flex items-center justify-between ${
                            isCorrect
                              ? 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-200 font-medium'
                              : isSelected
                                ? 'bg-error-100 text-error-800 dark:bg-error-900/40 dark:text-error-200'
                                : 'text-ink-600 dark:text-ink-400'
                          }`}
                        >
                          <span>{opt.text}</span>
                          {badge && <span className="font-bold text-[10px]">{badge}</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="text-xs bg-white/70 dark:bg-ink-900/70 p-3 rounded-lg border border-ink-100 dark:border-ink-800 text-ink-600 dark:text-ink-300">
                      <span className="font-bold block mb-0.5">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-ink-200 dark:border-ink-800">
            <Link to={`/app/journey/${journeySlug}`}>
              <Button variant="outline">
                <BookOpen size={16} /> Return to Map
              </Button>
            </Link>

            {isPassed ? (
              <Button onClick={() => navigate(`/app/journey/${journeySlug}`)}>
                Continue Journey <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={() => navigate(`/app/journey/${journeySlug}/stage/${stageSlug}`)}>
                <RotateCcw size={16} /> Review Stage Activities
              </Button>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout focusMode>
      <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0B1220]">
        {/* Top Header */}
        <header className="h-14 border-b border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Link
              to={`/app/journey/${journeySlug}/stage/${stageSlug}`}
              className="text-xs text-ink-500 hover:text-ink-700 flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Exit
            </Link>
            <div className="h-4 w-px bg-ink-200 dark:bg-ink-700" />
            <span className="text-sm font-bold text-ink-900 dark:text-ink-50 truncate max-w-xs sm:max-w-md">
              Checkpoint: {stage.title}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-ink-500">
            <span>
              Pass criteria: ≥{stage.checkpoint.knowledgePassPercent}% knowledge & {stage.checkpoint.codingPassCount}/{stage.checkpoint.codingTaskCount} code
            </span>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
          <div className="max-w-2xl w-full space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-xs font-semibold text-ink-500">
              <span>
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span>
                {Object.keys(answers).length}/{questions.length} answered
              </span>
            </div>

            <div className="h-1.5 w-full bg-ink-200 dark:bg-ink-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6542C5] transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question card */}
            {currentQ && (
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl p-6 shadow-soft space-y-5"
              >
                <div>
                  <Badge tone="primary" className="mb-2">
                    {currentQ.difficulty}
                  </Badge>
                  <h3 className="text-base sm:text-lg font-bold text-ink-900 dark:text-ink-50 leading-relaxed">
                    {currentQ.prompt}
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {currentQ.options.map((opt) => {
                    const isSelected = answers[currentQ.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQ.id, opt.id)}
                        className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all duration-150 flex items-center justify-between ${
                          isSelected
                            ? 'border-[#6542C5] bg-primary-50/50 text-primary-900 dark:bg-primary-900/20 dark:text-primary-100 ring-2 ring-primary-500/20'
                            : 'border-ink-200 hover:border-ink-300 dark:border-ink-800 dark:hover:border-ink-700 text-ink-800 dark:text-ink-200'
                        }`}
                      >
                        <span>{opt.text}</span>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-primary-600 bg-[#6542C5] text-white'
                              : 'border-ink-300 dark:border-ink-600'
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Coding tasks notice */}
            {attempt.codingTasks.length > 0 && (
              <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Code size={16} className="text-[#6542C5]" />
                  <span className="font-semibold text-ink-800 dark:text-ink-200">
                    Coding Challenge required: {attempt.codingTasks.map((t) => t.title).join(', ')}
                  </span>
                </div>
                <span className="text-ink-500">Judged via verified testcases</span>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
              >
                <ChevronLeft size={16} /> Previous
              </Button>

              {currentIdx < questions.length - 1 ? (
                <Button size="sm" onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}>
                  Next <ChevronRight size={16} />
                </Button>
              ) : (
                <Button size="sm" onClick={handleSubmit} loading={submitting} disabled={!allAnswered}>
                  Submit Checkpoint <FileCheck size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

