import crypto from 'node:crypto';
import { getDb } from './db.js';

function randomId(): string {
  return crypto.randomBytes(12).toString('hex');
}

export interface MistakeRecord {
  id: string;
  userId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  subject: string;
  topic: string;
  explanation: string;
  resolved: boolean;
  retriesCount: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface FlashcardRecord {
  id: string;
  userId: string;
  front: string;
  back: string;
  subject: string;
  topic: string;
  sourceDocId?: string;
  sourceMistakeId?: string;
  repetition: number; // consecutive correct reviews
  interval: number; // days until next review
  easeFactor: number; // default 2.5
  nextReviewDate: string; // ISO string
  createdAt: string;
}

export interface CalendarEventRecord {
  id: string;
  userId: string;
  title: string;
  type: 'session' | 'mocktest' | 'flashcard' | 'interview' | 'exam' | 'custom';
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  description?: string;
  completed?: boolean;
  createdAt: string;
}

export interface InterviewReportRecord {
  id: string;
  userId: string;
  role: string;
  topic: string;
  difficulty: string;
  overallScore: number;
  communicationScore: number;
  technicalDepthScore: number;
  confidenceScore: number;
  strengths: string[];
  weaknesses: Array<{
    area: string;
    reason: string;
    fix: string;
    studyRecommendation: string;
  }>;
  questions: Array<{
    question: string;
    userAnswer: string;
    score: number;
    sampleAnswer: string;
  }>;
  createdAt: string;
}

export const learningStore = {
  // Mistakes
  async recordMistake(record: Omit<MistakeRecord, 'id' | 'resolved' | 'retriesCount' | 'createdAt'>): Promise<MistakeRecord> {
    const db = await getDb();
    const item: MistakeRecord = {
      ...record,
      id: randomId(),
      resolved: false,
      retriesCount: 0,
      createdAt: new Date().toISOString(),
    };
    await db.collection<MistakeRecord>('mistakes').insertOne(item);
    return item;
  },

  async listMistakes(userId: string, filters?: { subject?: string; topic?: string; unresolvedOnly?: boolean }): Promise<MistakeRecord[]> {
    const db = await getDb();
    const query: Record<string, any> = { userId };
    if (filters?.subject) query.subject = filters.subject;
    if (filters?.topic) query.topic = filters.topic;
    if (filters?.unresolvedOnly) query.resolved = false;
    return db.collection<MistakeRecord>('mistakes').find(query).sort({ createdAt: -1 }).toArray();
  },

  async resolveMistake(userId: string, id: string): Promise<boolean> {
    const db = await getDb();
    const res = await db.collection<MistakeRecord>('mistakes').updateOne(
      { id, userId },
      { $set: { resolved: true, resolvedAt: new Date().toISOString() }, $inc: { retriesCount: 1 } }
    );
    return res.matchedCount > 0;
  },

  // Flashcards (SM-2 Algorithm)
  async createFlashcard(data: Omit<FlashcardRecord, 'id' | 'repetition' | 'interval' | 'easeFactor' | 'nextReviewDate' | 'createdAt'>): Promise<FlashcardRecord> {
    const db = await getDb();
    const item: FlashcardRecord = {
      ...data,
      id: randomId(),
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await db.collection<FlashcardRecord>('flashcards').insertOne(item);
    return item;
  },

  async getDueFlashcards(userId: string): Promise<FlashcardRecord[]> {
    const db = await getDb();
    const nowIso = new Date().toISOString();
    return db.collection<FlashcardRecord>('flashcards')
      .find({ userId, nextReviewDate: { $lte: nowIso } })
      .toArray();
  },

  async reviewFlashcard(userId: string, id: string, rating: 1 | 2 | 3 | 4): Promise<FlashcardRecord | null> {
    const db = await getDb();
    const card = await db.collection<FlashcardRecord>('flashcards').findOne({ id, userId });
    if (!card) return null;

    // SM-2 calculation: rating 1=Again, 2=Hard, 3=Good, 4=Easy
    let { repetition, interval, easeFactor } = card;
    if (rating < 3) {
      repetition = 0;
      interval = 1;
    } else {
      if (repetition === 0) interval = 1;
      else if (repetition === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetition += 1;
    }

    // Ease Factor adjustment
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02)));

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    const nextReviewDate = nextDate.toISOString();

    await db.collection<FlashcardRecord>('flashcards').updateOne(
      { id, userId },
      { $set: { repetition, interval, easeFactor, nextReviewDate } }
    );

    // Record review log
    await db.collection('flashcard_reviews').insertOne({
      id: randomId(),
      userId,
      cardId: id,
      rating,
      reviewedAt: new Date().toISOString(),
    });

    return { ...card, repetition, interval, easeFactor, nextReviewDate };
  },

  // Calendar events
  async listCalendarEvents(userId: string): Promise<CalendarEventRecord[]> {
    const db = await getDb();
    return db.collection<CalendarEventRecord>('calendar_events').find({ userId }).sort({ date: 1 }).toArray();
  },

  async createCalendarEvent(data: Omit<CalendarEventRecord, 'id' | 'createdAt'>): Promise<CalendarEventRecord> {
    const db = await getDb();
    const item: CalendarEventRecord = {
      ...data,
      id: randomId(),
      createdAt: new Date().toISOString(),
    };
    await db.collection<CalendarEventRecord>('calendar_events').insertOne(item);
    return item;
  },

  async deleteCalendarEvent(userId: string, id: string): Promise<boolean> {
    const db = await getDb();
    const res = await db.collection<CalendarEventRecord>('calendar_events').deleteOne({ id, userId });
    return res.deletedCount > 0;
  },

  // Interview reports
  async saveInterviewReport(report: Omit<InterviewReportRecord, 'id' | 'createdAt'>): Promise<InterviewReportRecord> {
    const db = await getDb();
    const item: InterviewReportRecord = {
      ...report,
      id: randomId(),
      createdAt: new Date().toISOString(),
    };
    await db.collection<InterviewReportRecord>('interview_reports').insertOne(item);
    return item;
  },

  async listInterviewReports(userId: string): Promise<InterviewReportRecord[]> {
    const db = await getDb();
    return db.collection<InterviewReportRecord>('interview_reports').find({ userId }).sort({ createdAt: -1 }).toArray();
  },
};
