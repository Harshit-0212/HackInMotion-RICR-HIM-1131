import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
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
import { getDb } from './lib/db.js';
import { initSocket } from './lib/socket.js';
import { sendDueStudyReminders } from './lib/reminders.js';

const app = express();
const httpServer = http.createServer(app);
initSocket(httpServer);

app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
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
  } catch (err) {
    console.error(
      '[nova-server] Could not connect to MongoDB. Auth (signup/signin) will fail until this is fixed. ' +
        'Check MONGODB_URI in server/.env and that a MongoDB server is running.',
      err instanceof Error ? err.message : err,
    );
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
