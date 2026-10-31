import { getDb } from './db.js';
import type {
  StoredCodingProblem,
  StoredCodingTestCase,
  StoredCodingProblemPrivate,
  ProblemStatus,
  ProblemDifficulty,
} from '../types/coding.js';

export async function codingProblemsCollection() {
  const db = await getDb();
  const col = db.collection<StoredCodingProblem>('coding_problems');
  await col.createIndex({ _id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ slug: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ status: 1, difficulty: 1, topic: 1 }).catch(() => {});
  await col.createIndex({ status: 1, updatedAt: -1 }).catch(() => {});
  return col;
}

export async function codingTestCasesCollection() {
  const db = await getDb();
  const col = db.collection<StoredCodingTestCase>('coding_test_cases');
  await col.createIndex({ _id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ problemId: 1, visibility: 1, order: 1 }).catch(() => {});
  await col.createIndex({ problemId: 1, caseKey: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function codingPrivateCollection() {
  const db = await getDb();
  const col = db.collection<StoredCodingProblemPrivate>('coding_problem_private');
  await col.createIndex({ _id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ problemId: 1 }, { unique: true }).catch(() => {});
  return col;
}

export function newProblemId(): string {
  return `prob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newTestCaseId(): string {
  return `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newPrivateId(): string {
  return `cpriv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const codingProblemStore = {
  // --- Admin Queries ---
  async listAdmin(filter: {
    status?: ProblemStatus;
    difficulty?: ProblemDifficulty;
    topic?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ problems: StoredCodingProblem[]; total: number }> {
    const col = await codingProblemsCollection();
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.difficulty) query.difficulty = filter.difficulty;
    if (filter.topic) query.topic = filter.topic;

    const limit = Math.min(Math.max(filter.limit ?? 20, 1), 100);
    const skip = Math.max(filter.skip ?? 0, 0);

    const [problems, total] = await Promise.all([
      col.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(query),
    ]);

    return { problems, total };
  },

  async findById(id: string): Promise<StoredCodingProblem | null> {
    const col = await codingProblemsCollection();
    return col.findOne({ _id: id });
  },

  async findBySlug(slug: string): Promise<StoredCodingProblem | null> {
    const col = await codingProblemsCollection();
    return col.findOne({ slug: slug.trim().toLowerCase() });
  },

  async create(problem: StoredCodingProblem): Promise<StoredCodingProblem> {
    const col = await codingProblemsCollection();
    await col.insertOne(problem);
    return problem;
  },

  async update(id: string, patch: Partial<StoredCodingProblem>): Promise<StoredCodingProblem | null> {
    const col = await codingProblemsCollection();
    const res = await col.findOneAndUpdate(
      { _id: id },
      { $set: patch },
      { returnDocument: 'after' }
    );
    return res ?? null;
  },

  async bumpVersionAndInvalidateReview(id: string, patch: Partial<StoredCodingProblem>): Promise<StoredCodingProblem | null> {
    const col = await codingProblemsCollection();
    const now = new Date().toISOString();
    const res = await col.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          ...patch,
          status: 'draft',
          reviewedAt: null,
          reviewedBy: null,
          reviewedVersion: null,
          reviewNotes: null,
          updatedAt: now,
        },
        $inc: { contentVersion: 1 },
      },
      { returnDocument: 'after' }
    );
    return res ?? null;
  },

  // --- Student Queries ---
  async listPublished(filter: {
    difficulty?: ProblemDifficulty;
    topic?: string;
    tag?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ problems: StoredCodingProblem[]; total: number }> {
    const col = await codingProblemsCollection();
    const query: Record<string, unknown> = { status: 'published' };

    if (filter.difficulty) query.difficulty = filter.difficulty;
    if (filter.topic) query.topic = filter.topic;
    if (filter.tag) query.tags = filter.tag;

    if (filter.search && typeof filter.search === 'string') {
      const sanitized = filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
      if (sanitized) {
        query.$or = [
          { title: { $regex: sanitized, $options: 'i' } },
          { topic: { $regex: sanitized, $options: 'i' } },
          { tags: { $regex: sanitized, $options: 'i' } },
        ];
      }
    }

    const limit = Math.min(Math.max(filter.limit ?? 20, 1), 50);
    const skip = Math.max(filter.skip ?? 0, 0);

    const [problems, total] = await Promise.all([
      col.find(query).sort({ updatedAt: -1, _id: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(query),
    ]);

    return { problems, total };
  },

  async getPublishedFilters(): Promise<{ topics: string[]; tags: string[]; difficulties: ProblemDifficulty[] }> {
    const col = await codingProblemsCollection();
    const [topics, tags] = await Promise.all([
      col.distinct('topic', { status: 'published' }),
      col.distinct('tags', { status: 'published' }),
    ]);

    return {
      topics: (topics as string[]).filter(Boolean).sort(),
      tags: (tags as string[]).filter(Boolean).sort(),
      difficulties: ['easy', 'medium', 'hard'],
    };
  },

  async findPublishedBySlug(slug: string): Promise<StoredCodingProblem | null> {
    const col = await codingProblemsCollection();
    return col.findOne({ slug: slug.trim().toLowerCase(), status: 'published' });
  },

  // --- Test Cases Store ---
  async listTestCases(problemId: string, visibility?: 'sample' | 'hidden'): Promise<StoredCodingTestCase[]> {
    const col = await codingTestCasesCollection();
    const query: Record<string, unknown> = { problemId };
    if (visibility) query.visibility = visibility;
    return col.find(query).sort({ order: 1, _id: 1 }).toArray();
  },

  async findTestCaseById(caseId: string, problemId: string): Promise<StoredCodingTestCase | null> {
    const col = await codingTestCasesCollection();
    return col.findOne({ _id: caseId, problemId });
  },

  async createTestCase(tc: StoredCodingTestCase): Promise<StoredCodingTestCase> {
    const col = await codingTestCasesCollection();
    await col.insertOne(tc);
    return tc;
  },

  async updateTestCase(caseId: string, problemId: string, patch: Partial<StoredCodingTestCase>): Promise<StoredCodingTestCase | null> {
    const col = await codingTestCasesCollection();
    const res = await col.findOneAndUpdate(
      { _id: caseId, problemId },
      { $set: patch },
      { returnDocument: 'after' }
    );
    return res ?? null;
  },

  async deleteTestCase(caseId: string, problemId: string): Promise<boolean> {
    const col = await codingTestCasesCollection();
    const res = await col.deleteOne({ _id: caseId, problemId });
    return res.deletedCount > 0;
  },

  async countTestCases(problemId: string): Promise<{ total: number; sample: number; hidden: number }> {
    const col = await codingTestCasesCollection();
    const [sample, hidden] = await Promise.all([
      col.countDocuments({ problemId, visibility: 'sample' }),
      col.countDocuments({ problemId, visibility: 'hidden' }),
    ]);
    return { total: sample + hidden, sample, hidden };
  },

  // --- Private Record Store ---
  async getPrivateContent(problemId: string): Promise<StoredCodingProblemPrivate | null> {
    const col = await codingPrivateCollection();
    return col.findOne({ problemId });
  },

  async upsertPrivateContent(
    problemId: string,
    data: Omit<StoredCodingProblemPrivate, '_id' | 'problemId' | 'createdAt' | 'updatedAt'>
  ): Promise<StoredCodingProblemPrivate> {
    const col = await codingPrivateCollection();
    const now = new Date().toISOString();
    const existing = await col.findOne({ problemId });

    if (existing) {
      const res = await col.findOneAndUpdate(
        { problemId },
        {
          $set: {
            ...data,
            updatedAt: now,
          },
        },
        { returnDocument: 'after' }
      );
      return res!;
    } else {
      const record: StoredCodingProblemPrivate = {
        _id: newPrivateId(),
        problemId,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(record);
      return record;
    }
  },
};

