import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { userApiKeyController } from '../controllers/userApiKey.js';

export const userApiKeyRouter = Router();

userApiKeyRouter.use(requireAuth);

userApiKeyRouter.get('/gemini/status', userApiKeyController.getStatus);
userApiKeyRouter.post('/gemini', userApiKeyController.saveKey);
userApiKeyRouter.delete('/gemini', userApiKeyController.deleteKey);
userApiKeyRouter.post('/gemini/test', userApiKeyController.testKey);

