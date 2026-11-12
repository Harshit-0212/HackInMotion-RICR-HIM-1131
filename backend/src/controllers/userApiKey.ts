import type { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AuthedRequest } from '../middleware/auth.js';
import { userApiKeyStore, validateGeminiKeyFormat } from '../lib/userApiKeyStore.js';
import { config } from '../config.js';

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

    const trimmed = apiKey.trim();
    if (!validateGeminiKeyFormat(trimmed)) {
      res.status(400).json({
        error: {
          message: 'Invalid Gemini API key format. Standard Google API keys start with "AIza" followed by 35 characters.',
        },
      });
      return;
    }

    try {
      const result = await userApiKeyStore.saveGeminiKey(userId, trimmed);
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

    const trimmed = apiKey.trim();
    if (!validateGeminiKeyFormat(trimmed)) {
      res.status(400).json({
        error: {
          message: 'Invalid Gemini API key format. Expected "AIza..." format.',
        },
      });
      return;
    }

    try {
      const ai = new GoogleGenerativeAI(trimmed);
      const model = ai.getGenerativeModel({ model: config.geminiModel });
      // Minimal dry run
      await model.countTokens({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }] });
      res.json({ data: { valid: true } });
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      if (/401|403|API_KEY_INVALID|permission|API key not valid/i.test(rawMsg)) {
        res.status(400).json({ error: { message: 'Google rejected this API key. Verify that the key is valid and has Generative Language API enabled.' } });
        return;
      }
      if (/quota|rate limit|429/i.test(rawMsg)) {
        res.json({ data: { valid: true, warning: 'Key is valid, but your Google Gemini account has exceeded its current rate limit or quota.' } });
        return;
      }
      res.status(400).json({ error: { message: 'Could not verify the key with Google Gemini. Check your network or key status.' } });
    }
  },
};

