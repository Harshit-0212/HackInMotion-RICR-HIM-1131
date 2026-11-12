import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { studentCodingController } from '../controllers/studentCoding.js';

export const studentCodingRouter = Router();

// Student routes require authenticated session
studentCodingRouter.use(requireAuth);

// Static filter route registered BEFORE dynamic slug route
studentCodingRouter.get('/problems/filters', studentCodingController.getFilters);
studentCodingRouter.get('/problems', studentCodingController.listProblems);
studentCodingRouter.get('/problems/:slug/submission-status', studentCodingController.getSubmissionStatus);
studentCodingRouter.get('/problems/:slug', studentCodingController.getProblemBySlug);
studentCodingRouter.post('/problems/:slug/submit', studentCodingController.submitProblem);
studentCodingRouter.post('/run', studentCodingController.runCode);

// Execution capabilities discovery endpoint
studentCodingRouter.get('/capabilities', (req, res) => {
  res.json({
    data: {
      supportedLanguages: ['c', 'cpp', 'java', 'python'],
      compilers: {
        c: 'gcc-15',
        cpp: 'g++-15',
        java: 'openjdk-25',
        python: 'python-3.14',
      },
    },
  });
});
