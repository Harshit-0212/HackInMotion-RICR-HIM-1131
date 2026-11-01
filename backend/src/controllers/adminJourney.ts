/**
 * Admin journey controller — CRUD for journeys, stages, activities,
 * and knowledge questions. Enforces draft/review/publish workflow.
 */
import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import {
  journeyStore,
  stageStore,
  activityStore,
  knowledgeQuestionStore,
  newJourneyId,
  newStageId,
  newActivityId,
  newKnowledgeQuestionId,
  detectCycle,
} from '../lib/journeyStore.js';
import type {
  StoredJourney,
  StoredStage,
  StoredActivity,
  StoredKnowledgeQuestion,
} from '../types/journey.js';

export const adminJourneyController = {
  // ── Journeys ───────────────────────────────────────────────────────────────

  async listJourneys(_req: AuthedRequest, res: Response): Promise<void> {
    const journeys = await journeyStore.listAll();
    res.json({ data: journeys });
  },

  async createJourney(req: AuthedRequest, res: Response): Promise<void> {
    const { title, slug, description } = req.body ?? {};
    if (!title || !slug || !description) {
      res.status(400).json({ error: { message: 'title, slug, and description are required.' } });
      return;
    }
    const now = new Date().toISOString();
    const journey: StoredJourney = {
      _id: newJourneyId(),
      slug: slug.trim().toLowerCase(),
      title,
      description,
      stageIds: [],
      milestoneStageIds: [],
      status: 'draft',
      contentVersion: 1,
      createdBy: req.userId!,
      createdAt: now,
      updatedAt: now,
    };
    await journeyStore.create(journey);
    res.status(201).json({ data: journey });
  },

  async updateJourney(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { title, description, stageIds, milestoneStageIds, status } = req.body ?? {};
    const patch: Partial<StoredJourney> = {};
    if (title) patch.title = title;
    if (description) patch.description = description;
    if (stageIds) patch.stageIds = stageIds;
    if (milestoneStageIds) patch.milestoneStageIds = milestoneStageIds;
    if (status) patch.status = status;
    const updated = await journeyStore.update(id, patch);
    if (!updated) { res.status(404).json({ error: { message: 'Journey not found.' } }); return; }
    res.json({ data: updated });
  },

  // ── Stages ─────────────────────────────────────────────────────────────────

  async listStages(req: AuthedRequest, res: Response): Promise<void> {
    const { journeyId } = req.params;
    const stages = await stageStore.listByJourney(journeyId, false);
    res.json({ data: stages });
  },

  async createStage(req: AuthedRequest, res: Response): Promise<void> {
    const {
      journeyId, title, slug, learningGoal, type, prerequisiteStageIds,
      topicTags, checkpoint, previewUnlocked,
    } = req.body ?? {};

    if (!journeyId || !title || !slug) {
      res.status(400).json({ error: { message: 'journeyId, title, and slug are required.' } });
      return;
    }

    const now = new Date().toISOString();
    const stage: StoredStage = {
      _id: newStageId(),
      journeyId,
      slug: slug.trim().toLowerCase(),
      title,
      learningGoal: learningGoal ?? '',
      type: type ?? 'pattern',
      prerequisiteStageIds: prerequisiteStageIds ?? [],
      activityIds: [],
      topicTags: topicTags ?? [],
      checkpoint: {
        minKnowledgeQuestions: checkpoint?.minKnowledgeQuestions ?? 5,
        minCodingTasks: checkpoint?.minCodingTasks ?? 1,
        knowledgePassPercent: checkpoint?.knowledgePassPercent ?? 70,
        codingPassCount: checkpoint?.codingPassCount ?? 1,
        knowledgeQuestionCount: checkpoint?.knowledgeQuestionCount ?? 5,
        codingTaskCount: checkpoint?.codingTaskCount ?? 1,
      },
      previewUnlocked: previewUnlocked ?? false,
      status: 'draft',
      contentVersion: 1,
      createdBy: req.userId!,
      createdAt: now,
      updatedAt: now,
    };

    // Cycle check
    const existingStages = await stageStore.listByJourney(journeyId, false);
    const allForCheck = [...existingStages, stage].map((s) => ({
      _id: s._id,
      prerequisiteStageIds: s.prerequisiteStageIds,
    }));
    const cycle = detectCycle(allForCheck);
    if (cycle) {
      res.status(400).json({ error: { message: `Prerequisite cycle detected: ${cycle}` } });
      return;
    }

    await stageStore.create(stage);

    // Append to journey's stageIds
    const journey = await journeyStore.findById(journeyId);
    if (journey) {
      await journeyStore.update(journeyId, { stageIds: [...journey.stageIds, stage._id] });
    }

    res.status(201).json({ data: stage });
  },

  async updateStage(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { title, learningGoal, prerequisiteStageIds, topicTags, checkpoint, status, previewUnlocked } = req.body ?? {};
    const patch: Partial<StoredStage> = {};
    if (title) patch.title = title;
    if (learningGoal !== undefined) patch.learningGoal = learningGoal;
    if (prerequisiteStageIds) patch.prerequisiteStageIds = prerequisiteStageIds;
    if (topicTags) patch.topicTags = topicTags;
    if (checkpoint) patch.checkpoint = checkpoint;
    if (status) patch.status = status;
    if (previewUnlocked !== undefined) patch.previewUnlocked = previewUnlocked;

    const stage = await stageStore.findById(id);
    if (!stage) { res.status(404).json({ error: { message: 'Stage not found.' } }); return; }

    if (prerequisiteStageIds) {
      const allStages = await stageStore.listByJourney(stage.journeyId, false);
      const check = allStages.map((s) => ({
        _id: s._id,
        prerequisiteStageIds: s._id === id ? prerequisiteStageIds : s.prerequisiteStageIds,
      }));
      const cycle = detectCycle(check);
      if (cycle) {
        res.status(400).json({ error: { message: `Prerequisite cycle detected: ${cycle}` } });
        return;
      }
    }

    const updated = await stageStore.update(id, patch);
    if (!updated) { res.status(404).json({ error: { message: 'Stage not found.' } }); return; }
    res.json({ data: updated });
  },

  // ── Activities ─────────────────────────────────────────────────────────────

  async listActivities(req: AuthedRequest, res: Response): Promise<void> {
    const { stageId } = req.params;
    const activities = await activityStore.listByStage(stageId, false);
    res.json({ data: activities });
  },

  async createActivity(req: AuthedRequest, res: Response): Promise<void> {
    const {
      stageId, journeyId, title, type, lessonContent, comprehensionContent,
      codingProblemId, isRequired, order,
    } = req.body ?? {};

    if (!stageId || !journeyId || !title || !type) {
      res.status(400).json({ error: { message: 'stageId, journeyId, title, and type are required.' } });
      return;
    }

    const now = new Date().toISOString();
    const activity: StoredActivity = {
      _id: newActivityId(),
      stageId,
      journeyId,
      title,
      type,
      lessonContent,
      comprehensionContent,
      codingProblemId,
      isRequired: isRequired ?? true,
      order: order ?? 0,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    await activityStore.create(activity);

    // Append to stage's activityIds
    const stage = await stageStore.findById(stageId);
    if (stage) {
      await stageStore.update(stageId, { activityIds: [...stage.activityIds, activity._id] });
    }

    res.status(201).json({ data: activity });
  },

  async updateActivity(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { title, lessonContent, comprehensionContent, codingProblemId, isRequired, order, status } = req.body ?? {};
    const patch: Partial<StoredActivity> = {};
    if (title) patch.title = title;
    if (lessonContent !== undefined) patch.lessonContent = lessonContent;
    if (comprehensionContent !== undefined) patch.comprehensionContent = comprehensionContent;
    if (codingProblemId !== undefined) patch.codingProblemId = codingProblemId;
    if (isRequired !== undefined) patch.isRequired = isRequired;
    if (order !== undefined) patch.order = order;
    if (status) patch.status = status;
    const updated = await activityStore.update(id, patch);
    if (!updated) { res.status(404).json({ error: { message: 'Activity not found.' } }); return; }
    res.json({ data: updated });
  },

  // ── Knowledge questions ───────────────────────────────────────────────────

  async listQuestions(req: AuthedRequest, res: Response): Promise<void> {
    const { stageId } = req.params;
    const questions = await knowledgeQuestionStore.listByStage(stageId);
    res.json({ data: questions });
  },

  async createQuestion(req: AuthedRequest, res: Response): Promise<void> {
    const { stageId, journeyId, type, prompt, options, correctOptionId, explanation, difficulty, conceptTags } = req.body ?? {};

    if (!stageId || !journeyId || !type || !prompt || !options || !correctOptionId || !explanation) {
      res.status(400).json({ error: { message: 'stageId, journeyId, type, prompt, options, correctOptionId, and explanation are required.' } });
      return;
    }

    // Validate correctOptionId references a real option
    if (!options.find((o: { id: string }) => o.id === correctOptionId)) {
      res.status(400).json({ error: { message: 'correctOptionId must match an option id.' } });
      return;
    }

    const now = new Date().toISOString();
    const question: StoredKnowledgeQuestion = {
      _id: newKnowledgeQuestionId(),
      stageId,
      journeyId,
      type,
      prompt,
      options,
      correctOptionId,
      explanation,
      difficulty: difficulty ?? 'medium',
      conceptTags: conceptTags ?? [],
      status: 'draft',
      createdBy: req.userId!,
      createdAt: now,
      updatedAt: now,
    };
    await knowledgeQuestionStore.create(question);
    res.status(201).json({ data: question });
  },

  async updateQuestion(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { prompt, options, correctOptionId, explanation, difficulty, conceptTags, status } = req.body ?? {};
    const patch: Partial<StoredKnowledgeQuestion> = {};
    if (prompt) patch.prompt = prompt;
    if (options) patch.options = options;
    if (correctOptionId) patch.correctOptionId = correctOptionId;
    if (explanation) patch.explanation = explanation;
    if (difficulty) patch.difficulty = difficulty;
    if (conceptTags) patch.conceptTags = conceptTags;
    if (status) patch.status = status;
    const updated = await knowledgeQuestionStore.update(id, patch);
    if (!updated) { res.status(404).json({ error: { message: 'Question not found.' } }); return; }
    res.json({ data: updated });
  },

  // ── Checkpoint inventory check ────────────────────────────────────────────

  async checkInventory(req: AuthedRequest, res: Response): Promise<void> {
    const { stageId } = req.params;
    const stage = await stageStore.findById(stageId);
    if (!stage) { res.status(404).json({ error: { message: 'Stage not found.' } }); return; }

    const approvedCount = await knowledgeQuestionStore.countApprovedByStage(stageId);
    const activities = await activityStore.listByStage(stageId, false);
    const codingCount = activities.filter((a) => a.type === 'coding_practice' && a.codingProblemId).length;

    const { minKnowledgeQuestions, minCodingTasks } = stage.checkpoint;
    const ready = approvedCount >= minKnowledgeQuestions && codingCount >= minCodingTasks;

    res.json({
      data: {
        ready,
        approvedKnowledgeQuestions: approvedCount,
        requiredKnowledgeQuestions: minKnowledgeQuestions,
        codingTasksAvailable: codingCount,
        requiredCodingTasks: minCodingTasks,
        issues: [
          ...( approvedCount < minKnowledgeQuestions ? [`Needs ${minKnowledgeQuestions - approvedCount} more approved knowledge questions.`] : []),
          ...( codingCount < minCodingTasks ? [`Needs ${minCodingTasks - codingCount} more coding practice activities.`] : []),
        ],
      },
    });
  },
};

