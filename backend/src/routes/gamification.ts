import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { gamificationController } from '../controllers/gamification.js';

export const gamificationRouter = Router();

gamificationRouter.use(requireAuth);

gamificationRouter.get('/profile', gamificationController.getProfile);
gamificationRouter.get('/leaderboard', gamificationController.getLeaderboard);
gamificationRouter.post('/events', gamificationController.recordAction);
