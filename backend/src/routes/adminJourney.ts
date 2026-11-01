import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { adminJourneyController as ac } from '../controllers/adminJourney.js';

export const adminJourneyRouter = Router();
adminJourneyRouter.use(requireAuth, requireAdmin);

// Journeys
adminJourneyRouter.get('/journeys', ac.listJourneys);
adminJourneyRouter.post('/journeys', ac.createJourney);
adminJourneyRouter.patch('/journeys/:id', ac.updateJourney);

// Stages (admin view by journeyId, not slug)
adminJourneyRouter.get('/journeys/:journeyId/stages', ac.listStages);
adminJourneyRouter.post('/stages', ac.createStage);
adminJourneyRouter.patch('/stages/:id', ac.updateStage);

// Activities (admin view by stageId)
adminJourneyRouter.get('/stages/:stageId/activities', ac.listActivities);
adminJourneyRouter.post('/activities', ac.createActivity);
adminJourneyRouter.patch('/activities/:id', ac.updateActivity);

// Knowledge questions
adminJourneyRouter.get('/stages/:stageId/questions', ac.listQuestions);
adminJourneyRouter.post('/questions', ac.createQuestion);
adminJourneyRouter.patch('/questions/:id', ac.updateQuestion);

// Checkpoint inventory readiness
adminJourneyRouter.get('/stages/:stageId/inventory', ac.checkInventory);

