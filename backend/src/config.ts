import 'dotenv/config';

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
    throw new Error('JWT_SECRET is not configured. Set it in server/.env (copy from .env.example).');
  }
  return config.jwtSecret;
}

export function requireGeminiEncryptionKey(): string {
  if (!config.geminiEncryptionKey) {
    throw new Error('GEMINI_ENCRYPTION_KEY is not configured. Set a dedicated 32-byte secret in server/.env.');
  }
  return config.geminiEncryptionKey;
}
