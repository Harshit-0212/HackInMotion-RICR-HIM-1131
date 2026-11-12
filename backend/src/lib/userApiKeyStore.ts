import crypto from 'node:crypto';
import { requireGeminiEncryptionKey, config } from '../config.js';
import { getDb } from './db.js';

const COLLECTION = 'user_api_keys';
const ALGO = 'aes-256-gcm';

// ─── format helpers ──────────────────────────────────────────────────────────

export function validateGeminiKeyFormat(key: string): boolean {
  return /^AIza[0-9A-Za-z_-]{35}$/.test(key);
}

/**
 * Encrypts a plaintext key using AES-256-GCM.
 * Generates a fresh 16-byte random salt and 12-byte IV for every single record.
 * Output format: "v2:salt:iv:authTag:ciphertext" (all base64)
 */
export function encryptKey(plaintext: string): string {
  // Strict requirement: new encryption operations MUST use the dedicated master key
  const masterSecret = requireGeminiEncryptionKey();
  const salt = crypto.randomBytes(16);
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
 * Supports v2 (unique per-record salt) and backwards-compatible legacy v1 format.
 */
export function decryptKey(encrypted: string): string {
  const parts = encrypted.split(':');

  if (parts[0] === 'v2' && parts.length === 5) {
    // Current v2 format: v2:salt:iv:authTag:ciphertext
    const [, saltB64, ivB64, authTagB64, ciphertextB64] = parts;
    const masterSecret = requireGeminiEncryptionKey();
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
    // Legacy v1 format: iv:authTag:ciphertext (with fixed salt from JWT_SECRET)
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

function maskKey(key: string): string {
  if (key.length < 8) return '••••••••';
  const first = key.slice(0, 4);
  const last = key.slice(-4);
  const dots = '•'.repeat(Math.min(8, key.length - 8));
  return `${first}${dots}${last}`;
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
        $set: { encryptedKey, keyHint, provider: 'gemini', version: 'v2', updatedAt: now },
        $setOnInsert: { _id: userId, createdAt: now },
      } as Parameters<typeof col.updateOne>[1],
      { upsert: true }
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

  /** NEVER send the decrypted return value to the client. */
  async getDecryptedGeminiKey(userId: string): Promise<string | null> {
    const db = await getDb();
    const col = db.collection<UserApiKeyDoc>(COLLECTION);
    const doc = await col.findOne({ _id: userId });
    if (!doc) return null;
    try {
      const decrypted = decryptKey(doc.encryptedKey);
      // Auto-migrate legacy format to v2 on read if still in legacy format
      if (!doc.version && doc.encryptedKey.split(':').length === 3) {
        const reEncrypted = encryptKey(decrypted);
        await col.updateOne(
          { _id: userId },
          { $set: { encryptedKey: reEncrypted, version: 'v2', updatedAt: new Date().toISOString() } }
        ).catch(() => {});
      }
      return decrypted;
    } catch {
      return null;
    }
  },

  async deleteGeminiKey(userId: string): Promise<void> {
    const db = await getDb();
    const col = db.collection<UserApiKeyDoc>(COLLECTION);
    await col.deleteOne({ _id: userId });
  },
};
