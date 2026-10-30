import type { Response } from 'express';
import multer from 'multer';
import type { AuthedRequest } from '../middleware/auth.js';
import { extractDocument, ExtractionError } from '../lib/extractText.js';
import { GeminiError } from '../lib/gemini.js';
import {
  performDeepResumeAnalysis,
  generateImprovedResumeFromAnalysis,
  generateInterviewQuestionsFromResume,
} from '../lib/resumeAnalyzerAi.js';
import { resumeAnalysisStore } from '../lib/resumeAnalysisStore.js';
import type { ImproveAnalysisInput } from '../types/resumeIntelligence.js';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    if (ALLOWED_MIME_TYPES.has(file.mimetype) || lower.endsWith('.pdf') || lower.endsWith('.docx')) {
      cb(null, true);
    } else {
      cb(new ExtractionError('Unsupported file type. Please upload a PDF or DOCX file.'));
    }
  },
});

export const resumeAnalyzerController = {
  /**
   * POST /api/resume-analyzer/analyze
   * Upload PDF/DOCX resume + optional role/JD
   */
  async analyze(req: AuthedRequest, res: Response): Promise<void> {
    resumeUpload.single('file')(req, res, async (uploadErr) => {
      if (uploadErr) {
        const message =
          uploadErr instanceof multer.MulterError && uploadErr.code === 'LIMIT_FILE_SIZE'
            ? 'Resume file is too large. Maximum size is 15MB.'
            : uploadErr instanceof Error
              ? uploadErr.message
              : 'File upload failed.';
        res.status(400).json({ error: { message } });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: { message: 'No resume file was uploaded.' } });
        return;
      }

      const targetRole = typeof req.body.targetRole === 'string' ? req.body.targetRole.trim() : undefined;
      const jobDescription = typeof req.body.jobDescription === 'string' ? req.body.jobDescription.trim() : undefined;
      const experienceLevel = typeof req.body.experienceLevel === 'string' ? req.body.experienceLevel.trim() : undefined;
      const language = req.body.language === 'hinglish' ? 'hinglish' : 'english';

      try {
        const extracted = await extractDocument({
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
          originalname: req.file.originalname,
        });

        if (extracted.kind !== 'text' || !extracted.text || extracted.text.length < 50) {
          res.status(422).json({
            error: {
              message: 'Could not extract sufficient text from this resume. Ensure the PDF/DOCX is text-based and not an image.',
            },
          });
          return;
        }

        const analysis = await performDeepResumeAnalysis({
          resumeText: extracted.text,
          targetRole,
          jobDescription,
          experienceLevel,
          language,
        });

        const fileType = req.file.originalname.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';
        const record = await resumeAnalysisStore.create({
          userId: req.userId!,
          fileName: req.file.originalname,
          fileType,
          extractedText: extracted.text,
          targetRole,
          jobDescription,
          experienceLevel,
          language,
          analysis,
        });

        res.status(201).json({
          data: {
            id: record._id,
            fileName: record.fileName,
            fileType: record.fileType,
            targetRole: record.targetRole,
            analysis: record.analysis,
            createdAt: record.createdAt,
          },
        });
      } catch (err) {
        if (err instanceof ExtractionError) {
          res.status(422).json({ error: { message: err.message } });
          return;
        }
        if (err instanceof GeminiError) {
          res.status(502).json({ error: { message: err.message } });
          return;
        }
        console.error('Resume upload analysis error:', err);
        res.status(500).json({ error: { message: 'Failed to analyze resume file.' } });
      }
    });
  },

  /**
   * POST /api/resume-analyzer/analyze-text
   * Paste resume text directly
   */
  async analyzeText(req: AuthedRequest, res: Response): Promise<void> {
    const { text, targetRole, jobDescription, experienceLevel, language } = req.body ?? {};

    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      res.status(400).json({
        error: { message: 'Please provide at least 50 characters of resume text to analyze.' },
      });
      return;
    }

    try {
      const analysis = await performDeepResumeAnalysis({
        resumeText: text.trim(),
        targetRole: typeof targetRole === 'string' ? targetRole.trim() : undefined,
        jobDescription: typeof jobDescription === 'string' ? jobDescription.trim() : undefined,
        experienceLevel: typeof experienceLevel === 'string' ? experienceLevel.trim() : undefined,
        language: language === 'hinglish' ? 'hinglish' : 'english',
      });

      const record = await resumeAnalysisStore.create({
        userId: req.userId!,
        fileName: 'Pasted Resume Text',
        fileType: 'text',
        extractedText: text.trim(),
        targetRole,
        jobDescription,
        experienceLevel,
        language: language === 'hinglish' ? 'hinglish' : 'english',
        analysis,
      });

      res.status(201).json({
        data: {
          id: record._id,
          fileName: record.fileName,
          fileType: record.fileType,
          targetRole: record.targetRole,
          analysis: record.analysis,
          createdAt: record.createdAt,
        },
      });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Resume text analysis error:', err);
      res.status(500).json({ error: { message: 'Failed to analyze resume text.' } });
    }
  },

  /**
   * GET /api/resume-analyzer/history
   */
  async history(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const list = await resumeAnalysisStore.listByUser(req.userId!);
      res.json({ data: { analyses: list } });
    } catch (err) {
      console.error('List analyses error:', err);
      res.status(500).json({ error: { message: 'Failed to retrieve analysis history.' } });
    }
  },

  /**
   * GET /api/resume-analyzer/:id
   */
  async getById(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: { message: 'Analysis ID is required.' } });
      return;
    }

    try {
      const doc = await resumeAnalysisStore.findById(id, req.userId!);
      if (!doc) {
        res.status(404).json({ error: { message: 'Resume analysis not found.' } });
        return;
      }
      res.json({ data: { analysis: doc } });
    } catch (err) {
      console.error('Get analysis error:', err);
      res.status(500).json({ error: { message: 'Failed to retrieve resume analysis.' } });
    }
  },

  /**
   * DELETE /api/resume-analyzer/:id
   */
  async delete(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: { message: 'Analysis ID is required.' } });
      return;
    }

    try {
      const deleted = await resumeAnalysisStore.delete(id, req.userId!);
      if (!deleted) {
        res.status(404).json({ error: { message: 'Resume analysis not found.' } });
        return;
      }
      res.json({ data: { ok: true } });
    } catch (err) {
      console.error('Delete analysis error:', err);
      res.status(500).json({ error: { message: 'Failed to delete resume analysis.' } });
    }
  },

  /**
   * POST /api/resume-analyzer/:id/improve
   */
  async improve(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: { message: 'Analysis ID is required.' } });
      return;
    }

    try {
      const doc = await resumeAnalysisStore.findById(id, req.userId!);
      if (!doc) {
        res.status(404).json({ error: { message: 'Resume analysis not found.' } });
        return;
      }

      const input = (req.body ?? {}) as ImproveAnalysisInput;
      const targetRole = input.targetRole || doc.targetRole;
      const jobDescription = input.jobDescription || doc.jobDescription;
      const language = input.language || doc.language;

      const improved = await generateImprovedResumeFromAnalysis({
        resumeText: doc.extractedText,
        analysis: doc.analysis,
        input: {
          ...input,
          targetRole,
          jobDescription,
          language,
        },
      });

      res.json({ data: improved });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Improve analysis error:', err);
      res.status(500).json({ error: { message: 'Failed to generate improved resume content.' } });
    }
  },

  /**
   * POST /api/resume-analyzer/:id/interview-prep
   */
  async interviewPrep(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: { message: 'Analysis ID is required.' } });
      return;
    }

    try {
      const doc = await resumeAnalysisStore.findById(id, req.userId!);
      if (!doc) {
        res.status(404).json({ error: { message: 'Resume analysis not found.' } });
        return;
      }

      const targetRole = req.body?.targetRole || doc.targetRole;
      const questions = await generateInterviewQuestionsFromResume(doc.extractedText, targetRole);
      res.json({ data: { interviewQuestions: questions } });
    } catch (err) {
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Interview prep error:', err);
      res.status(500).json({ error: { message: 'Failed to generate interview questions.' } });
    }
  },
};
