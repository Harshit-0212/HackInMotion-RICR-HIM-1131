import { executeCodeSync } from '../lib/codeExecution.js';
import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { codingProblemStore } from '../lib/codingStore.js';
import type {
  ProblemDifficulty,
  PublicCodingProblemListItem,
  PublicCodingProblemDetail,
  PublicSampleCase,
} from '../types/coding.js';

const VALID_DIFFICULTIES: ReadonlySet<ProblemDifficulty> = new Set(['easy', 'medium', 'hard']);

export const studentCodingController = {
  /**
   * GET /api/coding/problems
   * List published coding problems with bounded pagination, difficulty, topic, tag, and search filters
   */
  async listProblems(req: AuthedRequest, res: Response): Promise<void> {
    const { difficulty, topic, tag, search, limit, skip } = req.query;

    const parsedDifficulty =
      typeof difficulty === 'string' && VALID_DIFFICULTIES.has(difficulty as ProblemDifficulty)
        ? (difficulty as ProblemDifficulty)
        : undefined;

    const parsedTopic = typeof topic === 'string' && topic.trim() ? topic.trim() : undefined;
    const parsedTag = typeof tag === 'string' && tag.trim() ? tag.trim() : undefined;
    const parsedSearch = typeof search === 'string' && search.trim() ? search.trim().slice(0, 80) : undefined;

    const parsedLimit = limit ? Number(limit) : 20;
    const parsedSkip = skip ? Number(skip) : 0;

    const { problems, total } = await codingProblemStore.listPublished({
      difficulty: parsedDifficulty,
      topic: parsedTopic,
      tag: parsedTag,
      search: parsedSearch,
      limit: parsedLimit,
      skip: parsedSkip,
    });

    // Strip any sensitive internal fields, return PublicCodingProblemListItem DTO
    const items: PublicCodingProblemListItem[] = await Promise.all(
      problems.map(async (p) => {
        const counts = await codingProblemStore.countTestCases(p._id);
        return {
          id: p._id,
          slug: p.slug,
          title: p.title,
          difficulty: p.difficulty,
          topic: p.topic,
          tags: p.tags,
          supportedLanguages: p.supportedLanguages,
          executionLimits: p.executionLimits,
          sampleCount: counts.sample,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      })
    );

    res.json({
      data: {
        problems: items,
        total,
        page: Math.floor(parsedSkip / (parsedLimit || 20)) + 1,
        limit: Math.min(Math.max(parsedLimit || 20, 1), 50),
      },
    });
  },

  /**
   * GET /api/coding/problems/filters
   * Get available topics, tags, and difficulties among published problems
   */
  async getFilters(_req: AuthedRequest, res: Response): Promise<void> {
    const filters = await codingProblemStore.getPublishedFilters();
    res.json({ data: filters });
  },

  /**
   * GET /api/coding/problems/:slug
   * Retrieve full details of a published problem including public sample test cases
   * NEVER exposes hidden test cases, reference solutions, or internal notes
   */
  async runCode(req: AuthedRequest, res: Response): Promise<void> {
    const { language, code, input } = req.body || {};
    if (!language || !code) {
      res.status(400).json({ error: { message: 'Language and code are required.' } });
      return;
    }
    try {
      const result = await executeCodeSync({ language, code, input });
      res.json({ data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Code execution failed.';
      res.status(500).json({ error: { message } });
    }
  },

  async getProblemBySlug(req: AuthedRequest, res: Response): Promise<void> {
    const { slug } = req.params;
    if (!slug || typeof slug !== 'string') {
      res.status(400).json({ error: { message: 'Slug is required.' } });
      return;
    }

    const problem = await codingProblemStore.findPublishedBySlug(slug);
    if (!problem) {
      res.status(404).json({ error: { message: 'Problem not found or is not published.' } });
      return;
    }

    // Retrieve sample cases ONLY (visibility === 'sample')
    const rawSampleCases = await codingProblemStore.listTestCases(problem._id, 'sample');
    const sampleCases: PublicSampleCase[] = rawSampleCases.map((tc) => ({
      caseKey: tc.caseKey,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      explanation: tc.explanation,
      order: tc.order,
    }));

    // Construct clean PublicCodingProblemDetail DTO
    const detail: PublicCodingProblemDetail = {
      id: problem._id,
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      topic: problem.topic,
      tags: problem.tags,
      statement: problem.statement,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      constraints: problem.constraints,
      supportedLanguages: problem.supportedLanguages,
      starterCodeByLanguage: problem.starterCodeByLanguage,
      executionLimits: problem.executionLimits,
      checkerPolicy: {
        type: problem.checkerPolicy.type,
        ignoreTrailingWhitespace: problem.checkerPolicy.ignoreTrailingWhitespace,
        trimNewlines: problem.checkerPolicy.trimNewlines,
        caseSensitive: problem.checkerPolicy.caseSensitive,
      },
      sampleCases,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
    };

    res.json({ data: detail });
  },
};

