import { fetchApi } from './api';

export interface TopicItem {
  id: string;
  name: string;
  slug: string;
  questionCount?: number;
}

export interface SubjectItem {
  id: string;
  name: string;
  slug: string;
  topics: TopicItem[];
}

export interface TaxonomyField {
  id: string;
  name: string;
  slug: string;
  category: 'Normal' | 'Special' | 'Interview Practice';
  subjects: SubjectItem[];
}

export interface QuestionBankItem {
  id: string;
  batchId?: string;
  fieldId: string;
  fieldName: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  category: string;
  roleTarget?: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  codeSnippet?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  status: 'draft' | 'needs_review' | 'approved' | 'rejected' | 'published';
  solverAgreement?: boolean;
  solverExplanation?: string;
  verificationStatus?: string;
  source: string;
  license?: string;
  modelName: string;
  createdAt: string;
}

export interface CoverageStat {
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
}

export const adminTaxonomyService = {
  async getTaxonomy(): Promise<TaxonomyField[]> {
    const res = (await fetchApi('/admin/coding/taxonomy')) as any;
    return res.data || [];
  },

  async addField(name: string, category: string): Promise<TaxonomyField> {
    const res = (await fetchApi('/admin/coding/taxonomy/fields', {
      method: 'POST',
      body: JSON.stringify({ name, category }),
    })) as any;
    return res.data;
  },

  async addSubject(fieldId: string, name: string): Promise<SubjectItem> {
    const res = (await fetchApi(`/admin/coding/taxonomy/fields/${fieldId}/subjects`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })) as any;
    return res.data;
  },

  async addTopic(fieldId: string, subjectId: string, name: string): Promise<TopicItem> {
    const res = (await fetchApi(`/admin/coding/taxonomy/fields/${fieldId}/subjects/${subjectId}/topics`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })) as any;
    return res.data;
  },

  async startBulkGeneration(payload: {
    fieldId: string;
    fieldName: string;
    subjectId: string;
    subjectName: string;
    topicId: string;
    topicName: string;
    category: string;
    roleTarget?: string;
    count: number;
    difficultyMix: { easy: number; medium: number; hard: number };
    questionTypes: string[];
  }): Promise<{ batchId: string; message: string }> {
    const res = (await fetchApi('/admin/coding/taxonomy/generate-bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    })) as any;
    return res.data;
  },

  async getJobStatus(jobId: string): Promise<{
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    generatedCount: number;
    totalRequested: number;
    error?: string;
  }> {
    const res = (await fetchApi(`/admin/coding/taxonomy/jobs/${jobId}`)) as any;
    return res.data;
  },

  async listQuestions(params?: {
    status?: string;
    fieldId?: string;
    subjectId?: string;
    topicId?: string;
    type?: string;
    difficulty?: string;
    batchId?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ questions: QuestionBankItem[]; total: number }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, String(v));
      });
    }
    const res = (await fetchApi(`/admin/coding/taxonomy/questions?${query.toString()}`)) as any;
    return res.data || { questions: [], total: 0 };
  },

  async updateQuestionStatus(id: string, status: string): Promise<void> {
    await fetchApi(`/admin/coding/taxonomy/questions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async publishBatch(batchId: string): Promise<{ publishedCount: number }> {
    const res = (await fetchApi(`/admin/coding/taxonomy/batches/${batchId}/publish`, {
      method: 'POST',
    })) as any;
    return res.data;
  },

  async undoBatch(batchId: string): Promise<{ deletedCount: number }> {
    const res = (await fetchApi(`/admin/coding/taxonomy/batches/${batchId}`, {
      method: 'DELETE',
    })) as any;
    return res.data;
  },

  async getCoverage(): Promise<CoverageStat[]> {
    const res = (await fetchApi('/admin/coding/taxonomy/coverage')) as any;
    return res.data || [];
  },

  async importLicensed(payload: {
    questions: any[];
    license: string;
    sourceName: string;
  }): Promise<{ importedCount: number }> {
    const res = (await fetchApi('/admin/coding/taxonomy/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    })) as any;
    return res.data;
  },
};

