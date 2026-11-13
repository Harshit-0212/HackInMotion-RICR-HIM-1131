import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { taxonomyStore } from '../lib/taxonomyStore.js';
import { questionBankStore, type QuestionStatus, type QuestionType, type QuestionDifficulty } from '../lib/questionBankStore.js';
import { runBulkQuestionGeneration } from '../lib/bulkQuestionGenerator.js';

export const adminTaxonomyController = {
  async getTaxonomy(_req: AuthedRequest, res: Response): Promise<void> {
    try {
      const taxonomy = await taxonomyStore.getAll();
      res.json({ data: taxonomy });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch taxonomy.';
      res.status(500).json({ error: { message } });
    }
  },

  async addField(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const { name, category } = req.body;
      if (!name) {
        res.status(400).json({ error: { message: 'Field name is required.' } });
        return;
      }
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const doc = await taxonomyStore.addField({
        id: `field_${Date.now()}`,
        name,
        slug,
        category: category || 'Normal',
        subjects: [],
      });
      res.status(201).json({ data: doc });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add field.';
      res.status(500).json({ error: { message } });
    }
  },

  async addSubject(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const { fieldId } = req.params;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { message: 'Subject name is required.' } });
        return;
      }
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const subject = {
        id: `sub_${Date.now()}`,
        name,
        slug,
        topics: [],
      };
      await taxonomyStore.addSubject(fieldId, subject);
      res.status(201).json({ data: subject });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add subject.';
      res.status(500).json({ error: { message } });
    }
  },

  async addTopic(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const { fieldId, subjectId } = req.params;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { message: 'Topic name is required.' } });
        return;
      }
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const topic = {
        id: `top_${Date.now()}`,
        name,
        slug,
      };
      await taxonomyStore.addTopic(fieldId, subjectId, topic);
      res.status(201).json({ data: topic });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add topic.';
      res.status(500).json({ error: { message } });
    }
  },

  // Bulk Generator Endpoint
  async generateBulk(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const {
      fieldId,
      fieldName,
      subjectId,
      subjectName,
      topicId,
      topicName,
      category,
      roleTarget,
      count,
      difficultyMix,
      questionTypes,
    } = req.body;

    if (!fieldId || !subjectId || !topicId) {
      res.status(400).json({ error: { message: 'fieldId, subjectId, and topicId are required.' } });
      return;
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Create background tracking job
    await questionBankStore.createJob({
      jobId: batchId,
      userId,
      fieldId,
      subjectId,
      topicId,
      totalRequested: count || 10,
      generatedCount: 0,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Run in background
    runBulkQuestionGeneration({
      userId,
      fieldId,
      fieldName: fieldName || 'Computer Science',
      subjectId,
      subjectName: subjectName || 'Core',
      topicId,
      topicName: topicName || 'General',
      category: category || 'Normal',
      roleTarget,
      count: count || 10,
      difficultyMix: difficultyMix || { easy: 30, medium: 50, hard: 20 },
      questionTypes: questionTypes || ['mcq'],
      batchId,
    }).catch((err) => {
      console.error('Bulk generation background error:', err);
      questionBankStore.updateJob(batchId, { status: 'failed', error: err.message });
    });

    res.json({
      data: {
        message: 'Bulk generation job started in background.',
        batchId,
      },
    });
  },

  async getJobStatus(req: AuthedRequest, res: Response): Promise<void> {
    const { jobId } = req.params;
    const job = await questionBankStore.getJob(jobId);
    if (!job) {
      res.status(404).json({ error: { message: 'Job not found.' } });
      return;
    }
    res.json({ data: job });
  },

  // Review & Question Bank Management
  async listQuestions(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const { status, fieldId, subjectId, topicId, type, difficulty, batchId, search, limit, skip } = req.query;
      const result = await questionBankStore.list({
        status: status as QuestionStatus,
        fieldId: fieldId as string,
        subjectId: subjectId as string,
        topicId: topicId as string,
        type: type as QuestionType,
        difficulty: difficulty as QuestionDifficulty,
        batchId: batchId as string,
        search: search as string,
        limit: limit ? Number(limit) : 50,
        skip: skip ? Number(skip) : 0,
      });
      res.json({ data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to list questions.';
      res.status(500).json({ error: { message } });
    }
  },

  async updateQuestionStatus(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses: QuestionStatus[] = ['draft', 'needs_review', 'approved', 'rejected', 'published'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: { message: 'Invalid status.' } });
        return;
      }
      await questionBankStore.update(id, { status });
      res.json({ data: { id, status } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update question.';
      res.status(500).json({ error: { message } });
    }
  },

  async bulkPublishBatch(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;
      const count = await questionBankStore.updateBatchStatus(batchId, 'published');
      res.json({ data: { publishedCount: count, batchId } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish batch.';
      res.status(500).json({ error: { message } });
    }
  },

  async undoBatch(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;
      const count = await questionBankStore.deleteBatch(batchId);
      res.json({ data: { deletedCount: count, batchId } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to undo batch.';
      res.status(500).json({ error: { message } });
    }
  },

  // Coverage Dashboard
  async getCoverageDashboard(_req: AuthedRequest, res: Response): Promise<void> {
    try {
      const stats = await questionBankStore.getCoverageStats();
      res.json({ data: stats });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch coverage stats.';
      res.status(500).json({ error: { message } });
    }
  },

  // Licensed import with NC/ND block
  async importQuestions(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const { questions, license, sourceName } = req.body;
      if (!Array.isArray(questions) || !license || !sourceName) {
        res.status(400).json({
          error: { message: 'questions array, license, and sourceName are strictly required.' },
        });
        return;
      }

      // Block NC (Non-Commercial) or ND (No-Derivatives) licenses
      const upperLicense = license.toUpperCase();
      if (upperLicense.includes('NC') || upperLicense.includes('ND')) {
        res.status(403).json({
          error: {
            message: 'Import blocked: Non-Commercial (NC) and No-Derivatives (ND) licensed materials cannot be ingested.',
          },
        });
        return;
      }

      const formattedDocs: any[] = questions.map((q: any) => ({
        id: `qb_import_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fieldId: q.fieldId || 'cs',
        fieldName: q.fieldName || 'Computer Science',
        subjectId: q.subjectId || 'core',
        subjectName: q.subjectName || 'Core',
        topicId: q.topicId || 'general',
        topicName: q.topicName || 'General',
        category: 'Normal',
        type: q.type || 'mcq',
        difficulty: q.difficulty || 'medium',
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'Imported licensed question.',
        source: 'Licensed Import',
        license,
        modelName: sourceName,
        promptVersion: 'external-v1',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await questionBankStore.insertMany(formattedDocs);
      res.status(201).json({ data: { importedCount: formattedDocs.length } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed.';
      res.status(500).json({ error: { message } });
    }
  },
};

