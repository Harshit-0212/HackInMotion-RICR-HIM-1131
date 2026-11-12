import crypto from 'node:crypto';
import { loadGeminiEncryptionKeyBuffer, config } from '../config.js';
import { getDb } from './db.js';

const COLLECTION = 'user_api_keys';
const ALGO = 'aes-256-gcm';

// ─── format helpers ──────────────────────────────────────────────────────────

/**
 * Validates Gemini API key format loosely:
 * - Trims whitespace and surrounding single/double quotes.
 * - Length between 20 and 256.
 * - Characters limited to letters, digits, dot, dash, and underscore.
 * Does NOT enforce any prefix (e.g. AIza or AQ.) or fixed 39 character length.
 */
export function sanitizeGeminiKey(key: unknown): string {
  if (typeof key !== 'string') return '';
  return key.trim().replace(/^["']|["']$/g, '').trim();
}

export function validateGeminiKeyFormat(key: string): boolean {
  const sanitized = sanitizeGeminiKey(key);
  if (sanitized.length < 20 || sanitized.length > 256) {
    return false;
  }
  return /^[A-Za-z0-9._-]+$/.test(sanitized);
}

/**
 * Encrypts a plaintext key using AES-256-GCM.
 * Uses the validated 32-byte master key buffer directly as the AES-256 key with random 12-byte IV.
 * Format: "v2:salt:iv:authTag:ciphertext" (all base64)
 */
export function encryptKey(plaintext: string): string {
  const masterSecret = loadGeminiEncryptionKeyBuffer();
  const salt = crypto.randomBytes(16);
  // Derive a per-record 32-byte key using scrypt from master secret and salt
  const derivedKey = crypto.scryptSync(masterSecret, salt, 32) as Buffer;
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM

  const cipher = crypto.createCipheriv(ALGO, derivedKey, iv);
  const ciphertextBuf = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    'v2',
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertextBuf.toString('base64'),
  ].join(':');
}

/**
 * Decrypts ciphertext with authentication tag verification.
 * Supports v2 (per-record salt) and backwards-compatible legacy v1 format.
 */
export function decryptKey(encrypted: string): string {
  const parts = encrypted.split(':');

  if (parts[0] === 'v2' && parts.length === 5) {
    const [, saltB64, ivB64, authTagB64, ciphertextB64] = parts;
    const masterSecret = loadGeminiEncryptionKeyBuffer();
    const salt = Buffer.from(saltB64, 'base64');
    const derivedKey = crypto.scryptSync(masterSecret, salt, 32) as Buffer;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGO, derivedKey, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
  }

  if (parts.length === 3) {
    // Legacy v1 format
    const [ivB64, authTagB64, ciphertextB64] = parts;
    const secret = config.jwtSecret;
    if (!secret) throw new Error('JWT_SECRET is required to decrypt legacy key.');
    const legacyDerivedKey = crypto.scryptSync(secret, 'cadence-gemini-salt', 32) as Buffer;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGO, legacyDerivedKey, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
  }

  throw new Error('Unsupported or corrupted encrypted key format.');
}

export function maskKey(key: string): string {
  if (key.length < 8) return '••••••••';
  const first = key.slice(0, 4);
  const last = key.slice(-4);
  return `${first}••••••••${last}`;
}

// ─── document shape ───────────────────────────────────────────────────────────

interface UserApiKeyDoc {
  _id: string; // userId
  encryptedKey: string;
  keyHint: string;
  provider: 'gemini';
  version?: 'v2';
  createdAt: string;
  updatedAt: string;
}

// ─── store ────────────────────────────────────────────────────────────────────

export const userApiKeyStore = {
  async saveGeminiKey(userId: string, plaintext: string): Promise<{ keyHint: string; updatedAt: string }> {
    const db = await getDb();
    const col = db.collection<UserApiKeyDoc>(COLLECTION);
    const encryptedKey = encryptKey(plaintext);
    const keyHint = maskKey(plaintext);
    const now = new Date().toISOString();

    await col.updateOne(
      { _id: userId },
      {
        $set: {
          encryptedKey,
          keyHint,
          provider: 'gemini',
          version: 'v2',
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return { keyHint, updatedAt: now };
  },

  async getGeminiKeyHint(userId: string): Promise<{ keyHint: string; updatedAt: string } | null> {
    const db = await getDb();
    const col = db.collection<UserApiKeyDoc>(COLLECTION);
    const doc = await col.findOne({ _id: userId });
    if (!doc) return null;
    return { keyHint: doc.keyHint, updatedAt: doc.updatedAt };
  },

  async getDecryptedGeminiKey(userId: string): Promise<string | null> {
    const db = await getDb();
    const col = db.collection<UserApiKeyDoc>(COLLECTION);
    const doc = await col.findOne({ _id: userId });
    if (!doc) return null;
    return decryptKey(doc.encryptedKey);
  },

  async deleteGeminiKey(userId: string): Promise<boolean> {
    const db = await getDb();
    const col = db.collection<UserApiKeyDoc>(COLLECTION);
    const res = await col.deleteOne({ _id: userId });
    return res.deletedCount > 0;
  },
};
