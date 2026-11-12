import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { resumeStore } from '../lib/resumeStore.js';
import { validateResumeInput, validateEnhanceInput } from '../lib/resumeValidation.js';
import { enhanceResumeContent, scoreResumeAts } from '../lib/resumeAi.js';
import { generateResumePdfBuffer } from '../lib/resumePdf.js';
import { GeminiError } from '../lib/gemini.js';
import type { CreateResumeInput, UpdateResumeInput } from '../types/resume.js';

export const resumeController = {
  /**
   * POST /api/resume
   * Create a new resume
   */
  async create(req: AuthedRequest, res: Response): Promise<void> {
    const validation = validateResumeInput(req.body, false);
    if (!validation.valid || !validation.data) {
      res.status(400).json({ error: { message: validation.message || 'Invalid resume data.' } });
      return;
    }

    try {
      const input = validation.data as CreateResumeInput;
      input.userId = req.userId!;
      const resume = await resumeStore.create(input);
      res.status(201).json({ data: { resume } });
    } catch (err) {
      console.error('Failed to create resume:', err);
      res.status(500).json({ error: { message: 'Failed to create resume. Please try again.' } });
    }
  },

  /**
   * GET /api/resume
   * Get all resumes of the logged-in user
   */
  async list(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const resumes = await resumeStore.listByUser(req.userId!);
      res.json({ data: { resumes } });
    } catch (err) {
      console.error('Failed to list resumes:', err);
      res.status(500).json({ error: { message: 'Failed to retrieve resumes. Please try again.' } });
    }
  },

  /**
   * GET /api/resume/current
   * Get the user's current/default resume
   */
  async getCurrent(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const resume = await resumeStore.getCurrent(req.userId!);
      res.json({ data: { resume: resume ?? null } });
    } catch (err) {
      console.error('Failed to get current resume:', err);
      res.status(500).json({ error: { message: 'Failed to retrieve current resume. Please try again.' } });
    }
  },

  /**
   * GET /api/resume/:id
   * Get one resume by ID, only if it belongs to the user
   */
  async getById(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: { message: 'Resume ID is required.' } });
      return;
    }

    try {
      const resume = await resumeStore.findById(id, req.userId!);
      if (!resume) {
        res.status(404).json({ error: { message: 'Resume not found.' } });
        return;
      }
      res.json({ data: { resume } });
    } catch (err) {
      console.error('Failed to get resume by ID:', err);
      res.status(500).json({ error: { message: 'Failed to retrieve resume. Please try again.' } });
    }
  },

  /**
   * PUT /api/resume/:id
   * Update a resume owned by the user
   */
  async update(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: { message: 'Resume ID is required.' } });
      return;
    }

    const validation = validateResumeInput(req.body, true);
    if (!validation.valid || !validation.data) {
      res.status(400).json({ error: { message: validation.message || 'Invalid resume update data.' } });
      return;
    }

    try {
      const updated = await resumeStore.update(id, req.userId!, validation.data as UpdateResumeInput);
      if (!updated) {
        res.status(404).json({ error: { message: 'Resume not found.' } });
        return;
      }
      res.json({ data: { resume: updated } });
    } catch (err) {
      console.error('Failed to update resume:', err);
      res.status(500).json({ error: { message: 'Failed to update resume. Please try again.' } });
    }
  },

  /**
   * DELETE /api/resume/:id
   * Delete a resume owned by the user
   */
  async delete(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: { message: 'Resume ID is required.' } });
      return;
    }

    try {
      const deleted = await resumeStore.delete(id, req.userId!);
      if (!deleted) {
        res.status(404).json({ error: { message: 'Resume not found.' } });
        return;
      }
      res.json({ data: { ok: true } });
    } catch (err) {
      console.error('Failed to delete resume:', err);
      res.status(500).json({ error: { message: 'Failed to delete resume. Please try again.' } });
    }
  },

  /**
   * POST /api/resume/:id/set-current
   * Mark a resume as current/default
   */
  async setCurrent(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: { message: 'Resume ID is required.' } });
      return;
    }

    try {
      const updated = await resumeStore.setCurrent(id, req.userId!);
      if (!updated) {
        res.status(404).json({ error: { message: 'Resume not found.' } });
        return;
      }
      res.json({ data: { resume: updated } });
    } catch (err) {
      console.error('Failed to set current resume:', err);
      res.status(500).json({ error: { message: 'Failed to set current resume. Please try again.' } });
    }
  },

  /**
   * POST /api/resume/enhance
   * Use Gemini to improve resume content
   */
  async enhance(req: AuthedRequest, res: Response): Promise<void> {
    const validation = validateEnhanceInput(req.body);
    if (!validation.valid || !validation.data) {
      res.status(400).json({ error: { message: validation.message || 'Invalid enhancement input.' } });
      return;
    }

    try {
      const enhanced = await enhanceResumeContent(validation.data, req.userId);
      res.json({ data: enhanced });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Resume enhancement error:', err);
      res.status(500).json({ error: { message: 'Failed to enhance resume content. Please try again.' } });
    }
  },

  /**
   * POST /api/resume/:id/export
   * Generate a resume PDF
   */
  async exportPdf(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: { message: 'Resume ID is required.' } });
      return;
    }

    try {
      const resume = await resumeStore.findById(id, req.userId!);
      if (!resume) {
        res.status(404).json({ error: { message: 'Resume not found.' } });
        return;
      }

      const pdfBuffer = await generateResumePdfBuffer(resume);
      const safeTitle = (resume.title || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeTitle}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      console.error('Resume export PDF error:', err);
      res.status(500).json({ error: { message: 'Failed to generate PDF. Please try again.' } });
    }
  },

  /**
   * POST /api/resume/:id/ats-score
   * Evaluate ATS score and suggestions using Gemini
   */
  async getAtsScore(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { targetRole } = req.body || {};
    try {
      const resume = await resumeStore.findById(id, req.userId!);
      if (!resume) {
        res.status(404).json({ error: { message: 'Resume not found.' } });
        return;
      }
      const atsResult = await scoreResumeAts(resume, targetRole, req.userId);
      res.json({ data: atsResult });
    } catch (err) {
      console.error('ATS score evaluation error:', err);
      res.status(500).json({ error: { message: 'Failed to evaluate ATS score.' } });
    }
  },
};
