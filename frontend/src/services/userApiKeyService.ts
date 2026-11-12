import { fetchApi } from './api';

export interface UserApiKeyStatus {
  connected: boolean;
  keyHint?: string;
  updatedAt?: string;
  siteFallbackAvailable?: boolean;
}

export const userApiKeyService = {
  async getGeminiStatus(): Promise<UserApiKeyStatus> {
    return fetchApi('/user/api-keys/gemini/status');
  },

  async saveGeminiKey(apiKey: string): Promise<{ success: boolean; keyHint: string; updatedAt: string }> {
    return fetchApi('/user/api-keys/gemini', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  },

  async deleteGeminiKey(): Promise<{ success: boolean }> {
    return fetchApi('/user/api-keys/gemini', {
      method: 'DELETE',
    });
  },

  async testGeminiKey(apiKey: string): Promise<{ valid: boolean; warning?: string }> {
    return fetchApi('/user/api-keys/gemini/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  },
};
