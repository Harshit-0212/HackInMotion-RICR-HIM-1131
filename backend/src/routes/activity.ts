import { Router, type Response } from 'express';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { activityStore, type ActivityEventType } from '../lib/activityStore.js';

export const activityRouter = Router();
activityRouter.use(requireAuth);

/**
 * POST /api/activity/checkin
 * Checks in for the current user's day, registering an idempotent 'app_open' event.
 * Expects { timezone?: string, localDate?: string }
 */
activityRouter.post('/checkin', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { timezone, localDate } = req.body || {};

  // Resolve user local date from timezone or fallback
  let dateKey = typeof localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(localDate) ? localDate : '';
  if (!dateKey) {
    try {
      const tz = typeof timezone === 'string' && timezone ? timezone : 'UTC';
      const now = new Date();
      dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now);
    } catch {
      dateKey = new Date().toISOString().slice(0, 10);
    }
  }

  // Record app_open (1 point, idempotent per day)
  await activityStore.recordActivity(userId, 'app_open', dateKey, 1, { timezone }, `app_open:${dateKey}`);

  const streak = await activityStore.computeStreak(userId, dateKey);
  res.json({
    data: {
      success: true,
      dateKey,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
    },
  });
});

/**
 * POST /api/activity/record
 * Logs any activity (focus, session, mock_test, etc.)
 */
activityRouter.post('/record', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { type, points, meta, localDate, timezone, eventKey } = req.body || {};

  const validTypes: ActivityEventType[] = [
    'session',
    'mock_test',
    'interview',
    'flashcard',
    'mistake_retry',
    'tutor',
    'focus',
    'document',
    'app_open',
    'coding_submission',
  ];

  if (!type || !validTypes.includes(type)) {
    res.status(400).json({ error: { message: 'Invalid activity type.' } });
    return;
  }

  let dateKey = typeof localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(localDate) ? localDate : '';
  if (!dateKey) {
    try {
      const tz = typeof timezone === 'string' && timezone ? timezone : 'UTC';
      dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
    } catch {
      dateKey = new Date().toISOString().slice(0, 10);
    }
  }

  const defaultPoints: Record<ActivityEventType, number> = {
    session: 3,
    mock_test: 4,
    interview: 4,
    flashcard: 1,
    mistake_retry: 1,
    tutor: 1,
    focus: 1,
    document: 1,
    app_open: 1,
    coding_submission: 3,
  };

  const finalPoints = typeof points === 'number' && points >= 0 ? points : defaultPoints[type as ActivityEventType];

  const recorded = await activityStore.recordActivity(userId, type, dateKey, finalPoints, meta, eventKey);
  const streak = await activityStore.computeStreak(userId, dateKey);

  res.json({
    data: {
      recorded,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
    },
  });
});

/**
 * GET /api/activity
 * Returns heatmaps, stats, streak, and daily breakdown.
 */
activityRouter.get('/', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { year, month, type, timezone, localDate } = req.query;

  let userToday = typeof localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(localDate) ? localDate : '';
  if (!userToday) {
    try {
      const tz = typeof timezone === 'string' && timezone ? timezone : 'UTC';
      userToday = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
    } catch {
      userToday = new Date().toISOString().slice(0, 10);
    }
  }

  const yearNum = year ? parseInt(year as string, 10) : new Date().getFullYear();
  const monthNum = month ? parseInt(month as string, 10) : undefined;
  const typeStr = typeof type === 'string' ? type : undefined;

  const data = await activityStore.getActivityData(userId, userToday, yearNum, monthNum, typeStr);
  res.json({ data });
});

