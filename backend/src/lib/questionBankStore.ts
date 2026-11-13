import { getDb } from './db.js';

export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'short_answer'
  | 'predict_output'
  | 'find_bug'
  | 'fill_blank'
  | 'coding';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'draft' | 'needs_review' | 'approved' | 'rejected' | 'published';

export interface CodingTestCase {
  input: string;
  expectedOutput: string;
  isSample?: boolean;
}

export interface QuestionBankDoc {
  _id?: string;
  id: string;
  batchId?: string;
  fieldId: string;
  fieldName: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  category: 'Normal' | 'Special' | 'Interview Practice';
  roleTarget?: string; // Optional e.g. "Java Developer", "Frontend"
  type: QuestionType;
  difficulty: QuestionDifficulty;
  prompt: string;
  codeSnippet?: string;
  options?: string[]; // exactly 4 for MCQ
  correctAnswer: string;
  explanation: string;
  // Coding-specific fields
  constraints?: string;
  sampleCases?: CodingTestCase[];
  testCases?: CodingTestCase[]; // At least 5
  referenceSolution?: string;
  referenceLanguage?: string;
  verificationStatus?: 'verified' | 'unverified' | 'failed';
  // QC & Audit
  solverAgreement?: boolean;
  solverExplanation?: string;
  source: 'Original (AI-generated)' | 'Licensed Import';
  license?: string;
  modelName: string;
  promptVersion: string;
  status: QuestionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BatchGenerationJob {
  _id?: string;
  jobId: string;
  userId: string;
  fieldId: string;
  subjectId: string;
  topicId: string;
  totalRequested: number;
  generatedCount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const COLLECTION = 'question_bank';
const JOBS_COLLECTION = 'question_generation_jobs';

export const questionBankStore = {
  async ensureIndexes(): Promise<void> {
    const db = await getDb();
    const col = db.collection<QuestionBankDoc>(COLLECTION);
    await col.createIndex({ id: 1 }, { unique: true });
    await col.createIndex({ fieldId: 1, subjectId: 1, topicId: 1 });
    await col.createIndex({ batchId: 1 });
    await col.createIndex({ status: 1 });
  },

  async insertMany(questions: QuestionBankDoc[]): Promise<void> {
    if (questions.length === 0) return;
    const db = await getDb();
    await db.collection<QuestionBankDoc>(COLLECTION).insertMany(questions);
  },

  async list(filters: {
    status?: QuestionStatus;
    fieldId?: string;
    subjectId?: string;
    topicId?: string;
    type?: QuestionType;
    difficulty?: QuestionDifficulty;
    batchId?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ questions: QuestionBankDoc[]; total: number }> {
    const db = await getDb();
    const query: any = {};

    if (filters.status) query.status = filters.status;
    if (filters.fieldId) query.fieldId = filters.fieldId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.topicId) query.topicId = filters.topicId;
    if (filters.type) query.type = filters.type;
    if (filters.difficulty) query.difficulty = filters.difficulty;
    if (filters.batchId) query.batchId = filters.batchId;
    if (filters.search) {
      query.prompt = { $regex: filters.search, $options: 'i' };
    }

    const col = db.collection<QuestionBankDoc>(COLLECTION);
    const total = await col.countDocuments(query);
    const questions = await col
      .find(query)
      .sort({ createdAt: -1 })
      .skip(filters.skip || 0)
      .limit(filters.limit || 50)
      .toArray();

    return { questions, total };
  },

  async getById(id: string): Promise<QuestionBankDoc | null> {
    const db = await getDb();
    return db.collection<QuestionBankDoc>(COLLECTION).findOne({ id });
  },

  async update(id: string, patch: Partial<QuestionBankDoc>): Promise<boolean> {
    const db = await getDb();
    const res = await db.collection<QuestionBankDoc>(COLLECTION).updateOne(
      { id },
      { $set: { ...patch, updatedAt: new Date().toISOString() } }
    );
    return res.modifiedCount > 0;
  },

  async updateBatchStatus(batchId: string, status: QuestionStatus): Promise<number> {
    const db = await getDb();
    const res = await db.collection<QuestionBankDoc>(COLLECTION).updateMany(
      { batchId },
      { $set: { status, updatedAt: new Date().toISOString() } }
    );
    return res.modifiedCount;
  },

  async deleteBatch(batchId: string): Promise<number> {
    const db = await getDb();
    const res = await db.collection<QuestionBankDoc>(COLLECTION).deleteMany({ batchId });
    return res.deletedCount;
  },

  async getCoverageStats(): Promise<Array<{
    fieldId: string;
    fieldName: string;
    subjectId: string;
    subjectName: string;
    topicId: string;
    topicName: string;
    total: number;
    published: number;
    draft: number;
    needsReview: number;
    easy: number;
    medium: number;
    hard: number;
  }>> {
    const db = await getDb();
    const col = db.collection<QuestionBankDoc>(COLLECTION);

    const pipeline = [
      {
        $group: {
          _id: {
            fieldId: '$fieldId',
            fieldName: '$fieldName',
            subjectId: '$subjectId',
            subjectName: '$subjectName',
            topicId: '$topicId',
            topicName: '$topicName',
          },
          total: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] },
          },
          draft: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
          },
          needsReview: {
            $sum: { $cond: [{ $eq: ['$status', 'needs_review'] }, 1, 0] },
          },
          easy: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] },
          },
          medium: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] },
          },
          hard: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] },
          },
        },
      },
    ];

    const results = await col.aggregate(pipeline).toArray();

    return results.map((r: any) => ({
      fieldId: r._id.fieldId,
      fieldName: r._id.fieldName,
      subjectId: r._id.subjectId,
      subjectName: r._id.subjectName,
      topicId: r._id.topicId,
      topicName: r._id.topicName,
      total: r.total,
      published: r.published,
      draft: r.draft,
      needsReview: r.needsReview,
      easy: r.easy,
      medium: r.medium,
      hard: r.hard,
    }));
  },

  // Jobs
  async createJob(job: BatchGenerationJob): Promise<void> {
    const db = await getDb();
    await db.collection<BatchGenerationJob>(JOBS_COLLECTION).insertOne(job);
  },

  async updateJob(jobId: string, patch: Partial<BatchGenerationJob>): Promise<void> {
    const db = await getDb();
    await db.collection<BatchGenerationJob>(JOBS_COLLECTION).updateOne(
      { jobId },
      { $set: { ...patch, updatedAt: new Date().toISOString() } }
    );
  },

  async getJob(jobId: string): Promise<BatchGenerationJob | null> {
    const db = await getDb();
    return db.collection<BatchGenerationJob>(JOBS_COLLECTION).findOne({ jobId });
  },
};

