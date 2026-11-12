import type { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AuthedRequest } from '../middleware/auth.js';
import { userApiKeyStore, validateGeminiKeyFormat, sanitizeGeminiKey } from '../lib/userApiKeyStore.js';
import { config, loadGeminiEncryptionKeyBuffer } from '../config.js';

/**
 * Verifies a Gemini key via live HTTP request against Google's native endpoint:
 * GET https://generativelanguage.googleapis.com/v1beta/models?pageSize=1
 * Never logs or echoes the raw key.
 */
async function verifyGeminiKeyWithGoogle(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 400 || response.status === 401 || response.status === 403) {
      return {
        valid: false,
        error: 'Google rejected this API key. Verify that the key is active and has the Generative Language API enabled in Google AI Studio.',
      };
    }

    if (response.status === 429) {
      return {
        valid: false,
        error: 'Google Gemini service rate limit or quota exceeded. Please try again shortly.',
      };
    }

    return {
      valid: false,
      error: `Verification request failed with status ${response.status}. Please check your key.`,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        valid: false,
        error: 'Network timeout while contacting Google Gemini servers. Please try again.',
      };
    }
    return {
      valid: false,
      error: 'Network error connecting to Google Gemini verification endpoint. Please check server connectivity.',
    };
  }
}

export const userApiKeyController = {
  /**
   * GET /api/user/api-keys/gemini/status
   * Returns whether the user has connected a Gemini API key, plus a masked hint.
   * NEVER returns the decrypted key.
   */
  async getStatus(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    try {
      const hint = await userApiKeyStore.getGeminiKeyHint(userId);
      if (!hint) {
        res.json({
          data: {
            connected: false,
            siteFallbackAvailable: Boolean(config.geminiApiKey),
          },
        });
        return;
      }
      res.json({
        data: {
          connected: true,
          keyHint: hint.keyHint,
          updatedAt: hint.updatedAt,
          siteFallbackAvailable: Boolean(config.geminiApiKey),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve API key status.';
      res.status(500).json({ error: { message } });
    }
  },

  /**
   * POST /api/user/api-keys/gemini
   * Validates and saves an encrypted Gemini API key for the authenticated user.
   * Never logs or echoes the raw key.
   */
  async saveKey(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { apiKey } = req.body || {};

    if (!apiKey || typeof apiKey !== 'string') {
      res.status(400).json({ error: { message: 'Gemini API key is required.' } });
      return;
    }

    const sanitized = sanitizeGeminiKey(apiKey);
    if (!validateGeminiKeyFormat(sanitized)) {
      res.status(400).json({
        error: {
          message: 'Invalid Gemini API key format. API keys should be 20-256 characters long (letters, digits, dots, dashes, or underscores).',
        },
      });
      return;
    }

    // Step 3: Verify with live request to native Google endpoint before saving
    const verification = await verifyGeminiKeyWithGoogle(sanitized);
    if (!verification.valid) {
      res.status(400).json({
        error: {
          message: verification.error || 'Google rejected this API key. Verify that the key is valid.',
        },
      });
      return;
    }

    try {
      // Validate master encryption key buffer first to return clear actionable error
      loadGeminiEncryptionKeyBuffer();
      const result = await userApiKeyStore.saveGeminiKey(userId, sanitized);
      res.json({
        data: {
          success: true,
          keyHint: result.keyHint,
          updatedAt: result.updatedAt,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save Gemini API key.';
      res.status(500).json({ error: { message } });
    }
  },

  /**
   * DELETE /api/user/api-keys/gemini
   * Disconnects / removes the user's stored Gemini API key.
   */
  async deleteKey(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    try {
      await userApiKeyStore.deleteGeminiKey(userId);
      res.json({ data: { success: true } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove Gemini API key.';
      res.status(500).json({ error: { message } });
    }
  },

  /**
   * POST /api/user/api-keys/gemini/test
   * Validates a candidate Gemini key against the Google Generative AI API before saving.
   * Does NOT persist the key.
   */
  async testKey(req: AuthedRequest, res: Response): Promise<void> {
    const { apiKey } = req.body || {};
    if (!apiKey || typeof apiKey !== 'string') {
      res.status(400).json({ error: { message: 'API key is required to test.' } });
      return;
    }

    const sanitized = sanitizeGeminiKey(apiKey);
    if (!validateGeminiKeyFormat(sanitized)) {
      res.status(400).json({
        error: {
          message: 'Invalid Gemini API key format. API keys should be 20-256 characters long (letters, digits, dots, dashes, or underscores).',
        },
      });
      return;
    }

    const verification = await verifyGeminiKeyWithGoogle(sanitized);
    if (!verification.valid) {
      res.status(400).json({
        error: {
          message: verification.error || 'Google rejected this API key.',
        },
      });
      return;
    }

    res.json({ data: { valid: true } });
  },

  /**
   * POST /api/user/api-keys/gemini/test-saved
   * Tests the currently saved key (or fallbacks to server key).
   */
  async testSavedKey(req: AuthedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    try {
      const userKey = await userApiKeyStore.getDecryptedGeminiKey(userId);
      const activeKey = userKey || config.geminiApiKey;
      if (!activeKey) {
        res.status(400).json({ error: { message: 'No Gemini API key saved, and no server fallback key is configured.' } });
        return;
      }

      const ai = new GoogleGenerativeAI(activeKey);
      const model = ai.getGenerativeModel({ model: config.geminiModel });
      await model.countTokens({ contents: [{ role: 'user', parts: [{ text: 'connection test' }] }] });
      res.json({ data: { valid: true, source: userKey ? 'user' : 'server-fallback' } });
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: { message: `Gemini connection failed: ${rawMsg}` } });
    }
  },
};
