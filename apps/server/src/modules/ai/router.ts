import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../db.js';
import { config } from '../../config.js';
import type { AIProvider } from './provider.js';
import { MockAIProvider } from './mock.js';
import { OpenNotebookProvider } from './opennotebook.js';

let provider: AIProvider | null = null;
function getAI(): AIProvider {
  if (!provider) {
    provider = config.aiProvider === 'opennotebook' ? new OpenNotebookProvider() : new MockAIProvider();
  }
  return provider;
}

export const aiRouter = Router();
aiRouter.use(requireAuth);

async function log(userId: string, type: string, lessonId: string) {
  await prisma.activityLog.create({ data: { userId, type, metadata: JSON.stringify({ lessonId }) } });
}

aiRouter.get('/analyze/:lessonId', async (req, res) => {
  await log(req.user!.id, 'AI_ANALYZE', req.params.lessonId);
  res.json(await getAI().analyzeLecture(req.params.lessonId));
});

aiRouter.get('/exercises/:lessonId', async (req, res) => {
  await log(req.user!.id, 'AI_EXERCISES', req.params.lessonId);
  res.json(await getAI().generateExercises(req.params.lessonId));
});

aiRouter.get('/slides/:lessonId', async (req, res) => {
  await log(req.user!.id, 'AI_SLIDES', req.params.lessonId);
  res.json(await getAI().generateSlides(req.params.lessonId));
});

aiRouter.post('/chat/:lessonId', async (req, res) => {
  const history = req.body?.history;
  if (!Array.isArray(history)) return res.status(400).json({ error: 'Thiếu history' });
  await log(req.user!.id, 'AI_CHAT', req.params.lessonId);
  res.json({ reply: await getAI().chat(req.params.lessonId, history) });
});
