import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../db.js';
import { submitQuiz, isLessonUnlocked } from './service.js';
import { ensureLessonAccess } from '../courses/access.js';

export const quizRouter = Router();

// ===== Soạn đề (admin) =====

// Mỗi câu đúng 4 phương án, đáp án là chỉ số 0-3. Đề phải có ít nhất 1 câu.
const questionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional().default(''),
});
const quizBodySchema = z.object({
  passScore: z.number().int().min(0).max(100),
  questions: z.array(questionSchema).min(1).max(50),
});

// Tạo quiz cho bài học chưa có quiz
quizRouter.post('/lesson/:lessonId', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = quizBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Đề không hợp lệ (mỗi câu 4 phương án, đáp án 0-3, điểm đạt 0-100)' });

  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId }, select: { id: true, quiz: { select: { id: true } } } });
  if (!lesson) return res.status(404).json({ error: 'Không tìm thấy bài học' });
  if (lesson.quiz) return res.status(409).json({ error: 'Bài này đã có quiz — hãy sửa đề thay vì tạo mới' });

  const quiz = await prisma.quiz.create({
    data: {
      lessonId: lesson.id,
      passScore: parsed.data.passScore,
      questions: {
        create: parsed.data.questions.map((q, i) => ({
          order: i,
          text: q.text,
          optionsJson: JSON.stringify(q.options),
          answerIndex: q.answerIndex,
          explanation: q.explanation,
        })),
      },
    },
  });
  res.status(201).json({ id: quiz.id });
});

// Xem đề đầy đủ (kèm đáp án + giải thích) để sửa
quizRouter.get('/lesson/:lessonId/admin', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { lessonId: req.params.lessonId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!quiz) return res.status(404).json({ error: 'Bài học chưa có quiz' });
  res.json({
    id: quiz.id,
    passScore: quiz.passScore,
    questions: quiz.questions.map((q) => ({
      text: q.text,
      options: JSON.parse(q.optionsJson),
      answerIndex: q.answerIndex,
      explanation: q.explanation,
    })),
  });
});

// Thay toàn bộ đề (xóa câu cũ, tạo câu mới) — đơn giản và khớp cách editor lưu
quizRouter.put('/:quizId', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = quizBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Đề không hợp lệ (mỗi câu 4 phương án, đáp án 0-3, điểm đạt 0-100)' });

  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId }, select: { id: true } });
  if (!quiz) return res.status(404).json({ error: 'Không tìm thấy quiz' });

  await prisma.$transaction([
    prisma.question.deleteMany({ where: { quizId: quiz.id } }),
    prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        passScore: parsed.data.passScore,
        questions: {
          create: parsed.data.questions.map((q, i) => ({
            order: i,
            text: q.text,
            optionsJson: JSON.stringify(q.options),
            answerIndex: q.answerIndex,
            explanation: q.explanation,
          })),
        },
      },
    }),
  ]);
  res.json({ ok: true });
});

quizRouter.delete('/:quizId', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId }, select: { id: true } });
  if (!quiz) return res.status(404).json({ error: 'Không tìm thấy quiz' });
  await prisma.quiz.delete({ where: { id: quiz.id } });
  res.json({ ok: true });
});

// ===== Làm bài (học sinh) =====

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
