import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { adminCodingController } from '../controllers/adminCoding.js';
import { adminTaxonomyController } from '../controllers/adminTaxonomy.js';

export const adminCodingRouter = Router();

// Protect ALL admin routes with authentication + server-side verified admin role
adminCodingRouter.use(requireAuth, requireAdmin);

// Rate limiter for AI draft generation: 15 per 15 min per IP
const aiDraftRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 15 });

// Taxonomy Endpoints
adminCodingRouter.get('/taxonomy', adminTaxonomyController.getTaxonomy);
adminCodingRouter.post('/taxonomy/fields', adminTaxonomyController.addField);
adminCodingRouter.post('/taxonomy/fields/:fieldId/subjects', adminTaxonomyController.addSubject);
adminCodingRouter.post('/taxonomy/fields/:fieldId/subjects/:subjectId/topics', adminTaxonomyController.addTopic);

// Bulk Question Generator & Coverage
adminCodingRouter.post('/taxonomy/generate-bulk', aiDraftRateLimit, adminTaxonomyController.generateBulk);
adminCodingRouter.get('/taxonomy/jobs/:jobId', adminTaxonomyController.getJobStatus);
adminCodingRouter.get('/taxonomy/questions', adminTaxonomyController.listQuestions);
adminCodingRouter.patch('/taxonomy/questions/:id/status', adminTaxonomyController.updateQuestionStatus);
adminCodingRouter.post('/taxonomy/batches/:batchId/publish', adminTaxonomyController.bulkPublishBatch);
adminCodingRouter.delete('/taxonomy/batches/:batchId', adminTaxonomyController.undoBatch);
adminCodingRouter.get('/taxonomy/coverage', adminTaxonomyController.getCoverageDashboard);
adminCodingRouter.post('/taxonomy/import', adminTaxonomyController.importQuestions);

// 1. Static routes registered FIRST
adminCodingRouter.post('/problems/generate-draft', aiDraftRateLimit, adminCodingController.generateDraft);
adminCodingRouter.get('/problems', adminCodingController.listProblems);
adminCodingRouter.post('/problems', adminCodingController.createProblem);

// 2. Dynamic ID routes registered AFTER
adminCodingRouter.get('/problems/:id', adminCodingController.getProblem);
adminCodingRouter.patch('/problems/:id', adminCodingController.updateProblem);

// Test case management
adminCodingRouter.post('/problems/:id/test-cases', adminCodingController.addTestCase);
adminCodingRouter.patch('/problems/:id/test-cases/:caseId', adminCodingController.updateTestCase);
adminCodingRouter.delete('/problems/:id/test-cases/:caseId', adminCodingController.deleteTestCase);

// Private content & review lifecycle
adminCodingRouter.put('/problems/:id/private-content', adminCodingController.updatePrivateContent);
adminCodingRouter.post('/problems/:id/review', adminCodingController.reviewProblem);
adminCodingRouter.post('/problems/:id/publish', adminCodingController.publishProblem);
adminCodingRouter.post('/problems/:id/archive', adminCodingController.archiveProblem);

