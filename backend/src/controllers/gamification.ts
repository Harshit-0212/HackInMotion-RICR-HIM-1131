import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { gamificationStore, type LearningActionType } from '../lib/gamificationStore.js';
import { activityStore } from '../lib/activityStore.js';
import { userStore } from '../lib/users.js';

export const gamificationController = {
  async getLeaderboard(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const topProfiles = await gamificationStore.getLeaderboard(50);
      const userIds = topProfiles.map((p) => p.userId);
      
      const enriched = await Promise.all(
        topProfiles.map(async (p, idx) => {
          const userDoc = await userStore.findById(p.userId);
          return {
            rank: idx + 1,
            userId: p.userId,
            name: userDoc?.full_name || 'Anonymous Scholar',
            avatar: userDoc?.avatar_image,
            xp: p.totalXp,
            level: p.level,
            streak: p.currentStreak,
            isUser: p.userId === req.userId,
          };
        })
      );

      res.json({ data: enriched });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch leaderboard.';
      res.status(500).json({ error: { message } });
    }
  },

  async getProfile(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    try {
      const profile = await gamificationStore.getProfile(userId);
      const today = new Date().toISOString().slice(0, 10);
      const computed = await activityStore.computeStreak(userId, today);
      
      const mergedProfile = {
        ...profile,
        currentStreak: Math.max(profile.currentStreak || 0, computed.currentStreak),
        longestStreak: Math.max(profile.longestStreak || 0, computed.longestStreak),
      };
      
      res.json({ data: mergedProfile });
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
