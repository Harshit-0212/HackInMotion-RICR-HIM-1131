import { executeCodeSync } from '../lib/codeExecution.js';
import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { codingProblemStore, newSubmissionId, type StoredCodingSubmission } from '../lib/codingStore.js';
import { studentProgressStore, journeyStore } from '../lib/journeyStore.js';
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

  /**
   * POST /api/coding/problems/:slug/submit
   * Evaluate user's code against ALL approved stored test cases (public + hidden).
   * Returns safe result metrics:
   * - submissionId
   * - overall verdict: 'accepted' | 'wrong_answer' | 'compile_error' | 'runtime_error' | 'timeout'
   * - passedTests, totalTests
   * - per-sample-test execution outcome (sample only, NEVER hidden inputs/outputs)
   * - compile error message if compilation failed
   * - updates student solved state if verdict === 'accepted'
   */
  async submitProblem(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { slug } = req.params;
    const { language, code } = req.body || {};

    if (!language || !code) {
      res.status(400).json({ error: { message: 'Language and code are required.' } });
      return;
    }

    if (!slug || typeof slug !== 'string') {
      res.status(400).json({ error: { message: 'Problem slug is required.' } });
      return;
    }

    const problem = await codingProblemStore.findPublishedBySlug(slug);
    if (!problem) {
      res.status(404).json({ error: { message: 'Problem not found or is not published.' } });
      return;
    }

    // Submission lock: check if already solved, enforce optimization mode
    const isOptimization = req.body?.optimize === true;
    const existingAccepted = await codingProblemStore.getLatestAcceptedSubmission(userId, problem._id);
    if (existingAccepted && !isOptimization) {
      res.status(409).json({
        error: {
          code: 'ALREADY_SOLVED',
          message: 'You have already solved this problem. Use "Optimize Solution" to submit an improvement.',
          submissionId: existingAccepted._id,
          solvedAt: existingAccepted.createdAt,
        },
      });
      return;
    }

    // Retrieve all test cases (both sample and hidden)
    const allCases = await codingProblemStore.listTestCases(problem._id);
    if (allCases.length === 0) {
      res.status(409).json({ error: { message: 'No test cases are configured for this problem yet.' } });
      return;
    }

    let overallVerdict: 'accepted' | 'wrong_answer' | 'compile_error' | 'runtime_error' | 'timeout' | 'error' = 'accepted';
    let passedTests = 0;
    let compileError: string | undefined;
    const publicResults: {
      caseKey: string;
      passed: boolean;
      status: string;
      actualOutput?: string;
      expectedOutput?: string;
    }[] = [];

    // Helper for matching output per checker policy
    const normalize = (str: string) => {
      let s = str;
      if (problem.checkerPolicy.trimNewlines) s = s.trim();
      else if (problem.checkerPolicy.ignoreTrailingWhitespace) s = s.trimEnd();
      if (!problem.checkerPolicy.caseSensitive) s = s.toLowerCase();
      return s;
    };

    for (const tc of allCases) {
      try {
        const execResult = await executeCodeSync({ language, code, input: tc.input });

        if (execResult.status === 'compile_error') {
          overallVerdict = 'compile_error';
          compileError = execResult.error || 'Compilation failed.';
          if (tc.visibility === 'sample') {
            publicResults.push({
              caseKey: tc.caseKey,
              passed: false,
              status: 'compile_error',
            });
          }
          break; // Stop on compile error
        }

        if (execResult.status === 'timeout') {
          if (overallVerdict === 'accepted') overallVerdict = 'timeout';
          if (tc.visibility === 'sample') {
            publicResults.push({
              caseKey: tc.caseKey,
              passed: false,
              status: 'timeout',
            });
          }
          continue;
        }

        if (execResult.status === 'error' || execResult.status === 'runtime_error') {
          if (overallVerdict === 'accepted') overallVerdict = 'runtime_error';
          if (tc.visibility === 'sample') {
            publicResults.push({
              caseKey: tc.caseKey,
              passed: false,
              status: 'runtime_error',
            });
          }
          continue;
        }

        // Compare output
        const actual = normalize(execResult.output ?? '');
        const expected = normalize(tc.expectedOutput ?? '');
        const passed = actual === expected;

        if (passed) {
          passedTests++;
        } else {
          if (overallVerdict === 'accepted') overallVerdict = 'wrong_answer';
        }

        // Only expose actual/expected for public sample test cases
        if (tc.visibility === 'sample') {
          publicResults.push({
            caseKey: tc.caseKey,
            passed,
            status: passed ? 'passed' : 'wrong_answer',
            actualOutput: execResult.output,
            expectedOutput: tc.expectedOutput,
          });
        }
      } catch (err: unknown) {
        overallVerdict = 'error';
        const msg = err instanceof Error ? err.message : 'Execution error';
        if (tc.visibility === 'sample') {
          publicResults.push({
            caseKey: tc.caseKey,
            passed: false,
            status: 'error',
          });
        }
      }
    }

    const submissionId = newSubmissionId();
    const submissionRecord: StoredCodingSubmission = {
      _id: submissionId,
      userId,
      problemId: problem._id,
      problemSlug: problem.slug,
      language,
      code,
      verdict: overallVerdict,
      passedTests,
      totalTests: allCases.length,
      compileError,
      createdAt: new Date().toISOString(),
    };

    // Record submission history
    await codingProblemStore.recordSubmission(submissionRecord);

    // If verdict is accepted, record in student journey progress if active journey exists
    if (overallVerdict === 'accepted') {
      try {
        const journeys = await journeyStore.listPublished();
        for (const j of journeys) {
          await studentProgressStore.recordCodingSolve(userId, j._id, problem._id, 'accepted');
        }
      } catch (e) {
        console.warn('Could not record journey progress solve:', e);
      }
    }

    res.json({
      data: {
        submissionId,
        verdict: overallVerdict,
        passedTests,
        totalTests: allCases.length,
        compileError,
        publicResults,
      },
    });
  },

  /**
   * GET /api/coding/problems/:slug/submission-status
   * Returns current user's solve status and accepted code (if solved) for read-only view.
   */
  async getSubmissionStatus(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
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

    const status = await codingProblemStore.getSubmissionStatus(userId, problem._id);
    res.json({ data: status });
  },
};

