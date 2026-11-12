import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { gamificationStore, type LearningActionType } from '../lib/gamificationStore.js';

export const gamificationController = {
  async getProfile(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    try {
      const profile = await gamificationStore.getProfile(userId);
      res.json({ data: profile });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch gamification profile.';
      res.status(500).json({ error: { message } });
    }
  },

  async recordAction(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { action, localDate, eventKey } = req.body || {};

    const validActions: LearningActionType[] = [
      'coding_accepted',
      'comprehension_drill',
      'quiz_completed',
      'curriculum_step',
      'tutor_session',
    ];

    if (!action || !validActions.includes(action)) {
      res.status(400).json({ error: { message: 'Invalid or missing learning action.' } });
      return;
    }

    // Default to server date if not supplied or invalid
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const safeLocalDate =
      typeof localDate === 'string' && datePattern.test(localDate)
        ? localDate
        : new Date().toISOString().slice(0, 10);

    try {
      const outcome = await gamificationStore.recordLearningEvent(userId, action, safeLocalDate, eventKey);
      res.json({ data: outcome });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to record learning event.';
      res.status(500).json({ error: { message } });
    }
  },
};
