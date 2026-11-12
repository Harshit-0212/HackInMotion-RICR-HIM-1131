import { Router, type Response } from 'express';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { learningStore } from '../lib/learningStore.js';
import { gamificationStore } from '../lib/gamificationStore.js';
import { getClientForUser } from '../lib/gemini.js';
import { config } from '../config.js';

export const featuresRouter = Router();
featuresRouter.use(requireAuth);

// ─── Mistakes ─────────────────────────────────────────────────────────────────
featuresRouter.get('/mistakes', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { subject, topic, unresolvedOnly } = req.query;
  const list = await learningStore.listMistakes(userId, {
    subject: subject as string,
    topic: topic as string,
    unresolvedOnly: unresolvedOnly === 'true',
  });
  res.json({ data: list });
});

featuresRouter.post('/mistakes', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { question, userAnswer, correctAnswer, subject, topic, explanation } = req.body;
  if (!question || !correctAnswer) {
    res.status(400).json({ error: { message: 'Question and correct answer required' } });
    return;
  }
  const mistake = await learningStore.recordMistake({
    userId,
    question,
    userAnswer: userAnswer || '',
    correctAnswer,
    subject: subject || 'General',
    topic: topic || 'General',
    explanation: explanation || 'Review this question to understand the correct concept.',
  });
  res.status(201).json({ data: mistake });
});

featuresRouter.post('/mistakes/:id/resolve', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const success = await learningStore.resolveMistake(userId, req.params.id);
  if (success) {
    const today = new Date().toISOString().slice(0, 10);
    await gamificationStore.recordLearningEvent(userId, 'quiz_completed', today, `mistake_${req.params.id}`);
  }
  res.json({ data: { success } });
});

// ─── Flashcards ───────────────────────────────────────────────────────────────
featuresRouter.get('/flashcards/due', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const due = await learningStore.getDueFlashcards(userId);
  res.json({ data: due });
});

featuresRouter.post('/flashcards', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { front, back, subject, topic, sourceDocId, sourceMistakeId } = req.body;
  if (!front || !back) {
    res.status(400).json({ error: { message: 'Front and back required' } });
    return;
  }
  const card = await learningStore.createFlashcard({
    userId,
    front,
    back,
    subject: subject || 'General',
    topic: topic || 'General',
    sourceDocId,
    sourceMistakeId,
  });
  res.status(201).json({ data: card });
});

featuresRouter.post('/flashcards/:id/review', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { rating } = req.body; // 1-4
  if (![1, 2, 3, 4].includes(rating)) {
    res.status(400).json({ error: { message: 'Rating must be between 1 and 4' } });
    return;
  }
  const updated = await learningStore.reviewFlashcard(userId, req.params.id, rating);
  if (updated && rating >= 3) {
    const today = new Date().toISOString().slice(0, 10);
    await gamificationStore.recordLearningEvent(userId, 'comprehension_drill', today, `flashcard_${req.params.id}_${today}`);
  }
  res.json({ data: updated });
});

// ─── Calendar ─────────────────────────────────────────────────────────────────
featuresRouter.get('/calendar', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const events = await learningStore.listCalendarEvents(userId);
  res.json({ data: events });
});

featuresRouter.post('/calendar', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { title, type, date, time, description } = req.body;
  if (!title || !date) {
    res.status(400).json({ error: { message: 'Title and date required' } });
    return;
  }
  const event = await learningStore.createCalendarEvent({
    userId,
    title,
    type: type || 'custom',
    date,
    time,
    description,
  });
  res.status(201).json({ data: event });
});

featuresRouter.delete('/calendar/:id', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const success = await learningStore.deleteCalendarEvent(userId, req.params.id);
  res.json({ data: { success } });
});

// ─── Interview Prep ───────────────────────────────────────────────────────────
featuresRouter.post('/interview/evaluate', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { role, topic, difficulty, questions } = req.body;
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ error: { message: 'Questions and answers are required.' } });
    return;
  }

  try {
    const ai = await getClientForUser(userId);
    const model = ai.getGenerativeModel({ model: config.geminiModel });

    const prompt = `You are an expert technical interviewer evaluating an interview for role "${role}" on topic "${topic}" (${difficulty} difficulty).
Evaluate the following candidate transcript:
${JSON.stringify(questions, null, 2)}

Provide your evaluation as a valid JSON object matching this schema:
{
  "overallScore": number (0-100),
  "communicationScore": number (0-100),
  "technicalDepthScore": number (0-100),
  "confidenceScore": number (0-100),
  "strengths": string[],
  "weaknesses": [
    {
      "area": string,
      "reason": string,
      "fix": string,
      "studyRecommendation": string
    }
  ],
  "questions": [
    {
      "question": string,
      "userAnswer": string,
      "score": number,
      "sampleAnswer": string
    }
  ]
}
Return ONLY pure JSON.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    const parsed = JSON.parse(text);

    const saved = await learningStore.saveInterviewReport({
      userId,
      role: role || 'Software Engineer',
      topic: topic || 'General CS',
      difficulty: difficulty || 'medium',
      ...parsed,
    });

    const today = new Date().toISOString().slice(0, 10);
    await gamificationStore.recordLearningEvent(userId, 'comprehension_drill', today, `interview_${saved.id}`);

    res.json({ data: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Evaluation failed';
    res.status(500).json({ error: { message: `AI evaluation error: ${msg}` } });
  }
});

featuresRouter.get('/interview/reports', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const reports = await learningStore.listInterviewReports(userId);
  res.json({ data: reports });
});
