import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load dotenv anchored to backend directory, regardless of process.cwd()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: backendEnvPath });

const normalizeOrigin = (origin?: string) => origin?.replace(/\/+$/, '');

export const config = {
  port: Number(process.env.PORT) || 3001,
  clientOrigin: normalizeOrigin(process.env.CLIENT_ORIGIN) || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || '',
  geminiEncryptionKey: process.env.GEMINI_ENCRYPTION_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
  youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/',
  mongoDbName: process.env.MONGODB_DB_NAME || 'nova',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  codeExecutionApiKey: process.env.CODE_EXECUTION_API_KEY || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Cadence <onboarding@resend.dev>',
};

export function requireJwtSecret(): string {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured. Set it in backend/.env (copy from .env.example).');
  }
  return config.jwtSecret;
}

/**
 * Loads, sanitizes, and decodes GEMINI_ENCRYPTION_KEY.
 * Accepts 64-char hex OR base64 encoding that resolves to exactly 32 bytes.
 */
export function loadGeminiEncryptionKeyBuffer(): Buffer {
  const raw = (process.env.GEMINI_ENCRYPTION_KEY || config.geminiEncryptionKey || '').trim().replace(/^['"]|['"]$/g, '');
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
  // Returns raw string for backward compatibility after validating buffer
  loadGeminiEncryptionKeyBuffer();
  return (process.env.GEMINI_ENCRYPTION_KEY || config.geminiEncryptionKey || '').trim().replace(/^['"]|['"]$/g, '');
}
