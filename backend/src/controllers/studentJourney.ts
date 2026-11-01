/**
 * Student journey controller — read-only journey/stage/activity access,
 * checkpoint attempt lifecycle, and activity completion recording.
 *
 * ALL progression state is computed server-side. Client cannot forge unlocks.
 */
import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import {
  journeyStore,
  stageStore,
  activityStore,
  knowledgeQuestionStore,
  checkpointAttemptStore,
  studentProgressStore,
  recomputeStageStates,
  newAttemptId,
} from '../lib/journeyStore.js';
import { codingProblemStore } from '../lib/codingStore.js';
import { executeCodeSync } from '../lib/codeExecution.js';
import type {
  PublicJourney,
  PublicStage,
  PublicActivity,
  PublicKnowledgeQuestion,
  PublicCheckpointAttempt,
  GradedCheckpointAttempt,
  PublicStudentProgress,
  AttemptKnowledgeQuestion,
  AttemptCodingTask,
  KnowledgeGradeItem,
  CodingGradeItem,
  StoredCheckpointAttempt,
} from '../types/journey.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

function toPublicJourney(j: Awaited<ReturnType<typeof journeyStore.findById>>): PublicJourney | null {
  if (!j) return null;
  return {
    id: j._id,
    slug: j.slug,
    title: j.title,
    description: j.description,
    stageIds: j.stageIds,
    milestoneStageIds: j.milestoneStageIds,
    totalStages: j.stageIds.length,
  };
}

function toPublicStage(s: Awaited<ReturnType<typeof stageStore.findById>>): PublicStage | null {
  if (!s) return null;
  return {
    id: s._id,
    journeyId: s.journeyId,
    slug: s.slug,
    title: s.title,
    learningGoal: s.learningGoal,
    type: s.type,
    prerequisiteStageIds: s.prerequisiteStageIds,
    activityIds: s.activityIds,
    topicTags: s.topicTags,
    checkpoint: {
      knowledgeQuestionCount: s.checkpoint.knowledgeQuestionCount,
      codingTaskCount: s.checkpoint.codingTaskCount,
      knowledgePassPercent: s.checkpoint.knowledgePassPercent,
      codingPassCount: s.checkpoint.codingPassCount,
    },
    previewUnlocked: s.previewUnlocked,
  };
}

function toPublicActivity(a: Awaited<ReturnType<typeof activityStore.findById>>): PublicActivity | null {
  if (!a) return null;
  const pub: PublicActivity = {
    id: a._id,
    stageId: a.stageId,
    title: a.title,
    type: a.type,
    isRequired: a.isRequired,
    order: a.order,
  };
  if (a.lessonContent) {
    pub.lessonContent = {
      body: a.lessonContent.body,
      hints: a.lessonContent.hints,
    };
  }
  if (a.comprehensionContent) {
    pub.comprehensionContent = {
      language: a.comprehensionContent.language,
      codeSnippet: a.comprehensionContent.codeSnippet,
      prompt: a.comprehensionContent.prompt,
      explanation: '', // withheld until after submission
      relevance: a.comprehensionContent.relevance,
      // expectedOutput withheld; codingProblemId visible
      codingProblemId: a.comprehensionContent.codingProblemId,
    };
  }
  if (a.codingProblemId) {
    pub.codingProblemId = a.codingProblemId;
  }
  return pub;
}

function toPublicQuestion(q: {
  _id: string;
  type: 'mcq' | 'true_false';
  prompt: string;
  options: { id: string; text: string }[];
  difficulty: 'easy' | 'medium' | 'hard';
  conceptTags: string[];
}): PublicKnowledgeQuestion {
  return {
    id: q._id,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
    difficulty: q.difficulty,
    conceptTags: q.conceptTags,
  };
}

function toPublicAttempt(a: StoredCheckpointAttempt): PublicCheckpointAttempt {
  return {
    id: a._id,
    stageId: a.stageId,
    journeyId: a.journeyId,
    status: a.status,
    knowledgeQuestions: a.knowledgeQuestions.map((q) => ({
      id: q.questionId,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      difficulty: q.difficulty,
      conceptTags: q.conceptTags,
      // correctOptionId and explanation are NOT included
    })),
    codingTasks: a.codingTasks,
    blueprint: a.blueprint,
    knowledgeAnswers: a.knowledgeAnswers,
    codingResults: a.codingResults,
    attemptNumber: a.attemptNumber,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
  };
}

// ─── controller ───────────────────────────────────────────────────────────────

export const studentJourneyController = {
  // ── Journey listing / detail ───────────────────────────────────────────────

  async listJourneys(req: AuthedRequest, res: Response): Promise<void> {
    const journeys = await journeyStore.listPublished();
    res.json({ data: journeys.map(toPublicJourney).filter(Boolean) });
  },

  async getJourney(req: AuthedRequest, res: Response): Promise<void> {
    const { slug } = req.params;
    const journey = await journeyStore.findBySlug(slug);
    if (!journey || journey.status !== 'published') {
      res.status(404).json({ error: { message: 'Journey not found.' } });
      return;
    }
    res.json({ data: toPublicJourney(journey) });
  },

  // ── Stages for a journey ──────────────────────────────────────────────────

  async listStages(req: AuthedRequest, res: Response): Promise<void> {
    const { journeySlug } = req.params;
    const journey = await journeyStore.findBySlug(journeySlug);
    if (!journey || journey.status !== 'published') {
      res.status(404).json({ error: { message: 'Journey not found.' } });
      return;
    }
    const stages = await stageStore.listByJourney(journey._id, true);
    res.json({ data: stages.map(toPublicStage).filter(Boolean) });
  },

  async getStage(req: AuthedRequest, res: Response): Promise<void> {
    const { stageSlug } = req.params;
    const stage = await stageStore.findBySlug(stageSlug);
    if (!stage || stage.status !== 'published') {
      res.status(404).json({ error: { message: 'Stage not found.' } });
      return;
    }
    res.json({ data: toPublicStage(stage) });
  },

  // ── Activities ─────────────────────────────────────────────────────────────

  async listActivities(req: AuthedRequest, res: Response): Promise<void> {
    const { stageSlug } = req.params;
    const stage = await stageStore.findBySlug(stageSlug);
    if (!stage || stage.status !== 'published') {
      res.status(404).json({ error: { message: 'Stage not found.' } });
      return;
    }
    const activities = await activityStore.listByStage(stage._id, true);
    res.json({ data: activities.map(toPublicActivity).filter(Boolean) });
  },

  async getActivity(req: AuthedRequest, res: Response): Promise<void> {
    const { activityId } = req.params;
    const activity = await activityStore.findById(activityId);
    if (!activity || activity.status !== 'published') {
      res.status(404).json({ error: { message: 'Activity not found.' } });
      return;
    }
    res.json({ data: toPublicActivity(activity) });
  },

  // ── Record activity completion (idempotent) ────────────────────────────────

  async completeActivity(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { activityId } = req.params;
    const activity = await activityStore.findById(activityId);
    if (!activity || activity.status !== 'published') {
      res.status(404).json({ error: { message: 'Activity not found.' } });
      return;
    }

    // Ensure progress record exists
    const journey = await journeyStore.findById(activity.journeyId);
    if (!journey) {
      res.status(404).json({ error: { message: 'Journey not found.' } });
      return;
    }
    const firstStageId = journey.stageIds[0] ?? '';
    await studentProgressStore.findOrCreate(userId, journey._id, 'available', firstStageId);
    await studentProgressStore.recordActivityCompletion(userId, journey._id, activityId);

    res.json({ data: { recorded: true } });
  },

  // ── Student progress ───────────────────────────────────────────────────────

  async getProgress(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { journeySlug } = req.params;
    const journey = await journeyStore.findBySlug(journeySlug);
    if (!journey || journey.status !== 'published') {
      res.status(404).json({ error: { message: 'Journey not found.' } });
      return;
    }

    const stages = await stageStore.listByJourney(journey._id, true);
    const firstStageId = stages[0]?._id ?? '';
    const progress = await studentProgressStore.findOrCreate(userId, journey._id, 'available', firstStageId);

    // Recompute stage states from attempt history (server-side, tamper-proof)
    const computed = await recomputeStageStates(userId, journey._id, stages);

    // Persist the computed states (idempotent)
    await studentProgressStore.updateStageStates(userId, journey._id, computed);

    const pub: PublicStudentProgress = {
      journeyId: journey._id,
      stageStates: computed,
      completedActivities: progress.completedActivities,
      solvedCodingProblems: progress.solvedCodingProblems,
      lastActiveAt: progress.lastActiveAt,
    };
    res.json({ data: pub });
  },

  // ── Checkpoint attempt — start ─────────────────────────────────────────────

  async startCheckpoint(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { stageSlug } = req.params;

    const stage = await stageStore.findBySlug(stageSlug);
    if (!stage || stage.status !== 'published') {
      res.status(404).json({ error: { message: 'Stage not found.' } });
      return;
    }

    // Ensure student has a progress record and check lock state
    const journey = await journeyStore.findById(stage.journeyId);
    if (!journey) {
      res.status(404).json({ error: { message: 'Journey not found.' } });
      return;
    }

    const stages = await stageStore.listByJourney(journey._id, true);
    const firstStageId = stages[0]?._id ?? '';
    await studentProgressStore.findOrCreate(userId, journey._id, 'available', firstStageId);

    const stageStates = await recomputeStageStates(userId, journey._id, stages);
    const state = stageStates[stage._id];

    if (state === 'locked') {
      const missingPrereqs = stage.prerequisiteStageIds.filter((pid) => stageStates[pid] !== 'passed');
      const missingNames = await Promise.all(
        missingPrereqs.map(async (pid) => {
          const s = await stageStore.findById(pid);
          return s?.title ?? pid;
        }),
      );
      res.status(403).json({
        error: {
          message: `This stage is locked. Complete the following stages first: ${missingNames.join(', ')}.`,
          missingPrerequisites: missingPrereqs,
        },
      });
      return;
    }

    if (state === 'passed') {
      res.status(409).json({ error: { message: 'You have already passed this checkpoint.' } });
      return;
    }

    // Check for an existing in-progress attempt
    const existing = await checkpointAttemptStore.findActiveAttempt(userId, stage._id);
    if (existing) {
      res.json({ data: toPublicAttempt(existing) });
      return;
    }

    // Validate that sufficient approved questions exist
    const approvedCount = await knowledgeQuestionStore.countApprovedByStage(stage._id);
    const { knowledgeQuestionCount, codingTaskCount, minKnowledgeQuestions, minCodingTasks } =
      stage.checkpoint;

    if (approvedCount < minKnowledgeQuestions) {
      res.status(409).json({
        error: {
          message: `This checkpoint does not have sufficient approved questions yet (${approvedCount} approved, ${minKnowledgeQuestions} required). Please contact your instructor.`,
          approvedCount,
          required: minKnowledgeQuestions,
        },
      });
      return;
    }

    // Sample questions
    const sampledQuestions = await knowledgeQuestionStore.sampleForCheckpoint(
      stage._id,
      knowledgeQuestionCount,
    );

    // Sample coding tasks from practice activities
    const activities = await activityStore.listByStage(stage._id, true);
    const codingActivities = activities.filter((a) => a.type === 'coding_practice' && a.codingProblemId);

    if (codingActivities.length < minCodingTasks) {
      res.status(409).json({
        error: {
          message: `This checkpoint does not have sufficient coding tasks (${codingActivities.length} available, ${minCodingTasks} required).`,
        },
      });
      return;
    }

    const sampledCodingActivities = codingActivities
      .sort(() => Math.random() - 0.5)
      .slice(0, codingTaskCount);

    const codingTasks: AttemptCodingTask[] = [];
    for (const act of sampledCodingActivities) {
      const prob = await codingProblemStore.findById(act.codingProblemId!);
      if (prob && prob.status === 'published') {
        codingTasks.push({
          codingProblemId: prob._id,
          problemSlug: prob.slug,
          title: prob.title,
          difficulty: prob.difficulty,
        });
      }
    }

    const attemptNumber = (await checkpointAttemptStore.countAttempts(userId, stage._id)) + 1;
    const now = new Date().toISOString();

    const attemptKnowledgeQuestions: AttemptKnowledgeQuestion[] = sampledQuestions.map((q) => ({
      questionId: q._id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
      conceptTags: q.conceptTags,
      difficulty: q.difficulty,
    }));

    const attempt: StoredCheckpointAttempt = {
      _id: newAttemptId(),
      userId,
      stageId: stage._id,
      journeyId: journey._id,
      stageContentVersion: stage.contentVersion,
      policyVersion: 1,
      knowledgeQuestions: attemptKnowledgeQuestions,
      codingTasks,
      blueprint: stage.checkpoint,
      status: 'in_progress',
      knowledgeAnswers: {},
      codingResults: [],
      knowledgeGrades: [],
      attemptNumber,
      startedAt: now,
    };

    await checkpointAttemptStore.create(attempt);
    res.status(201).json({ data: toPublicAttempt(attempt) });
  },

  // ── Checkpoint attempt — save progress (idempotent) ───────────────────────

  async saveCheckpointProgress(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { attemptId } = req.params;
    const { knowledgeAnswers } = req.body ?? {};

    const attempt = await checkpointAttemptStore.findById(attemptId);
    if (!attempt || attempt.userId !== userId) {
      res.status(404).json({ error: { message: 'Attempt not found.' } });
      return;
    }
    if (attempt.status !== 'in_progress') {
      res.status(409).json({ error: { message: 'This attempt has already been submitted.' } });
      return;
    }

    const validAnswers: Record<string, string> = {};
    if (knowledgeAnswers && typeof knowledgeAnswers === 'object') {
      const validIds = new Set(attempt.knowledgeQuestions.map((q) => q.questionId));
      for (const [qid, optId] of Object.entries(knowledgeAnswers)) {
        if (validIds.has(qid) && typeof optId === 'string') {
          validAnswers[qid] = optId;
        }
      }
    }

    await checkpointAttemptStore.saveAnswers(attemptId, validAnswers);
    res.json({ data: { saved: true } });
  },

  // ── Checkpoint attempt — submit and grade ─────────────────────────────────

  async submitCheckpoint(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { attemptId } = req.params;
    const { knowledgeAnswers } = req.body ?? {};

    const attempt = await checkpointAttemptStore.findById(attemptId);
    if (!attempt || attempt.userId !== userId) {
      res.status(404).json({ error: { message: 'Attempt not found.' } });
      return;
    }
    if (attempt.status === 'graded') {
      // Idempotent: return the graded result again
      const stage = await stageStore.findById(attempt.stageId);
      if (!stage) { res.status(404).json({ error: { message: 'Stage not found.' } }); return; }
      res.json({ data: buildGradedResponse(attempt, stage) });
      return;
    }
    if (attempt.status !== 'in_progress') {
      res.status(409).json({ error: { message: 'This attempt is not in progress.' } });
      return;
    }

    // Merge any final answers
    const finalAnswers: Record<string, string> = { ...attempt.knowledgeAnswers };
    if (knowledgeAnswers && typeof knowledgeAnswers === 'object') {
      const validIds = new Set(attempt.knowledgeQuestions.map((q) => q.questionId));
      for (const [qid, optId] of Object.entries(knowledgeAnswers)) {
        if (validIds.has(qid) && typeof optId === 'string') {
          finalAnswers[qid] = optId as string;
        }
      }
    }

    // Grade knowledge questions
    const knowledgeGrades: KnowledgeGradeItem[] = attempt.knowledgeQuestions.map((q) => ({
      questionId: q.questionId,
      selectedOptionId: finalAnswers[q.questionId] ?? null,
      correct: (finalAnswers[q.questionId] ?? null) === q.correctOptionId,
      conceptTags: q.conceptTags,
    }));

    const correctCount = knowledgeGrades.filter((g) => g.correct).length;
    const totalKnowledge = attempt.knowledgeQuestions.length;
    const knowledgeScore = totalKnowledge > 0 ? Math.round((correctCount / totalKnowledge) * 100) : 0;

    // For coding tasks: use results already recorded (from POST /judge/:attemptId/:problemSlug)
    // Any tasks not yet judged count as not-passed.
    const codingResults = attempt.codingResults;
    const codingPassCount = codingResults.filter((r) => r.passed).length;

    // Determine overall verdict
    const blueprint = attempt.blueprint;
    const knowledgePassed = knowledgeScore >= blueprint.knowledgePassPercent;
    const codingPassed = codingPassCount >= blueprint.codingPassCount;
    const verdict = knowledgePassed && codingPassed ? 'pass' : 'fail';

    const now = new Date().toISOString();

    const updated = await checkpointAttemptStore.update(attemptId, {
      status: 'graded',
      knowledgeAnswers: finalAnswers,
      knowledgeGrades,
      knowledgeScore,
      codingPassCount,
      verdict,
      submittedAt: now,
      gradedAt: now,
    });

    if (!updated) {
      res.status(500).json({ error: { message: 'Grading failed. Please try again.' } });
      return;
    }

    // Recompute and persist stage states
    const journey = await journeyStore.findById(attempt.journeyId);
    if (journey) {
      const stages = await stageStore.listByJourney(journey._id, true);
      const newStates = await recomputeStageStates(userId, journey._id, stages);
      await studentProgressStore.updateStageStates(userId, journey._id, newStates);
    }

    const stage = await stageStore.findById(attempt.stageId);
    if (!stage) { res.status(404).json({ error: { message: 'Stage not found.' } }); return; }
    res.json({ data: buildGradedResponse(updated, stage) });
  },

  // ── Judge a coding task within an attempt ─────────────────────────────────

  async judgeCheckpointCodingTask(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { attemptId, problemId } = req.params;
    const { language, code } = req.body ?? {};

    if (!language || !code) {
      res.status(400).json({ error: { message: 'Language and code are required.' } });
      return;
    }

    const attempt = await checkpointAttemptStore.findById(attemptId);
    if (!attempt || attempt.userId !== userId) {
      res.status(404).json({ error: { message: 'Attempt not found.' } });
      return;
    }
    if (attempt.status !== 'in_progress') {
      res.status(409).json({ error: { message: 'This attempt is no longer in progress.' } });
      return;
    }

    // Verify the problem is part of this attempt
    const task = attempt.codingTasks.find((t) => t.codingProblemId === problemId);
    if (!task) {
      res.status(403).json({ error: { message: 'This problem is not part of your current attempt.' } });
      return;
    }

    // Fetch hidden test cases (not exposed to client)
    const hiddenCases = await codingProblemStore.listTestCases(problemId, 'hidden');
    const sampleCases = await codingProblemStore.listTestCases(problemId, 'sample');
    const allCases = [...sampleCases, ...hiddenCases];

    if (allCases.length === 0) {
      res.status(409).json({
        error: { message: 'No test cases are configured for this problem yet.' },
      });
      return;
    }

    // Run all test cases
    let allPassed = true;
    const caseResults: { caseKey: string; passed: boolean; visible: boolean }[] = [];

    for (const tc of allCases) {
      try {
        const result = await executeCodeSync({ language, code, input: tc.input });
        const actual = (result.output ?? '').trimEnd();
        const expected = tc.expectedOutput.trimEnd();
        const passed = actual === expected && result.status === 'success';
        if (!passed) allPassed = false;
        caseResults.push({ caseKey: tc.caseKey, passed, visible: tc.visibility === 'sample' });
      } catch {
        allPassed = false;
        caseResults.push({ caseKey: tc.caseKey, passed: false, visible: tc.visibility === 'sample' });
      }
    }

    const verdict = allPassed ? 'accepted' : 'wrong_answer';
    const newResult: CodingGradeItem = {
      codingProblemId: problemId,
      passed: allPassed,
      verdict,
    };

    // Replace any previous result for this problem
    const updatedResults = [
      ...attempt.codingResults.filter((r) => r.codingProblemId !== problemId),
      newResult,
    ];

    await checkpointAttemptStore.update(attemptId, { codingResults: updatedResults });

    // Return only sample case results; hidden case details are not revealed
    res.json({
      data: {
        verdict,
        passed: allPassed,
        sampleResults: caseResults.filter((r) => r.visible),
        hiddenPassCount: caseResults.filter((r) => !r.visible && r.passed).length,
        hiddenTotal: caseResults.filter((r) => !r.visible).length,
      },
    });
  },

  // ── Submit a practice coding problem for journey solve credit ─────────────

  async submitPracticeCodingProblem(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { problemSlug, journeySlug } = req.params;
    const { language, code } = req.body ?? {};

    if (!language || !code) {
      res.status(400).json({ error: { message: 'Language and code are required.' } });
      return;
    }

    const problem = await codingProblemStore.findPublishedBySlug(problemSlug);
    if (!problem) {
      res.status(404).json({ error: { message: 'Problem not found.' } });
      return;
    }

    const journey = await journeyStore.findBySlug(journeySlug);
    if (!journey || journey.status !== 'published') {
      res.status(404).json({ error: { message: 'Journey not found.' } });
      return;
    }

    const allCases = await codingProblemStore.listTestCases(problem._id);
    if (allCases.length === 0) {
      res.status(409).json({ error: { message: 'No test cases configured for this problem.' } });
      return;
    }

    let allPassed = true;
    const sampleResults: { caseKey: string; passed: boolean; actualOutput: string; expectedOutput: string }[] = [];

    for (const tc of allCases) {
      try {
        const result = await executeCodeSync({ language, code, input: tc.input });
        const actual = (result.output ?? '').trimEnd();
        const expected = tc.expectedOutput.trimEnd();
        const passed = actual === expected && result.status === 'success';
        if (!passed) allPassed = false;
        if (tc.visibility === 'sample') {
          sampleResults.push({ caseKey: tc.caseKey, passed, actualOutput: actual, expectedOutput: expected });
        }
      } catch {
        allPassed = false;
      }
    }

    if (allPassed) {
      await studentProgressStore.recordCodingSolve(userId, journey._id, problem._id, 'accepted');
    }

    res.json({
      data: {
        verdict: allPassed ? 'accepted' : 'wrong_answer',
        passed: allPassed,
        sampleResults,
      },
    });
  },

  // ── Comprehension answer — reveal explanation after submission ─────────────

  async submitComprehensionAnswer(req: AuthedRequest, res: Response): Promise<void> {
    const { activityId } = req.params;
    const userId = req.userId!;
    const { answer } = req.body ?? {};

    const activity = await activityStore.findById(activityId);
    if (!activity || activity.status !== 'published' || !activity.comprehensionContent) {
      res.status(404).json({ error: { message: 'Activity not found.' } });
      return;
    }

    const cc = activity.comprehensionContent;
    const isObjectiveGraded = !!cc.reviewedAnswer || !!cc.expectedOutput;

    let correct: boolean | null = null;
    if (isObjectiveGraded) {
      const expected = (cc.reviewedAnswer ?? cc.expectedOutput ?? '').trim();
      correct = (answer ?? '').trim().toLowerCase() === expected.toLowerCase();
    }

    // Record completion (idempotent)
    await studentProgressStore.recordActivityCompletion(userId, activity.journeyId, activityId);

    res.json({
      data: {
        correct,
        explanation: cc.explanation,
        reviewedAnswer: cc.reviewedAnswer ?? cc.expectedOutput,
        relevance: cc.relevance,
      },
    });
  },
};

// ─── Build graded response (no private answer leakage) ───────────────────────

function buildGradedResponse(
  attempt: StoredCheckpointAttempt,
  stage: Awaited<ReturnType<typeof stageStore.findById>>,
): GradedCheckpointAttempt {
  const weakConceptTags = Array.from(
    new Set(
      (attempt.knowledgeGrades ?? [])
        .filter((g) => !g.correct)
        .flatMap((g) => g.conceptTags),
    ),
  );

  return {
    id: attempt._id,
    stageId: attempt.stageId,
    journeyId: attempt.journeyId,
    status: attempt.status,
    verdict: attempt.verdict!,
    knowledgeScore: attempt.knowledgeScore ?? 0,
    codingPassCount: attempt.codingPassCount ?? 0,
    blueprint: attempt.blueprint,
    knowledgeQuestions: attempt.knowledgeQuestions.map((q) => ({
      id: q.questionId,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      difficulty: q.difficulty,
      conceptTags: q.conceptTags,
      correctOptionId: q.correctOptionId!, // revealed post-submission
      explanation: q.explanation!,
    })),
    knowledgeGrades: attempt.knowledgeGrades ?? [],
    codingTasks: attempt.codingTasks,
    codingResults: attempt.codingResults,
    weakConceptTags,
    attemptNumber: attempt.attemptNumber,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    gradedAt: attempt.gradedAt,
  };
}

