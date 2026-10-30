import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { GeminiError } from '../lib/gemini.js';
import {
  analyzeCodeWithGemini,
  generateDryRunTraceWithGemini,
  explainDebuggerTopicWithGemini,
} from '../lib/debuggerAi.js';
import { debugSessionStore } from '../lib/debugSessionStore.js';
import type { SupportedDebuggerLanguage } from '../types/debugger.js';

const VALID_LANGUAGES: ReadonlySet<SupportedDebuggerLanguage> = new Set([
  'c',
  'cpp',
  'java',
  'python',
  'javascript',
]);

const MAX_CODE_LENGTH = 15000; // ~15 KB max code payload

export const debuggerController = {
  /**
   * POST /api/debugger/analyze
   * Analyze code, detect issues, generate line-by-line explanation, dry run trace & narration
   */
  async analyze(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: { message: 'Authentication required.' } });
      return;
    }

    const { language, code, userQuestion, explanationLanguage } = req.body ?? {};

    if (!language || !VALID_LANGUAGES.has(language as SupportedDebuggerLanguage)) {
      res.status(400).json({
        error: { message: 'A valid programming language (c, cpp, java, python, javascript) is required.' },
      });
      return;
    }

    if (!code || typeof code !== 'string' || !code.trim()) {
      res.status(400).json({ error: { message: 'Code cannot be empty.' } });
      return;
    }

    if (code.length > MAX_CODE_LENGTH) {
      res.status(400).json({
        error: { message: `Code is too long. Please limit code to ${MAX_CODE_LENGTH} characters.` },
      });
      return;
    }

    const validExpLang = explanationLanguage === 'hinglish' ? 'hinglish' : 'english';

    try {
      const analysis = await analyzeCodeWithGemini({
        language: language as SupportedDebuggerLanguage,
        code,
        userQuestion: typeof userQuestion === 'string' ? userQuestion.trim() : undefined,
        explanationLanguage: validExpLang,
      });

      // Save session in MongoDB
      const session = await debugSessionStore.create({
        userId,
        title: analysis.title || `${language.toUpperCase()} Debug Session`,
        language: language as SupportedDebuggerLanguage,
        originalCode: code,
        issues: analysis.issues,
        correctedCode: analysis.correctedCode,
        explanation: {
          summary: analysis.summary,
          lineByLineExplanation: analysis.lineByLineExplanation,
          concepts: analysis.concepts,
          learningTips: analysis.learningTips,
        },
        dryRun: analysis.dryRun,
        narrationEnglish: analysis.narrationEnglish,
        narrationHinglish: analysis.narrationHinglish,
      });

      res.json({
        data: {
          sessionId: session._id,
          analysis,
        },
      });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Error in debugger analyze:', err);
      res.status(500).json({ error: { message: 'Failed to analyze code. Please try again.' } });
    }
  },

  /**
   * POST /api/debugger/explain
   * Explain a specific line, error, or concept
   */
  async explain(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: { message: 'Authentication required.' } });
      return;
    }

    const { language, code, line, error, concept, explanationLanguage } = req.body ?? {};

    if (!language || !VALID_LANGUAGES.has(language as SupportedDebuggerLanguage)) {
      res.status(400).json({
        error: { message: 'A valid programming language is required.' },
      });
      return;
    }

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: { message: 'Code is required.' } });
      return;
    }

    try {
      const explanation = await explainDebuggerTopicWithGemini({
        language: language as SupportedDebuggerLanguage,
        code,
        line: typeof line === 'number' ? line : undefined,
        error: typeof error === 'string' ? error : undefined,
        concept: typeof concept === 'string' ? concept : undefined,
        explanationLanguage: explanationLanguage === 'hinglish' ? 'hinglish' : 'english',
      });

      res.json({ data: explanation });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Error in debugger explain:', err);
      res.status(500).json({ error: { message: 'Failed to explain concept. Please try again.' } });
    }
  },

  /**
   * POST /api/debugger/dry-run
   * Generate or regenerate a dry-run trace for code
   */
  async dryRun(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: { message: 'Authentication required.' } });
      return;
    }

    const { language, code, sessionId } = req.body ?? {};

    if (!language || !VALID_LANGUAGES.has(language as SupportedDebuggerLanguage)) {
      res.status(400).json({
        error: { message: 'A valid programming language is required.' },
      });
      return;
    }

    if (!code || typeof code !== 'string' || !code.trim()) {
      res.status(400).json({ error: { message: 'Code cannot be empty.' } });
      return;
    }

    if (code.length > MAX_CODE_LENGTH) {
      res.status(400).json({
        error: { message: `Code is too long. Please limit code to ${MAX_CODE_LENGTH} characters.` },
      });
      return;
    }

    try {
      const traceResult = await generateDryRunTraceWithGemini({
        language: language as SupportedDebuggerLanguage,
        code,
      });

      if (sessionId && typeof sessionId === 'string') {
        await debugSessionStore.updateDryRun(
          sessionId,
          userId,
          traceResult.dryRun,
          traceResult.narrationEnglish,
          traceResult.narrationHinglish
        );
      }

      res.json({ data: traceResult });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Error in debugger dry-run:', err);
      res.status(500).json({ error: { message: 'Failed to generate dry run trace.' } });
    }
  },

  /**
   * GET /api/debugger/history
   * Get user's previous debugging sessions
   */
  async history(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: { message: 'Authentication required.' } });
      return;
    }

    try {
      const sessions = await debugSessionStore.listByUser(userId);
      res.json({ data: sessions });
    } catch (err) {
      console.error('Error fetching debugger history:', err);
      res.status(500).json({ error: { message: 'Failed to load history.' } });
    }
  },

  /**
   * GET /api/debugger/:id
   * Get one debug session
   */
  async getById(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: { message: 'Authentication required.' } });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: { message: 'Session ID is required.' } });
      return;
    }

    try {
      const session = await debugSessionStore.findById(id, userId);
      if (!session) {
        res.status(404).json({ error: { message: 'Debug session not found.' } });
        return;
      }

      res.json({ data: session });
    } catch (err) {
      console.error('Error fetching debug session:', err);
      res.status(500).json({ error: { message: 'Failed to load debug session.' } });
    }
  },

  /**
   * DELETE /api/debugger/:id
   * Delete one debug session
   */
  async delete(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: { message: 'Authentication required.' } });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: { message: 'Session ID is required.' } });
      return;
    }

    try {
      const deleted = await debugSessionStore.delete(id, userId);
      if (!deleted) {
        res.status(404).json({ error: { message: 'Debug session not found or already deleted.' } });
        return;
      }

      res.json({ data: { success: true } });
    } catch (err) {
      console.error('Error deleting debug session:', err);
      res.status(500).json({ error: { message: 'Failed to delete debug session.' } });
    }
  },

  /**
   * POST /api/debugger/:id/rename
   * Rename a debug session
   */
  async rename(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: { message: 'Authentication required.' } });
      return;
    }

    const { id } = req.params;
    const { title } = req.body ?? {};

    if (!id) {
      res.status(400).json({ error: { message: 'Session ID is required.' } });
      return;
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: { message: 'A non-empty title is required.' } });
      return;
    }

    try {
      const updated = await debugSessionStore.rename(id, userId, title);
      if (!updated) {
        res.status(404).json({ error: { message: 'Debug session not found.' } });
        return;
      }

      res.json({ data: { success: true, title: title.trim() } });
    } catch (err) {
      console.error('Error renaming debug session:', err);
      res.status(500).json({ error: { message: 'Failed to rename debug session.' } });
    }
  },
};

