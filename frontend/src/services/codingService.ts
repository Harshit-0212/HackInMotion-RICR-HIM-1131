import { fetchApi } from './api';
import type {
  PublicCodingProblemListItem,
  PublicCodingProblemDetail,
  RunCodeResult,
  StoredCodingProblem,
  StoredCodingTestCase,
  StoredCodingProblemPrivate,
  CreateCodingProblemInput,
  UpdateCodingProblemInput,
  CreateTestCaseInput,
  UpdateTestCaseInput,
  UpdatePrivateContentInput,
  ReviewProblemInput,
  GenerateDraftInput,
  ProblemStatus,
  ProblemDifficulty,
} from '@/types/coding';

export const codingService = {
  // --- Student-Facing Public APIs ---
  async getPublishedProblems(params: {
    difficulty?: ProblemDifficulty;
    topic?: string;
    tag?: string;
    search?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ problems: PublicCodingProblemListItem[]; total: number; page: number; limit: number }> {
    const query = new URLSearchParams();
    if (params.difficulty) query.set('difficulty', params.difficulty);
    if (params.topic) query.set('topic', params.topic);
    if (params.tag) query.set('tag', params.tag);
    if (params.search) query.set('search', params.search);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.skip !== undefined) query.set('skip', String(params.skip));

    const qs = query.toString();
    return fetchApi(`/coding/problems${qs ? `?${qs}` : ''}`);
  },

  async getPublishedFilters(): Promise<{ topics: string[]; tags: string[]; difficulties: ProblemDifficulty[] }> {
    return fetchApi('/coding/problems/filters');
  },

  async getCapabilities(): Promise<{ supportedLanguages: import('@/types/coding').SupportedCodingLanguage[]; compilers: Record<string, string> }> {
    return fetchApi('/coding/capabilities');
  },

  async getProblemBySlug(slug: string): Promise<PublicCodingProblemDetail> {
    return fetchApi(`/coding/problems/${encodeURIComponent(slug)}`);
  },

  async runCode(payload: { language: string; code: string; input?: string }): Promise<RunCodeResult> {
    return fetchApi('/coding/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- Admin-Facing Studio APIs ---
  async listAdminProblems(params: {
    status?: ProblemStatus;
    difficulty?: ProblemDifficulty;
    topic?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ problems: StoredCodingProblem[]; total: number }> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.difficulty) query.set('difficulty', params.difficulty);
    if (params.topic) query.set('topic', params.topic);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.skip !== undefined) query.set('skip', String(params.skip));

    const qs = query.toString();
    return fetchApi(`/admin/coding/problems${qs ? `?${qs}` : ''}`);
  },

  async getAdminProblem(id: string): Promise<{
    problem: StoredCodingProblem;
    testCases: StoredCodingTestCase[];
    privateContent: StoredCodingProblemPrivate | null;
  }> {
    return fetchApi(`/admin/coding/problems/${encodeURIComponent(id)}`);
  },

  async createProblem(input: CreateCodingProblemInput): Promise<StoredCodingProblem> {
    return fetchApi('/admin/coding/problems', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateProblem(id: string, input: UpdateCodingProblemInput): Promise<StoredCodingProblem> {
    return fetchApi(`/admin/coding/problems/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async generateDraft(input: GenerateDraftInput): Promise<{
    problem: StoredCodingProblem;
    testCases: StoredCodingTestCase[];
    privateContent: StoredCodingProblemPrivate | null;
  }> {
    return fetchApi('/admin/coding/problems/generate-draft', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async addTestCase(problemId: string, input: CreateTestCaseInput): Promise<StoredCodingTestCase> {
    return fetchApi(`/admin/coding/problems/${encodeURIComponent(problemId)}/test-cases`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateTestCase(problemId: string, caseId: string, input: UpdateTestCaseInput): Promise<StoredCodingTestCase> {
    return fetchApi(`/admin/coding/problems/${encodeURIComponent(problemId)}/test-cases/${encodeURIComponent(caseId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async deleteTestCase(problemId: string, caseId: string): Promise<{ success: boolean }> {
    return fetchApi(`/admin/coding/problems/${encodeURIComponent(problemId)}/test-cases/${encodeURIComponent(caseId)}`, {
      method: 'DELETE',
    });
  },

  async updatePrivateContent(problemId: string, input: UpdatePrivateContentInput): Promise<StoredCodingProblemPrivate> {
    return fetchApi(`/admin/coding/problems/${encodeURIComponent(problemId)}/private-content`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async reviewProblem(problemId: string, input: ReviewProblemInput): Promise<StoredCodingProblem> {
    return fetchApi(`/admin/coding/problems/${encodeURIComponent(problemId)}/review`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async publishProblem(problemId: string): Promise<StoredCodingProblem> {
    return fetchApi(`/admin/coding/problems/${encodeURIComponent(problemId)}/publish`, {
      method: 'POST',
    });
  },

  async archiveProblem(problemId: string): Promise<StoredCodingProblem> {
    return fetchApi(`/admin/coding/problems/${encodeURIComponent(problemId)}/archive`, {
      method: 'POST',
    });
  },
};

