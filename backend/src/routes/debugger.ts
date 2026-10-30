import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { debuggerController } from '../controllers/debugger.js';

export const debuggerRouter = Router();

// Protect all debugger routes with JWT auth
debuggerRouter.use(requireAuth);

// Rate limiter for heavy AI debugging & dry-run generation: max 30 per 15 mins per IP
const aiDebuggerRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

debuggerRouter.post('/analyze', aiDebuggerRateLimit, debuggerController.analyze);
debuggerRouter.post('/explain', aiDebuggerRateLimit, debuggerController.explain);
debuggerRouter.post('/dry-run', aiDebuggerRateLimit, debuggerController.dryRun);
debuggerRouter.get('/history', debuggerController.history);
debuggerRouter.get('/:id', debuggerController.getById);
debuggerRouter.delete('/:id', debuggerController.delete);
debuggerRouter.post('/:id/rename', debuggerController.rename);

