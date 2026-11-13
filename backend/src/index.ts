import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, getRawGeminiEncryptionKey } from './config.js';
import { authRouter } from './routes/auth.js';
import { documentsRouter } from './routes/documents.js';
import { tutorRouter } from './routes/tutor.js';
import { mocktestRouter } from './routes/mocktest.js';
import { studyPlanRouter } from './routes/studyplan.js';
import { groupsRouter } from './routes/groups.js';
import { goalsRouter } from './routes/goals.js';
import { progressRouter } from './routes/progress.js';
import { resumeRouter } from './routes/resume.js';
import { resumeBuilderRouter } from './routes/resumeBuilder.js';
import { resumeAnalyzerRouter } from './routes/resumeAnalyzer.js';
import { debuggerRouter } from './routes/debugger.js';
import { adminCodingRouter } from './routes/adminCoding.js';
import { studentCodingRouter } from './routes/studentCoding.js';
import { studentJourneyRouter } from './routes/studentJourney.js';
import { adminJourneyRouter } from './routes/adminJourney.js';
import { userApiKeyRouter } from './routes/userApiKey.js';
import { gamificationRouter } from './routes/gamification.js';
import { featuresRouter } from './routes/features.js';
import { activityRouter } from './routes/activity.js';
import { activityStore } from './lib/activityStore.js';
import { getDb } from './lib/db.js';
import { initSocket } from './lib/socket.js';
import { sendDueStudyReminders } from './lib/reminders.js';
import { warmUpGoogleClient } from './lib/googleAuth.js';
import { seedArraysJourneyIfMissing } from './lib/seedArraysJourney.js';

const app = express();
const httpServer = http.createServer(app);
initSocket(httpServer);

const normalizeOrigin = (origin?: string) =>
  origin?.replace(/\/+$/, '');

const clientOrigin = normalizeOrigin(process.env.CLIENT_ORIGIN);

const allowedOrigins = [
  clientOrigin,
  'http://localhost:5173',
].filter(Boolean) as string[];

console.log('CORS allowed origins:', allowedOrigins);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = normalizeOrigin(origin);

      if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    data: {
      ok: true,
      geminiConfigured: Boolean(config.geminiApiKey),
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/tutor', tutorRouter);
app.use('/api/mocktest', mocktestRouter);
app.use('/api/studyplan', studyPlanRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/resume-builder', resumeBuilderRouter);
app.use('/api/resume-analyzer', resumeAnalyzerRouter);
app.use('/api/debugger', debuggerRouter);
app.use('/api/admin/coding', adminCodingRouter);
app.use('/api/coding', studentCodingRouter);
app.use('/api/learn', studentJourneyRouter);
app.use('/api/admin/journey', adminJourneyRouter);
app.use('/api/user/api-keys', userApiKeyRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/activity', activityRouter);
app.use('/api', featuresRouter);

app.use((req, res) => {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.path}` } });
});

// Centralized error handler — keeps stack traces out of client responses.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: { message: 'Internal server error.' } });
});

async function start() {
  if (!config.jwtSecret) {
    console.warn('[nova-server] WARNING: JWT_SECRET is not set. Copy server/.env.example to server/.env and set one.');
  }

  // Startup log: Log whether GEMINI_ENCRYPTION_KEY is present and its length (never the value)
  const rawKey = getRawGeminiEncryptionKey();
  if (rawKey) {
    console.log(`[nova-server] GEMINI_ENCRYPTION_KEY present (length: ${rawKey.length} chars).`);
  } else {
    console.warn('[nova-server] WARNING: GEMINI_ENCRYPTION_KEY is not set (missing). User key encryption will fail until configured.');
  }

  if (!config.geminiApiKey) {
    console.warn(
      '[nova-server] WARNING: GEMINI_API_KEY is not set. Document analysis will fail until it is configured.',
    );
  }
  if (!config.youtubeApiKey) {
    console.warn(
      '[nova-server] NOTE: YOUTUBE_API_KEY is not set. AI Tutor will not suggest videos until it is configured.',
    );  
  }

  try {
    await getDb();
    console.log(`[nova-server] MongoDB connected (${config.mongoUri} / db "${config.mongoDbName}")`);
    await activityStore.ensureIndexes().catch((err) => console.error('[nova-server] Activity indexes failed:', err));
    await seedArraysJourneyIfMissing().catch((err) => console.error('[nova-server] Seed journey failed:', err));
  } catch (err) {
    console.error(
      '[nova-server] Could not connect to MongoDB. Auth (signup/signin) will fail until this is fixed. ' +
        'Check MONGODB_URI in server/.env and that a MongoDB server is running.',
      err instanceof Error ? err.message : err,
    );
  }

  // Pre-warm Google OAuth2 client so the first login does not incur
  // cold-start key-fetch latency. This is a no-op if GOOGLE_CLIENT_ID is unset.
  if (config.googleClientId) {
    warmUpGoogleClient();
    console.log('[nova-server] Google OAuth2 client pre-warmed.');
  }

  if (config.resendApiKey) {
    const REMINDER_INTERVAL_MS = 60 * 60 * 1000;
    sendDueStudyReminders().catch((err) => console.error('Study reminder sweep failed:', err));
    setInterval(() => {
      sendDueStudyReminders().catch((err) => console.error('Study reminder sweep failed:', err));
    }, REMINDER_INTERVAL_MS);
    console.log('[nova-server] Study reminder emails enabled (hourly sweep).');
  }

  httpServer.listen(config.port, () => {
    console.log(`[nova-server] listening on http://localhost:${config.port} using model ${config.geminiModel}`);
  });
}

start();
