import { Router } from 'express';
import multer from 'multer';
import { generateTutorReply, parseTutorReply, GeminiError, type TutorTurn } from '../lib/gemini.js';
import { searchEducationalVideo } from '../lib/youtube.js';
import { chatStore } from '../lib/chatHistory.js';
import { conversationStore, DEFAULT_CONVERSATION_TITLE } from '../lib/conversationStore.js';
import { extractDocument, ExtractionError } from '../lib/extractText.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const tutorRouter = Router();

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new ExtractionError('Unsupported file type. Please attach a PDF, DOCX, or an image (JPG/PNG/WEBP).'));
  },
});

function truncateTitle(text: string, max = 48): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) return DEFAULT_CONVERSATION_TITLE;
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

tutorRouter.get('/conversations', requireAuth, async (req: AuthedRequest, res) => {
  const conversations = await conversationStore.listByUser(req.userId!);
  res.json({ data: { conversations } });
});

tutorRouter.post('/conversations', requireAuth, async (req: AuthedRequest, res) => {
  const conversation = await conversationStore.create(req.userId!);
  res.json({ data: { conversation } });
});

tutorRouter.patch('/conversations/:id', requireAuth, async (req: AuthedRequest, res) => {
  const { title } = req.body ?? {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: { message: 'A title is required.' } });
    return;
  }
  const conversation = await conversationStore.get(req.params.id, req.userId!);
  if (!conversation) {
    res.status(404).json({ error: { message: 'Chat not found.' } });
    return;
  }
  const nextTitle = truncateTitle(title, 60);
  await conversationStore.rename(req.params.id, req.userId!, nextTitle);
  res.json({ data: { title: nextTitle } });
});

tutorRouter.delete('/conversations/:id', requireAuth, async (req: AuthedRequest, res) => {
  const conversation = await conversationStore.get(req.params.id, req.userId!);
  if (!conversation) {
    res.status(404).json({ error: { message: 'Chat not found.' } });
    return;
  }
  await chatStore.removeByConversation(req.params.id, req.userId!);
  await conversationStore.remove(req.params.id, req.userId!);
  res.json({ data: { ok: true } });
});

tutorRouter.get('/conversations/:id/messages', requireAuth, async (req: AuthedRequest, res) => {
  const conversation = await conversationStore.get(req.params.id, req.userId!);
  if (!conversation) {
    res.status(404).json({ error: { message: 'Chat not found.' } });
    return;
  }
  const history = await chatStore.listByConversation(req.params.id, req.userId!);
  res.json({ data: { history } });
});

tutorRouter.post('/chat', requireAuth, (req: AuthedRequest, res) => {
  upload.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) {
      const message =
        uploadErr instanceof multer.MulterError && uploadErr.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large. Maximum size is 15MB.'
          : uploadErr instanceof Error
            ? uploadErr.message
            : 'Upload failed.';
      res.status(400).json({ error: { message } });
      return;
    }

    const { conversationId, message } = req.body ?? {};
    const text = typeof message === 'string' ? message.trim() : '';

    if (!conversationId || typeof conversationId !== 'string') {
      res.status(400).json({ error: { message: 'conversationId is required.' } });
      return;
    }
    if (!text && !req.file) {
      res.status(400).json({ error: { message: 'A message or attachment is required.' } });
      return;
    }

    const conversation = await conversationStore.get(conversationId, req.userId!);
    if (!conversation) {
      res.status(404).json({ error: { message: 'Chat not found.' } });
      return;
    }

    try {
      const attachment = req.file
        ? await extractDocument({
            buffer: req.file.buffer,
            mimetype: req.file.mimetype,
            originalname: req.file.originalname,
          })
        : null;

      const priorMessages = await chatStore.listByConversation(conversationId, req.userId!);
      const turns: TutorTurn[] = priorMessages.map((m) => ({
        role: m.role === 'ai' ? 'model' : 'user',
        text: m.content || (m.attachmentName ? `Attached: ${m.attachmentName}` : ''),
      }));

      const effectiveMessage =
        text ||
        (attachment?.kind === 'image'
          ? 'What is this? Explain it to me.'
          : 'Summarize this document and highlight what I should study.');

      const raw = await generateTutorReply(turns, effectiveMessage, attachment, req.userId);
      const { content, videoQuery } = parseTutorReply(raw);

      const video = videoQuery
        ? await searchEducationalVideo(videoQuery).catch((err) => {
            console.error('Video lookup failed:', err instanceof Error ? err.message : err);
            return null;
          })
        : null;

      await chatStore.append({
        userId: req.userId!,
        conversationId,
        role: 'user',
        content: text,
        videoQuery: null,
        attachmentName: req.file?.originalname ?? null,
      });
      await chatStore.append({
        userId: req.userId!,
        conversationId,
        role: 'ai',
        content,
        videoQuery,
        attachmentName: null,
      });

      let title: string | null = null;
      if (conversation.title === DEFAULT_CONVERSATION_TITLE) {
        title = truncateTitle(text || req.file?.originalname || DEFAULT_CONVERSATION_TITLE);
        await conversationStore.rename(conversationId, req.userId!, title);
      }
      await conversationStore.touch(conversationId, req.userId!, truncateTitle(content, 80));

      res.json({ data: { content, video, title } });
    } catch (err) {
      if (err instanceof ExtractionError) {
        res.status(422).json({ error: { message: err.message } });
        return;
      }
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Tutor chat failed:', err);
      res.status(500).json({ error: { message: 'Something went wrong. Please try again.' } });
    }
  });
});
