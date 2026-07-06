import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../db.js';

export const progressRouter = Router();

progressRouter.post('/watch/:lessonId', requireAuth, async (req, res) => {
  const sec = Number(req.body?.seconds ?? 0);
  await prisma.progress.upsert({
    where: { userId_lessonId: { userId: req.user!.id, lessonId: req.params.lessonId } },
    update: { videoWatchedSec: { increment: Math.max(0, Math.min(sec, 60)) } },
    create: { userId: req.user!.id, lessonId: req.params.lessonId, videoWatchedSec: sec },
  });
  res.json({ ok: true });
});

progressRouter.get('/me', requireAuth, async (req, res) => {
  const progress = await prisma.progress.findMany({
    where: { userId: req.user!.id },
    include: { lesson: { include: { chapter: { select: { title: true } } } } },
  });
  res.json(
    progress.map((p) => ({
      lessonId: p.lessonId,
      lessonTitle: p.lesson.title,
      chapterTitle: p.lesson.chapter.title,
      watchedSec: p.videoWatchedSec,
      completed: p.completed,
    }))
  );
});
