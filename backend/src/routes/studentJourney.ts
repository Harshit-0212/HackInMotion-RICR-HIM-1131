import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { studentJourneyController as sc } from '../controllers/studentJourney.js';

export const studentJourneyRouter = Router();
studentJourneyRouter.use(requireAuth);

// Journey listing and detail
studentJourneyRouter.get('/journeys', sc.listJourneys);
studentJourneyRouter.get('/journeys/:journeySlug', sc.getJourney);

// Progress for a journey
studentJourneyRouter.get('/journeys/:journeySlug/progress', sc.getProgress);

// Stages in a journey
studentJourneyRouter.get('/journeys/:journeySlug/stages', sc.listStages);
studentJourneyRouter.get('/stages/:stageSlug', sc.getStage);

// Activities in a stage
studentJourneyRouter.get('/stages/:stageSlug/activities', sc.listActivities);
studentJourneyRouter.get('/activities/:activityId', sc.getActivity);
studentJourneyRouter.post('/activities/:activityId/complete', sc.completeActivity);

// Comprehension answer submission (reveals explanation)
studentJourneyRouter.post('/activities/:activityId/answer', sc.submitComprehensionAnswer);

// Practice coding submission (awards journey solve credit)
studentJourneyRouter.post(
  '/journeys/:journeySlug/practice/:problemSlug/submit',
  sc.submitPracticeCodingProblem,
);

// Checkpoint lifecycle
studentJourneyRouter.post('/stages/:stageSlug/checkpoint/start', sc.startCheckpoint);
studentJourneyRouter.patch('/checkpoint-attempts/:attemptId/save', sc.saveCheckpointProgress);
studentJourneyRouter.post('/checkpoint-attempts/:attemptId/submit', sc.submitCheckpoint);
studentJourneyRouter.post(
  '/checkpoint-attempts/:attemptId/judge/:problemId',
  sc.judgeCheckpointCodingTask,
);

