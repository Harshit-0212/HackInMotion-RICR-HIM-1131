import { getDb } from './db.js';
import type { StoredResume, CreateResumeInput, UpdateResumeInput } from '../types/resume.js';

async function resumesCollection() {
  const db = await getDb();
  const col = db.collection<StoredResume>('resumes');
  await col.createIndex({ _id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ userId: 1, createdAt: -1 }).catch(() => {});
  await col.createIndex({ userId: 1, isCurrent: 1 }).catch(() => {});
  return col;
}

function newResumeId(): string {
  return `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const resumeStore = {
  async listByUser(userId: string): Promise<StoredResume[]> {
    const col = await resumesCollection();
    return col.find({ userId }).sort({ updatedAt: -1, createdAt: -1 }).toArray();
  },

  async findById(id: string, userId: string): Promise<StoredResume | null> {
    const col = await resumesCollection();
    const doc = await col.findOne({ _id: id, userId });
    return doc ?? null;
  },

  async getCurrent(userId: string): Promise<StoredResume | null> {
    const col = await resumesCollection();
    // Find the marked current resume, or fallback to the most recently updated one
    const current = await col.findOne({ userId, isCurrent: true });
    if (current) return current;
    const latest = await col.find({ userId }).sort({ updatedAt: -1, createdAt: -1 }).limit(1).toArray();
    return latest[0] ?? null;
  },

  async create(input: CreateResumeInput): Promise<StoredResume> {
    const col = await resumesCollection();
    const now = new Date().toISOString();

    // If marked as current or if it's the user's first resume, mark as current
    let isCurrent = Boolean(input.isCurrent);
    if (!isCurrent) {
      const existingCount = await col.countDocuments({ userId: input.userId });
      if (existingCount === 0) {
        isCurrent = true;
      }
    }

    if (isCurrent) {
      await col.updateMany({ userId: input.userId, isCurrent: true }, { $set: { isCurrent: false } });
    }

    const resume: StoredResume = {
      ...input,
      _id: newResumeId(),
      isCurrent,
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(resume);
    return resume;
  },

  async update(id: string, userId: string, update: UpdateResumeInput): Promise<StoredResume | null> {
    const col = await resumesCollection();
    const now = new Date().toISOString();

    if (update.isCurrent) {
      await col.updateMany({ userId, isCurrent: true }, { $set: { isCurrent: false } });
    }

    const result = await col.findOneAndUpdate(
      { _id: id, userId },
      {
        $set: {
          ...update,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    );

    return result ?? null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const col = await resumesCollection();
    const existing = await col.findOne({ _id: id, userId });
    if (!existing) return false;

    const result = await col.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) return false;

    // If the deleted resume was current, pick the most recent one and make it current
    if (existing.isCurrent) {
      const next = await col.find({ userId }).sort({ updatedAt: -1, createdAt: -1 }).limit(1).toArray();
      if (next.length > 0 && next[0]) {
        await col.updateOne({ _id: next[0]._id }, { $set: { isCurrent: true } });
      }
    }

    return true;
  },

  async setCurrent(id: string, userId: string): Promise<StoredResume | null> {
    const col = await resumesCollection();
    const exists = await col.findOne({ _id: id, userId });
    if (!exists) return null;

    await col.updateMany({ userId, isCurrent: true }, { $set: { isCurrent: false } });
    const updated = await col.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isCurrent: true, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );

    return updated ?? null;
  },
};
