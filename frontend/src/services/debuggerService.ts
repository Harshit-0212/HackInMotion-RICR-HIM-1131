import { fetchApi } from './api';
import type {
  AnalyzeCodeInput,
  GeminiDebugAnalysisResult,
  StoredDebugSession,
  StoredDebugSessionSummary,
  ExplainCodeInput,
  ExplainCodeResult,
  DryRunStep,
  SupportedDebuggerLanguage,
} from '@/types/debugger';

export const debuggerService = {
  /**
   * Analyze code, detect bugs, produce fixes and dry-run steps
   */
  async analyze(input: AnalyzeCodeInput): Promise<{ sessionId: string; analysis: GeminiDebugAnalysisResult }> {
    return fetchApi('/debugger/analyze', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Explain a specific line, error, or concept
   */
  async explain(input: ExplainCodeInput): Promise<ExplainCodeResult> {
    return fetchApi('/debugger/explain', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Regenerate dry run trace
   */
  async dryRun(input: {
    language: SupportedDebuggerLanguage;
    code: string;
    sessionId?: string;
  }): Promise<{ dryRun: DryRunStep[]; narrationEnglish: string[]; narrationHinglish: string[] }> {
    return fetchApi('/debugger/dry-run', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * List all user debugging sessions
   */
  async listHistory(): Promise<StoredDebugSessionSummary[]> {
    return fetchApi('/debugger/history');
  },

  /**
   * Fetch a specific session by ID
   */
  async getSession(id: string): Promise<StoredDebugSession> {
    return fetchApi(`/debugger/${id}`);
  },

  /**
   * Delete a session
   */
  async deleteSession(id: string): Promise<{ success: boolean }> {
    return fetchApi(`/debugger/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Rename a session
   */
  async renameSession(id: string, title: string): Promise<{ success: boolean; title: string }> {
    return fetchApi(`/debugger/${id}/rename`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },
};

