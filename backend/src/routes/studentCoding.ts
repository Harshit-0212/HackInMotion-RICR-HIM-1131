import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { studentCodingController } from '../controllers/studentCoding.js';

export const studentCodingRouter = Router();

// Student routes require authenticated session
studentCodingRouter.use(requireAuth);

// Static filter route registered BEFORE dynamic slug route
studentCodingRouter.get('/problems/filters', studentCodingController.getFilters);
studentCodingRouter.get('/problems', studentCodingController.listProblems);
studentCodingRouter.get('/problems/:slug', studentCodingController.getProblemBySlug);

