import { getDb } from './db.js';

export type ActivityEventType =
  | 'session'
  | 'mock_test'
  | 'interview'
  | 'flashcard'
  | 'mistake_retry'
  | 'tutor'
  | 'focus'
  | 'document'
  | 'app_open'
  | 'coding_submission';

export interface ActivityEventDoc {
  _id?: string;
  userId: string;
  type: ActivityEventType;
  points: number;
  meta?: Record<string, unknown>;
  createdAt: string;
  dateKey: string; // YYYY-MM-DD in user's timezone
  eventKey?: string; // Idempotency key if any
}

const COLLECTION = 'activity_events';

export const activityStore = {
  async ensureIndexes(): Promise<void> {
    const db = await getDb();
    const col = db.collection<ActivityEventDoc>(COLLECTION);
    await col.createIndex({ userId: 1, dateKey: 1 });
    await col.createIndex({ userId: 1, eventKey: 1 }, { unique: true, sparse: true });
    await col.createIndex({ userId: 1, type: 1 });
  },

  /**
   * Records an activity event idempotently.
   * Points table:
   * session: 3, mock_test: 4, interview: 4, flashcard: 1, mistake_retry: 1,
   * tutor: 1 (max 3/day), focus: 1 (per 25 min), document: 1, app_open: 1, coding_submission: 3
   */
  async recordActivity(
    userId: string,
    type: ActivityEventType,
    dateKey: string,
    points: number,
    meta?: Record<string, unknown>,
    eventKey?: string,
  ): Promise<boolean> {
    const db = await getDb();
    const col = db.collection<ActivityEventDoc>(COLLECTION);

    // Tutor cap: max 3/day
    if (type === 'tutor') {
      const tutorEventsCount = await col.countDocuments({
        userId,
        dateKey,
        type: 'tutor',
      });
      if (tutorEventsCount >= 3) {
        return false;
      }
    }

    // App open: max 1/day
    if (type === 'app_open') {
      const existingOpen = await col.findOne({ userId, dateKey, type: 'app_open' });
      if (existingOpen) return false;
    }

    const now = new Date().toISOString();
    const doc: ActivityEventDoc = {
      userId,
      type,
      points,
      meta,
      createdAt: now,
      dateKey,
      eventKey: eventKey || undefined,
    };

    try {
      if (eventKey) {
        await col.updateOne(
          { userId, eventKey },
          { $setOnInsert: doc },
          { upsert: true }
        );
      } else {
        await col.insertOne(doc);
      }
      return true;
    } catch {
      // Duplicate eventKey handled gracefully
      return false;
    }
  },

  /**
   * Computes streak directly from distinct dateKeys of activity_events (consecutive days).
   * Today not yet active does not break the streak until the day ends.
   */
  async computeStreak(userId: string, userToday: string): Promise<{ currentStreak: number; longestStreak: number; distinctDays: string[] }> {
    const db = await getDb();
    const col = db.collection<ActivityEventDoc>(COLLECTION);

    const distinctDays: string[] = await col.distinct('dateKey', { userId });
    distinctDays.sort(); // Ascending

    if (distinctDays.length === 0) {
      return { currentStreak: 0, longestStreak: 0, distinctDays: [] };
    }

    const daySet = new Set(distinctDays);

    // Calculate longest streak
    let longest = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dStr of distinctDays) {
      const curr = new Date(dStr);
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diff = Math.round((curr.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        if (diff === 1) {
          tempStreak++;
        } else if (diff > 1) {
          tempStreak = 1;
        }
      }
      prevDate = curr;
      if (tempStreak > longest) longest = tempStreak;
    }

    // Calculate current streak relative to userToday
    let current = 0;
    const checkDate = new Date(userToday);

    // If today is active, start counting backwards from today
    // If today is NOT yet active, start counting backwards from yesterday (does not break until day ends)
    const todayStr = checkDate.toISOString().slice(0, 10);
    let startOffset = 0;

    if (daySet.has(todayStr)) {
      startOffset = 0;
    } else {
      // Check yesterday
      const yesterday = new Date(checkDate.getTime() - 86400000);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      if (daySet.has(yesterdayStr)) {
        startOffset = 1;
      } else {
        // Neither today nor yesterday active
        return { currentStreak: 0, longestStreak: longest, distinctDays };
      }
    }

    let cursor = new Date(checkDate.getTime() - startOffset * 86400000);
    while (true) {
      const cStr = cursor.toISOString().slice(0, 10);
      if (daySet.has(cStr)) {
        current++;
        cursor = new Date(cursor.getTime() - 86400000);
      } else {
        break;
      }
    }

    if (current > longest) longest = current;
    return { currentStreak: current, longestStreak: longest, distinctDays };
  },

  /**
   * Retrieves activity events aggregated for a year/month/type
   */
  async getActivityData(
    userId: string,
    userToday: string,
    year?: number,
    month?: number,
    typeFilter?: string
  ): Promise<{
    currentStreak: number;
    longestStreak: number;
    activeDaysCount: number;
    totalPoints: number;
    dailyData: Record<string, { totalPoints: number; count: number; breakdown: Record<string, number>; items: Array<{ type: string; points: number; time: string; title?: string }> }>;
  }> {
    const db = await getDb();
    const col = db.collection<ActivityEventDoc>(COLLECTION);

    const { currentStreak, longestStreak } = await this.computeStreak(userId, userToday);

    const query: Record<string, unknown> = { userId };
    if (typeFilter && typeFilter !== 'all') {
      query.type = typeFilter;
    }
    if (year) {
      const yearRegex = new RegExp(`^${year}`);
      query.dateKey = { $regex: yearRegex };
    }

    const events = await col.find(query).sort({ createdAt: 1 }).toArray();

    const dailyData: Record<string, { totalPoints: number; count: number; breakdown: Record<string, number>; items: Array<{ type: string; points: number; time: string; title?: string }> }> = {};
    let totalPoints = 0;

    for (const ev of events) {
      if (!dailyData[ev.dateKey]) {
        dailyData[ev.dateKey] = { totalPoints: 0, count: 0, breakdown: {}, items: [] };
      }
      dailyData[ev.dateKey].totalPoints += ev.points;
      dailyData[ev.dateKey].count += 1;
      dailyData[ev.dateKey].breakdown[ev.type] = (dailyData[ev.dateKey].breakdown[ev.type] || 0) + ev.points;
      dailyData[ev.dateKey].items.push({
        type: ev.type,
        points: ev.points,
        time: ev.createdAt,
        title: (ev.meta?.title as string) || undefined,
      });

      totalPoints += ev.points;
    }

    const activeDaysCount = Object.keys(dailyData).length;

    return {
      currentStreak,
      longestStreak,
      activeDaysCount,
      totalPoints,
      dailyData,
    };
  },
};

