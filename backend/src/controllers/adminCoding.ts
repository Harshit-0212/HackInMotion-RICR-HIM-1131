import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import {
  codingProblemStore,
  newProblemId,
  newTestCaseId,
} from '../lib/codingStore.js';
import { generateCodingQuestionDraft } from '../lib/codingAi.js';
import { GeminiError } from '../lib/gemini.js';
import type {
  StoredCodingProblem,
  StoredCodingTestCase,
  CreateCodingProblemInput,
  UpdateCodingProblemInput,
  CreateTestCaseInput,
  UpdateTestCaseInput,
  UpdatePrivateContentInput,
  ReviewProblemInput,
  GenerateDraftInput,
  ProblemDifficulty,
  ProblemStatus,
  SupportedCodingLanguage,
} from '../types/coding.js';

const VALID_DIFFICULTIES: ReadonlySet<ProblemDifficulty> = new Set(['easy', 'medium', 'hard']);
const VALID_STATUSES: ReadonlySet<ProblemStatus> = new Set(['draft', 'reviewed', 'published', 'archived']);
const VALID_LANGUAGES: ReadonlySet<SupportedCodingLanguage> = new Set(['cpp', 'java', 'python']);

const DEFAULT_STARTER_CODE = {
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read input from stdin\n    // TODO: Implement solution\n    return 0;\n}\n',
  java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // TODO: Implement solution\n    }\n}\n',
  python: 'import sys\n\ndef main():\n    # TODO: Read from sys.stdin and implement solution\n    pass\n\nif __name__ == "__main__":\n    main()\n',
};

const DEFAULT_LIMITS = {
  timeLimitMs: 2000,
  memoryLimitMb: 256,
};

const DEFAULT_CHECKER_POLICY = {
  type: 'token' as const,
  ignoreTrailingWhitespace: true,
  trimNewlines: true,
  caseSensitive: true,
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const adminCodingController = {
  /**
   * POST /api/admin/coding/problems
   * Create a problem manually (draft)
   */
  async createProblem(req: AuthedRequest, res: Response): Promise<void> {
    const adminId = req.userId!;
    const body: CreateCodingProblemInput = req.body ?? {};

    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      res.status(400).json({ error: { message: 'Problem title is required.' } });
      return;
    }

    if (!body.difficulty || !VALID_DIFFICULTIES.has(body.difficulty)) {
      res.status(400).json({ error: { message: 'Valid difficulty (easy, medium, hard) is required.' } });
      return;
    }

    if (!body.topic || typeof body.topic !== 'string' || !body.topic.trim()) {
      res.status(400).json({ error: { message: 'Topic is required.' } });
      return;
    }

    const slug = (body.slug ? generateSlug(body.slug) : generateSlug(body.title)) || `problem-${Date.now()}`;
    const existingSlug = await codingProblemStore.findBySlug(slug);
    if (existingSlug) {
      res.status(409).json({ error: { message: `Slug '${slug}' is already in use by problem ${existingSlug._id}.` } });
      return;
    }

    const now = new Date().toISOString();
    const problem: StoredCodingProblem = {
      _id: newProblemId(),
      slug,
      title: body.title.trim(),
      difficulty: body.difficulty,
      topic: body.topic.trim(),
      tags: Array.isArray(body.tags) ? body.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      statement: typeof body.statement === 'string' ? body.statement : '',
      inputFormat: typeof body.inputFormat === 'string' ? body.inputFormat : '',
      outputFormat: typeof body.outputFormat === 'string' ? body.outputFormat : '',
      constraints: typeof body.constraints === 'string' ? body.constraints : '',
      supportedLanguages: Array.isArray(body.supportedLanguages) && body.supportedLanguages.length > 0
        ? body.supportedLanguages.filter((l) => VALID_LANGUAGES.has(l))
        : ['cpp', 'java', 'python'],
      starterCodeByLanguage: {
        cpp: body.starterCodeByLanguage?.cpp || DEFAULT_STARTER_CODE.cpp,
        java: body.starterCodeByLanguage?.java || DEFAULT_STARTER_CODE.java,
        python: body.starterCodeByLanguage?.python || DEFAULT_STARTER_CODE.python,
      },
      executionLimits: {
        timeLimitMs: Math.max(100, Math.min(10000, Number(body.executionLimits?.timeLimitMs) || DEFAULT_LIMITS.timeLimitMs)),
        memoryLimitMb: Math.max(32, Math.min(1024, Number(body.executionLimits?.memoryLimitMb) || DEFAULT_LIMITS.memoryLimitMb)),
      },
      checkerPolicy: {
        type: body.checkerPolicy?.type || DEFAULT_CHECKER_POLICY.type,
        ignoreTrailingWhitespace: body.checkerPolicy?.ignoreTrailingWhitespace ?? DEFAULT_CHECKER_POLICY.ignoreTrailingWhitespace,
        trimNewlines: body.checkerPolicy?.trimNewlines ?? DEFAULT_CHECKER_POLICY.trimNewlines,
        caseSensitive: body.checkerPolicy?.caseSensitive ?? DEFAULT_CHECKER_POLICY.caseSensitive,
        floatTolerance: body.checkerPolicy?.floatTolerance,
      },
      status: 'draft',
      contentVersion: 1,
      reviewedVersion: null,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      verificationMethod: null,
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await codingProblemStore.create(problem);
    res.status(201).json({ data: saved });
  },

  /**
   * GET /api/admin/coding/problems
   * List problems with status/difficulty filters and pagination
   */
  async listProblems(req: AuthedRequest, res: Response): Promise<void> {
    const { status, difficulty, topic, limit, skip } = req.query;

    const result = await codingProblemStore.listAdmin({
      status: typeof status === 'string' && VALID_STATUSES.has(status as ProblemStatus) ? (status as ProblemStatus) : undefined,
      difficulty: typeof difficulty === 'string' && VALID_DIFFICULTIES.has(difficulty as ProblemDifficulty) ? (difficulty as ProblemDifficulty) : undefined,
      topic: typeof topic === 'string' && topic.trim() ? topic.trim() : undefined,
      limit: limit ? Number(limit) : 20,
      skip: skip ? Number(skip) : 0,
    });

    res.json({ data: result });
  },

  /**
   * GET /api/admin/coding/problems/:id
   * Fetch one problem with test cases and private content
   */
  async getProblem(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const problem = await codingProblemStore.findById(id);
    if (!problem) {
      res.status(404).json({ error: { message: 'Problem not found.' } });
      return;
    }

    const [testCases, privateContent] = await Promise.all([
      codingProblemStore.listTestCases(problem._id),
      codingProblemStore.getPrivateContent(problem._id),
    ]);

    res.json({
      data: {
        problem,
        testCases,
        privateContent,
      },
    });
  },

  /**
   * PATCH /api/admin/coding/problems/:id
   * Edit problem metadata or statement (invalidates review/publication)
   */
  async updateProblem(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const body: UpdateCodingProblemInput = req.body ?? {};

    const existing = await codingProblemStore.findById(id);
    if (!existing) {
      res.status(404).json({ error: { message: 'Problem not found.' } });
      return;
    }

    const patch: Partial<StoredCodingProblem> = {};

    if (body.title && typeof body.title === 'string' && body.title.trim()) {
      patch.title = body.title.trim();
    }

    if (body.slug && typeof body.slug === 'string') {
      const cleanSlug = generateSlug(body.slug);
      if (cleanSlug && cleanSlug !== existing.slug) {
        const slugCollision = await codingProblemStore.findBySlug(cleanSlug);
        if (slugCollision && slugCollision._id !== existing._id) {
          res.status(409).json({ error: { message: `Slug '${cleanSlug}' is already taken.` } });
          return;
        }
        patch.slug = cleanSlug;
      }
    }

    if (body.difficulty && VALID_DIFFICULTIES.has(body.difficulty)) {
      patch.difficulty = body.difficulty;
    }

    if (body.topic && typeof body.topic === 'string' && body.topic.trim()) {
      patch.topic = body.topic.trim();
    }

    if (Array.isArray(body.tags)) {
      patch.tags = body.tags.map((t) => String(t).trim()).filter(Boolean);
    }

    if (typeof body.statement === 'string') patch.statement = body.statement;
    if (typeof body.inputFormat === 'string') patch.inputFormat = body.inputFormat;
    if (typeof body.outputFormat === 'string') patch.outputFormat = body.outputFormat;
    if (typeof body.constraints === 'string') patch.constraints = body.constraints;

    if (Array.isArray(body.supportedLanguages) && body.supportedLanguages.length > 0) {
      patch.supportedLanguages = body.supportedLanguages.filter((l) => VALID_LANGUAGES.has(l));
    }

    if (body.starterCodeByLanguage) {
      patch.starterCodeByLanguage = {
        ...existing.starterCodeByLanguage,
        ...body.starterCodeByLanguage,
      };
    }

    if (body.executionLimits) {
      patch.executionLimits = {
        timeLimitMs: body.executionLimits.timeLimitMs ? Math.max(100, Math.min(10000, Number(body.executionLimits.timeLimitMs))) : existing.executionLimits.timeLimitMs,
        memoryLimitMb: body.executionLimits.memoryLimitMb ? Math.max(32, Math.min(1024, Number(body.executionLimits.memoryLimitMb))) : existing.executionLimits.memoryLimitMb,
      };
    }

    if (body.checkerPolicy) {
      patch.checkerPolicy = {
        ...existing.checkerPolicy,
        ...body.checkerPolicy,
      };
    }

    // Material edits always bump contentVersion and reset review/published status to draft
    const updated = await codingProblemStore.bumpVersionAndInvalidateReview(id, patch);
    res.json({ data: updated });
  },

  /**
   * POST /api/admin/coding/problems/:id/test-cases
   * Add a sample or hidden testcase
   */
  async addTestCase(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const body: CreateTestCaseInput = req.body ?? {};

    const problem = await codingProblemStore.findById(id);
    if (!problem) {
      res.status(404).json({ error: { message: 'Problem not found.' } });
      return;
    }

    if (body.input === undefined || typeof body.input !== 'string') {
      res.status(400).json({ error: { message: 'Test case input is required.' } });
      return;
    }

    if (body.expectedOutput === undefined || typeof body.expectedOutput !== 'string') {
      res.status(400).json({ error: { message: 'Test case expectedOutput is required.' } });
      return;
    }

    const visibility = body.visibility === 'sample' ? 'sample' : 'hidden';
    const now = new Date().toISOString();

    const existingCases = await codingProblemStore.listTestCases(problem._id);
    const order = typeof body.order === 'number' ? body.order : existingCases.length + 1;
    const caseKey = `${visibility}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const testCase: StoredCodingTestCase = {
      _id: newTestCaseId(),
      problemId: problem._id,
      caseKey,
      visibility,
      input: body.input,
      expectedOutput: body.expectedOutput,
      explanation: typeof body.explanation === 'string' ? body.explanation : undefined,
      order,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await codingProblemStore.createTestCase(testCase);
    // Invalidate review/published status when testcases are modified
    await codingProblemStore.bumpVersionAndInvalidateReview(problem._id, {});

    res.status(201).json({ data: saved });
  },

  /**
   * PATCH /api/admin/coding/problems/:id/test-cases/:caseId
   * Edit a test case
   */
  async updateTestCase(req: AuthedRequest, res: Response): Promise<void> {
    const { id, caseId } = req.params;
    const body: UpdateTestCaseInput = req.body ?? {};

    const existing = await codingProblemStore.findTestCaseById(caseId, id);
    if (!existing) {
      res.status(404).json({ error: { message: 'Test case not found for this problem.' } });
      return;
    }

    const patch: Partial<StoredCodingTestCase> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.visibility && (body.visibility === 'sample' || body.visibility === 'hidden')) {
      patch.visibility = body.visibility;
    }
    if (typeof body.input === 'string') patch.input = body.input;
    if (typeof body.expectedOutput === 'string') patch.expectedOutput = body.expectedOutput;
    if (typeof body.explanation === 'string') patch.explanation = body.explanation;
    if (typeof body.order === 'number') patch.order = body.order;

    const updated = await codingProblemStore.updateTestCase(caseId, id, patch);
    await codingProblemStore.bumpVersionAndInvalidateReview(id, {});

    res.json({ data: updated });
  },

  /**
   * DELETE /api/admin/coding/problems/:id/test-cases/:caseId
   * Delete a test case
   */
  async deleteTestCase(req: AuthedRequest, res: Response): Promise<void> {
    const { id, caseId } = req.params;
    const existing = await codingProblemStore.findTestCaseById(caseId, id);
    if (!existing) {
      res.status(404).json({ error: { message: 'Test case not found for this problem.' } });
      return;
    }

    const deleted = await codingProblemStore.deleteTestCase(caseId, id);
    await codingProblemStore.bumpVersionAndInvalidateReview(id, {});

    res.json({ data: { success: deleted } });
  },

  /**
   * PUT /api/admin/coding/problems/:id/private-content
   * Update reference solutions, progressive hints, or editorial
   */
  async updatePrivateContent(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const body: UpdatePrivateContentInput = req.body ?? {};

    const problem = await codingProblemStore.findById(id);
    if (!problem) {
      res.status(404).json({ error: { message: 'Problem not found.' } });
      return;
    }

    const updated = await codingProblemStore.upsertPrivateContent(id, {
      referenceSolutions: Array.isArray(body.referenceSolutions) ? body.referenceSolutions : [],
      progressiveHints: Array.isArray(body.progressiveHints) ? body.progressiveHints : [],
      editorial: typeof body.editorial === 'string' ? body.editorial : '',
      verificationNotes: typeof body.verificationNotes === 'string' ? body.verificationNotes : undefined,
      verificationStatus: 'manual_verified',
      verificationMethod: typeof body.verificationMethod === 'string' ? body.verificationMethod : 'Manual review by admin',
    });

    await codingProblemStore.bumpVersionAndInvalidateReview(id, {});

    res.json({ data: updated });
  },

  /**
   * POST /api/admin/coding/problems/:id/review
   * Formally review problem content and testcases
   */
  async reviewProblem(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const adminId = req.userId!;
    const body: ReviewProblemInput = req.body ?? {};

    const problem = await codingProblemStore.findById(id);
    if (!problem) {
      res.status(404).json({ error: { message: 'Problem not found.' } });
      return;
    }

    if (!body.verificationMethod || typeof body.verificationMethod !== 'string' || !body.verificationMethod.trim()) {
      res.status(400).json({ error: { message: 'verificationMethod is required (e.g. "Manual solution verification").' } });
      return;
    }

    const now = new Date().toISOString();
    const reviewed = await codingProblemStore.update(id, {
      status: 'reviewed',
      reviewedVersion: problem.contentVersion,
      reviewedBy: adminId,
      reviewedAt: now,
      verificationMethod: body.verificationMethod.trim(),
      reviewNotes: body.notes ? String(body.notes).trim() : null,
      updatedAt: now,
    });

    res.json({ data: reviewed });
  },

  /**
   * POST /api/admin/coding/problems/:id/publish
   * Validate all publication constraints and set status = published
   */
  async publishProblem(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const problem = await codingProblemStore.findById(id);
    if (!problem) {
      res.status(404).json({ error: { message: 'Problem not found.' } });
      return;
    }

    // 1. Must be reviewed and up-to-date
    if (problem.status !== 'reviewed' || problem.reviewedVersion !== problem.contentVersion) {
      res.status(422).json({
        error: {
          message: 'Problem cannot be published without a completed review matching the latest contentVersion. Please review the problem first.',
        },
      });
      return;
    }

    // 2. Statement, formats, constraints
    if (!problem.statement || problem.statement.length < 20) {
      res.status(422).json({ error: { message: 'Problem statement must be at least 20 characters.' } });
      return;
    }
    if (!problem.inputFormat || !problem.outputFormat || !problem.constraints) {
      res.status(422).json({ error: { message: 'Input format, output format, and constraints are required before publication.' } });
      return;
    }

    // 3. Test Cases: At least 1 public sample AND at least 1 hidden test case
    const testCounts = await codingProblemStore.countTestCases(problem._id);
    if (testCounts.sample < 1) {
      res.status(422).json({ error: { message: 'At least one public sample test case is required before publishing.' } });
      return;
    }
    if (testCounts.hidden < 1) {
      res.status(422).json({ error: { message: 'At least one hidden test case is required before publishing.' } });
      return;
    }

    // 4. Starter code for all supported languages
    for (const lang of problem.supportedLanguages) {
      if (!problem.starterCodeByLanguage[lang] || problem.starterCodeByLanguage[lang].length < 10) {
        res.status(422).json({ error: { message: `Starter code scaffolding for supported language '${lang}' is missing or incomplete.` } });
        return;
      }
    }

    // 5. Reference solution exists in private content
    const privateContent = await codingProblemStore.getPrivateContent(problem._id);
    if (!privateContent || !privateContent.referenceSolutions || privateContent.referenceSolutions.length === 0) {
      res.status(422).json({ error: { message: 'At least one reference solution must be recorded in private content before publishing.' } });
      return;
    }

    const now = new Date().toISOString();
    const published = await codingProblemStore.update(id, {
      status: 'published',
      updatedAt: now,
    });

    res.json({ data: published });
  },

  /**
   * POST /api/admin/coding/problems/:id/archive
   * Archive a problem
   */
  async archiveProblem(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const problem = await codingProblemStore.findById(id);
    if (!problem) {
      res.status(404).json({ error: { message: 'Problem not found.' } });
      return;
    }

    const now = new Date().toISOString();
    const archived = await codingProblemStore.update(id, {
      status: 'archived',
      updatedAt: now,
    });

    res.json({ data: archived });
  },

  /**
   * POST /api/admin/coding/problems/generate-draft
   * Use Gemini AI to draft an original question with test cases and solutions
   */
  async generateDraft(req: AuthedRequest, res: Response): Promise<void> {
    const adminId = req.userId!;
    const body: GenerateDraftInput = req.body ?? {};

    if (!body.topic || typeof body.topic !== 'string' || !body.topic.trim()) {
      res.status(400).json({ error: { message: 'Topic is required.' } });
      return;
    }

    if (!body.difficulty || !VALID_DIFFICULTIES.has(body.difficulty)) {
      res.status(400).json({ error: { message: 'Valid difficulty (easy, medium, hard) is required.' } });
      return;
    }

    try {
      const generated = await generateCodingQuestionDraft(body);

      // Verify and resolve slug uniqueness
      let candidateSlug = generateSlug(generated.slug || generated.title);
      if (!candidateSlug) candidateSlug = `problem-${Date.now()}`;
      const existingSlug = await codingProblemStore.findBySlug(candidateSlug);
      if (existingSlug) {
        candidateSlug = `${candidateSlug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      const now = new Date().toISOString();
      const problemId = newProblemId();

      const problem: StoredCodingProblem = {
        _id: problemId,
        slug: candidateSlug,
        title: generated.title,
        difficulty: generated.difficulty,
        topic: generated.topic,
        tags: Array.isArray(generated.tags) ? generated.tags : [body.topic],
        statement: generated.statement,
        inputFormat: generated.inputFormat,
        outputFormat: generated.outputFormat,
        constraints: generated.constraints,
        supportedLanguages: ['cpp', 'java', 'python'],
        starterCodeByLanguage: generated.starterCodeByLanguage,
        executionLimits: generated.executionLimits || DEFAULT_LIMITS,
        checkerPolicy: generated.checkerPolicy || DEFAULT_CHECKER_POLICY,
        status: 'draft',
        contentVersion: 1,
        reviewedVersion: null,
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
        verificationMethod: null,
        createdBy: adminId,
        createdAt: now,
        updatedAt: now,
      };

      // Persist draft problem
      await codingProblemStore.create(problem);

      // Persist sample test cases
      let order = 1;
      for (const stc of generated.sampleTestCases) {
        await codingProblemStore.createTestCase({
          _id: newTestCaseId(),
          problemId,
          caseKey: `sample_${order}`,
          visibility: 'sample',
          input: stc.input,
          expectedOutput: stc.expectedOutput,
          explanation: stc.explanation,
          order: order++,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Persist hidden test cases
      let hiddenOrder = 1;
      for (const htc of generated.hiddenTestCases) {
        await codingProblemStore.createTestCase({
          _id: newTestCaseId(),
          problemId,
          caseKey: `hidden_${hiddenOrder}`,
          visibility: 'hidden',
          input: htc.input,
          expectedOutput: htc.expectedOutput,
          explanation: htc.explanation,
          order: order++,
          createdAt: now,
          updatedAt: now,
        });
        hiddenOrder++;
      }

      // Persist private content (reference solutions, hints, editorial)
      await codingProblemStore.upsertPrivateContent(problemId, {
        referenceSolutions: generated.referenceSolutions,
        progressiveHints: generated.progressiveHints,
        editorial: generated.editorial,
        verificationNotes: 'AI-generated draft. Requires human review and manual solution verification before publishing.',
        verificationStatus: 'ai_generated',
        verificationMethod: 'Gemini Generative AI Draft',
      });

      const fullDraft = await codingProblemStore.findById(problemId);
      const testCases = await codingProblemStore.listTestCases(problemId);
      const privateContent = await codingProblemStore.getPrivateContent(problemId);

      res.status(201).json({
        data: {
          problem: fullDraft,
          testCases,
          privateContent,
        },
      });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Coding draft generation error:', err);
      res.status(500).json({ error: { message: 'Failed to generate coding problem draft.' } });
    }
  },
};

