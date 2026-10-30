import { getDb } from './db.js';
import type { StoredResumeAnalysis, FullResumeAnalysis } from '../types/resumeIntelligence.js';

async function analysesCollection() {
  const db = await getDb();
  const col = db.collection<StoredResumeAnalysis>('resume_analyses');
  await col.createIndex({ _id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ userId: 1, createdAt: -1 }).catch(() => {});
  return col;
}

function newAnalysisId(): string {
  return `ranalysis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const resumeAnalysisStore = {
  async listByUser(userId: string): Promise<Array<Omit<StoredResumeAnalysis, 'extractedText'>>> {
    const col = await analysesCollection();
    return col
      .find({ userId }, { projection: { extractedText: 0 } })
      .sort({ createdAt: -1 })
      .toArray() as unknown as Promise<Array<Omit<StoredResumeAnalysis, 'extractedText'>>>;
  },

  async findById(id: string, userId: string): Promise<StoredResumeAnalysis | null> {
    const col = await analysesCollection();
    const doc = await col.findOne({ _id: id, userId });
    return doc ?? null;
  },

  async create(data: {
    userId: string;
    fileName: string;
    fileType: 'pdf' | 'docx' | 'text';
    extractedText: string;
    targetRole?: string;
    jobDescription?: string;
    experienceLevel?: string;
    language?: 'english' | 'hinglish';
    analysis: FullResumeAnalysis;
  }): Promise<StoredResumeAnalysis> {
    const col = await analysesCollection();
    const doc: StoredResumeAnalysis = {
      _id: newAnalysisId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    await col.insertOne(doc);
    return doc;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const col = await analysesCollection();
    const result = await col.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  },
};
