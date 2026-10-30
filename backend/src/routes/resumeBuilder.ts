import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { resumeBuilderController } from '../controllers/resumeBuilder.js';

export const resumeBuilderRouter = Router();

// Protect all routes with JWT auth
resumeBuilderRouter.use(requireAuth);

// Rate limiter for AI operations: max 30 per 15 mins per IP
const aiRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

resumeBuilderRouter.post('/summary', aiRateLimit, resumeBuilderController.summary);
resumeBuilderRouter.post('/bullets', aiRateLimit, resumeBuilderController.bullets);
resumeBuilderRouter.post('/skills', aiRateLimit, resumeBuilderController.skills);
resumeBuilderRouter.post('/projects', aiRateLimit, resumeBuilderController.projects);
resumeBuilderRouter.post('/complete', aiRateLimit, resumeBuilderController.complete);
resumeBuilderRouter.post('/tailor', aiRateLimit, resumeBuilderController.tailor);
