import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load dotenv before any other configuration access, anchored to the backend root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Works whether running from src/ (depth 1) or dist/ (depth 1)
const backendEnvPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: backendEnvPath });

// Also fallback to process.cwd() .env if not found or empty
if (!process.env.GEMINI_ENCRYPTION_KEY && !process.env.JWT_SECRET) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const normalizeOrigin = (origin?: string) => origin?.replace(/\/+$/, '');

export const config = {
  get port() { return Number(process.env.PORT) || 3001; },
  get clientOrigin() { return normalizeOrigin(process.env.CLIENT_ORIGIN) || 'http://localhost:5173'; },
  get jwtSecret() { return process.env.JWT_SECRET || ''; },
  get geminiEncryptionKey() { return getRawGeminiEncryptionKey(); },
  get geminiApiKey() { return process.env.GEMINI_API_KEY || ''; },
  get geminiModel() { return process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'; },
  get youtubeApiKey() { return process.env.YOUTUBE_API_KEY || ''; },
  get mongoUri() { return process.env.MONGODB_URI || 'mongodb://localhost:27017/'; },
  get mongoDbName() { return process.env.MONGODB_DB_NAME || 'nova'; },
  get googleClientId() { return process.env.GOOGLE_CLIENT_ID || ''; },
  get codeExecutionApiKey() { return process.env.CODE_EXECUTION_API_KEY || ''; },
  get resendApiKey() { return process.env.RESEND_API_KEY || ''; },
  get emailFrom() { return process.env.EMAIL_FROM || 'Cadence <onboarding@resend.dev>'; },
};

/**
 * Reads and cleans the raw GEMINI_ENCRYPTION_KEY at call time.
 * Trims whitespace and strips matching outer quotes.
 */
export function getRawGeminiEncryptionKey(): string {
  // Ensure dotenv is loaded
  if (!process.env.GEMINI_ENCRYPTION_KEY) {
    dotenv.config({ path: backendEnvPath });
  }
  const val = process.env.GEMINI_ENCRYPTION_KEY || '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

export function requireJwtSecret(): string {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured. Set it in backend/.env (copy from .env.example).');
  }
  return config.jwtSecret;
}

/**
 * Loads, sanitizes, and decodes GEMINI_ENCRYPTION_KEY inside a function at call time.
 * Accepts 64-char hex OR base64 encoding that resolves to exactly 32 bytes.
 */
export function loadGeminiEncryptionKeyBuffer(): Buffer {
  const raw = getRawGeminiEncryptionKey();
  if (!raw) {
    throw new Error('GEMINI_ENCRYPTION_KEY is missing. Configure a 32-byte hex or base64 secret in backend/.env.');
  }

  let buf: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    buf = Buffer.from(raw, 'hex');
  } else if (/^[A-Za-z0-9+/=]+$/.test(raw)) {
    buf = Buffer.from(raw, 'base64');
  } else {
    throw new Error('GEMINI_ENCRYPTION_KEY has an invalid format. Expected 64-character hex or base64.');
  }

  if (buf.length !== 32) {
    throw new Error(`GEMINI_ENCRYPTION_KEY decoded to ${buf.length} bytes; expected exactly 32 bytes.`);
  }

  return buf;
}

export function requireGeminiEncryptionKey(): string {
  loadGeminiEncryptionKeyBuffer();
  return getRawGeminiEncryptionKey();
}
