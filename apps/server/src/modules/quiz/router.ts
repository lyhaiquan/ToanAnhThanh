import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../db.js';
import { submitQuiz, isLessonUnlocked } from './service.js';
import { ensureLessonAccess } from '../courses/access.js';

export const quizRouter = Router();

// Lấy quiz của bài học (không kèm đáp án!)
quizRouter.get('/lesson/:lessonId', requireAuth, async (req, res) => {
  if (!(await ensureLessonAccess(req, res, req.params.lessonId))) return;
  const quiz = await prisma.quiz.findUnique({
    where: { lessonId: req.params.lessonId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!quiz) return res.status(404).json({ error: 'Bài học chưa có quiz' });

  await prisma.activityLog.create({
    data: { userId: req.user!.id, type: 'QUIZ_START', metadata: JSON.stringify({ quizId: quiz.id }) },
  });

  res.json({
    id: quiz.id,
    passScore: quiz.passScore,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: JSON.parse(q.optionsJson),
    })),
  });
});

quizRouter.post('/:quizId/submit', requireAuth, async (req, res) => {
  const answers = req.body?.answers;
  if (!Array.isArray(answers)) return res.status(400).json({ error: 'Thiếu đáp án' });
  // Chỉ cho nộp quiz của bài mà học sinh được phép (ghi danh + đã mở khóa),
  // tránh nộp quiz khóa/khác lớp để lách gate.
  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId }, select: { lessonId: true } });
  if (!quiz) return res.status(404).json({ error: 'Không tìm thấy quiz' });
  if (!(await ensureLessonAccess(req, res, quiz.lessonId))) return;
  const result = await submitQuiz(req.user!.id, req.params.quizId, answers.map(Number));
  if (!result) return res.status(404).json({ error: 'Không tìm thấy quiz' });
  res.json(result);
});

quizRouter.get('/lesson/:lessonId/unlocked', requireAuth, async (req, res) => {
  res.json({ unlocked: await isLessonUnlocked(req.user!.id, req.params.lessonId) });
});

quizRouter.get('/attempts/me', requireAuth, async (req, res) => {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: { quiz: { include: { lesson: { select: { title: true } } } } },
  });
  res.json(
    attempts.map((a) => ({
      id: a.id,
      lessonTitle: a.quiz.lesson.title,
      score: a.score,
      passed: a.passed,
      at: a.createdAt,
    }))
  );
});
