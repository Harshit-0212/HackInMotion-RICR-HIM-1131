import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { userApiKeyController } from '../controllers/userApiKey.js';

export const userApiKeyRouter = Router();

userApiKeyRouter.use(requireAuth);

userApiKeyRouter.get('/gemini/status', userApiKeyController.getStatus);
userApiKeyRouter.post('/gemini', userApiKeyController.saveKey);
userApiKeyRouter.put('/gemini', userApiKeyController.saveKey); // Allow replace via PUT
userApiKeyRouter.delete('/gemini', userApiKeyController.deleteKey);
userApiKeyRouter.post('/gemini/test', userApiKeyController.testKey);
userApiKeyRouter.post('/gemini/test-saved', userApiKeyController.testSavedKey);
