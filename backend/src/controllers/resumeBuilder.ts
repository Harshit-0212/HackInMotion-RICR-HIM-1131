import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { GeminiError } from '../lib/gemini.js';
import {
  generateResumeSummary,
  generateResumeBullets,
  suggestResumeSkills,
  improveResumeProject,
  generateCompleteResumeDraft,
  tailorResumeToJob,
} from '../lib/resumeBuilderAi.js';
import type {
  GenerateSummaryInput,
  GenerateBulletsInput,
  SuggestSkillsInput,
  ImproveProjectInput,
  CompleteResumeDraftInput,
  TailorResumeInput,
} from '../types/resumeIntelligence.js';

export const resumeBuilderController = {
  /**
   * POST /api/resume-builder/summary
   */
  async summary(req: AuthedRequest, res: Response): Promise<void> {
    const body = req.body as GenerateSummaryInput;
    try {
      const result = await generateResumeSummary(body || {});
      res.json({ data: result });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Summary generation error:', err);
      res.status(500).json({ error: { message: 'Failed to generate professional summary.' } });
    }
  },

  /**
   * POST /api/resume-builder/bullets
   */
  async bullets(req: AuthedRequest, res: Response): Promise<void> {
    const body = req.body as GenerateBulletsInput;
    if (!body || !body.titleOrRole || !body.rawDetails) {
      res.status(400).json({
        error: { message: 'Please provide titleOrRole and rawDetails for bullet point generation.' },
      });
      return;
    }

    try {
      const result = await generateResumeBullets(body);
      res.json({ data: result });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Bullets generation error:', err);
      res.status(500).json({ error: { message: 'Failed to generate bullet points.' } });
    }
  },

  /**
   * POST /api/resume-builder/skills
   */
  async skills(req: AuthedRequest, res: Response): Promise<void> {
    const body = req.body as SuggestSkillsInput;
    try {
      const result = await suggestResumeSkills(body || {});
      res.json({ data: result });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Skills suggestion error:', err);
      res.status(500).json({ error: { message: 'Failed to suggest skills.' } });
    }
  },

  /**
   * POST /api/resume-builder/projects
   */
  async projects(req: AuthedRequest, res: Response): Promise<void> {
    const body = req.body as ImproveProjectInput;
    if (!body || !body.title) {
      res.status(400).json({ error: { message: 'Project title is required.' } });
      return;
    }

    try {
      const result = await improveResumeProject(body);
      res.json({ data: result });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Project improvement error:', err);
      res.status(500).json({ error: { message: 'Failed to improve project description.' } });
    }
  },

  /**
   * POST /api/resume-builder/complete
   */
  async complete(req: AuthedRequest, res: Response): Promise<void> {
    const body = req.body as CompleteResumeDraftInput;
    if (!body) {
      res.status(400).json({ error: { message: 'Resume details are required.' } });
      return;
    }

    try {
      const result = await generateCompleteResumeDraft(body);
      res.json({ data: result });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Complete draft generation error:', err);
      res.status(500).json({ error: { message: 'Failed to generate complete resume draft.' } });
    }
  },

  /**
   * POST /api/resume-builder/tailor
   */
  async tailor(req: AuthedRequest, res: Response): Promise<void> {
    const body = req.body as TailorResumeInput;
    if (!body || !body.resume || !body.jobDescription || !body.jobDescription.trim()) {
      res.status(400).json({
        error: { message: 'Both existing resume object and jobDescription text are required for tailoring.' },
      });
      return;
    }

    try {
      const result = await tailorResumeToJob(body);
      res.json({ data: result });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Resume tailoring error:', err);
      res.status(500).json({ error: { message: 'Failed to tailor resume.' } });
    }
  },
};
