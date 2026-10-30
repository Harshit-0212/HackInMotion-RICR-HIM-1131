import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { resumeAnalyzerController } from '../controllers/resumeAnalyzer.js';

export const resumeAnalyzerRouter = Router();

// Protect all routes with JWT auth
resumeAnalyzerRouter.use(requireAuth);

// Rate limiter for upload and heavy AI analysis: max 20 per 15 mins per IP
const heavyAiRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

resumeAnalyzerRouter.post('/analyze', heavyAiRateLimit, resumeAnalyzerController.analyze);
resumeAnalyzerRouter.post('/analyze-text', heavyAiRateLimit, resumeAnalyzerController.analyzeText);
resumeAnalyzerRouter.get('/history', resumeAnalyzerController.history);
resumeAnalyzerRouter.get('/:id', resumeAnalyzerController.getById);
resumeAnalyzerRouter.delete('/:id', resumeAnalyzerController.delete);
resumeAnalyzerRouter.post('/:id/improve', heavyAiRateLimit, resumeAnalyzerController.improve);
resumeAnalyzerRouter.post('/:id/interview-prep', heavyAiRateLimit, resumeAnalyzerController.interviewPrep);
