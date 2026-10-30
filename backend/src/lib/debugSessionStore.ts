import { getDb } from './db.js';
import type { StoredDebugSession } from '../types/debugger.js';

async function sessionsCollection() {
  const db = await getDb();
  const col = db.collection<StoredDebugSession>('debug_sessions');
  await col.createIndex({ _id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ userId: 1, updatedAt: -1 }).catch(() => {});
  return col;
}

export function newDebugSessionId(): string {
  return `dsess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const debugSessionStore = {
  async listByUser(userId: string): Promise<Array<Omit<StoredDebugSession, 'originalCode' | 'correctedCode' | 'dryRun' | 'narrationEnglish' | 'narrationHinglish'>>> {
    const col = await sessionsCollection();
    return col
      .find({ userId }, { projection: { originalCode: 0, correctedCode: 0, dryRun: 0, narrationEnglish: 0, narrationHinglish: 0 } })
      .sort({ updatedAt: -1 })
      .toArray() as unknown as Promise<Array<Omit<StoredDebugSession, 'originalCode' | 'correctedCode' | 'dryRun' | 'narrationEnglish' | 'narrationHinglish'>>>;
  },

  async findById(id: string, userId: string): Promise<StoredDebugSession | null> {
    const col = await sessionsCollection();
    const doc = await col.findOne({ _id: id, userId });
    return doc ?? null;
  },

  async create(data: Omit<StoredDebugSession, '_id' | 'createdAt' | 'updatedAt'>): Promise<StoredDebugSession> {
    const col = await sessionsCollection();
    const now = new Date().toISOString();
    const doc: StoredDebugSession = {
      _id: newDebugSessionId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc);
    return doc;
  },

  async updateDryRun(id: string, userId: string, dryRun: StoredDebugSession['dryRun'], narrationEnglish: string[], narrationHinglish: string[]): Promise<boolean> {
    const col = await sessionsCollection();
    const result = await col.updateOne(
      { _id: id, userId },
      {
        $set: {
          dryRun,
          narrationEnglish,
          narrationHinglish,
          updatedAt: new Date().toISOString(),
        },
      }
    );
    return result.modifiedCount > 0;
  },

  async rename(id: string, userId: string, title: string): Promise<boolean> {
    const col = await sessionsCollection();
    const result = await col.updateOne(
      { _id: id, userId },
      {
        $set: {
          title: title.trim(),
          updatedAt: new Date().toISOString(),
        },
      }
    );
    return result.modifiedCount > 0;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const col = await sessionsCollection();
    const result = await col.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  },
};

