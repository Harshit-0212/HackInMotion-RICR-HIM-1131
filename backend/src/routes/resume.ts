import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { resumeController } from '../controllers/resume.js';

export const resumeRouter = Router();

// Protect all resume routes with JWT authentication
resumeRouter.use(requireAuth);

// Resume enhancement via AI
resumeRouter.post('/enhance', resumeController.enhance);

// Specific queries
resumeRouter.get('/current', resumeController.getCurrent);

// Resume collections
resumeRouter.get('/', resumeController.list);
resumeRouter.post('/', resumeController.create);

// Individual resume operations
resumeRouter.get('/:id', resumeController.getById);
resumeRouter.put('/:id', resumeController.update);
resumeRouter.delete('/:id', resumeController.delete);
resumeRouter.post('/:id/set-current', resumeController.setCurrent);
resumeRouter.post('/:id/export', resumeController.exportPdf);
resumeRouter.post('/:id/ats-score', resumeController.getAtsScore);
