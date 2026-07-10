import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../db.js';
import { ensureLessonAccess } from '../courses/access.js';

// Hỏi đáp trực tiếp với giáo viên. Riêng tư: học sinh chỉ thấy câu hỏi của
// chính mình; toàn bộ câu hỏi đổ về phía admin để thầy trả lời.
export const qaRouter = Router();
qaRouter.use(requireAuth);

const askSchema = z.object({ content: z.string().trim().min(1, 'Câu hỏi trống').max(2000) });

// Học sinh gửi câu hỏi — chỉ khi được xem bài (ghi danh + đã mở khóa)
qaRouter.post('/lessons/:lessonId', async (req, res) => {
  if (!(await ensureLessonAccess(req, res, req.params.lessonId))) return;
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Câu hỏi không được để trống (tối đa 2000 ký tự)' });
  const q = await prisma.lessonQuestion.create({
    data: { lessonId: req.params.lessonId, userId: req.user!.id, content: parsed.data.content },
  });
  res.status(201).json({ id: q.id, content: q.content, answer: q.answer, answeredAt: q.answeredAt, createdAt: q.createdAt });
});

// Câu hỏi của chính mình trong 1 bài học
qaRouter.get('/lessons/:lessonId/mine', async (req, res) => {
  if (!(await ensureLessonAccess(req, res, req.params.lessonId))) return;
  const list = await prisma.lessonQuestion.findMany({
    where: { lessonId: req.params.lessonId, userId: req.user!.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, content: true, answer: true, answeredAt: true, createdAt: true },
  });
  res.json(list);
});

// ===== Admin =====

// Danh sách câu hỏi (?unanswered=1 → chỉ câu chưa trả lời), mới nhất trước
qaRouter.get('/admin', requireRole('ADMIN'), async (req, res) => {
  const where = req.query.unanswered ? { answeredAt: null } : {};
  const list = await prisma.lessonQuestion.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      user: { select: { name: true, email: true } },
      lesson: { select: { title: true, chapter: { select: { course: { select: { title: true } } } } } },
    },
  });
  res.json(
    list.map((q) => ({
      id: q.id,
      content: q.content,
      answer: q.answer,
      answeredAt: q.answeredAt,
      createdAt: q.createdAt,
      studentName: q.user.name,
      studentEmail: q.user.email,
      lessonTitle: q.lesson.title,
      courseTitle: q.lesson.chapter.course.title,
    }))
  );
});

// Số câu chưa trả lời — chấm đỏ trên sidebar admin
qaRouter.get('/admin/unanswered-count', requireRole('ADMIN'), async (_req, res) => {
  res.json({ count: await prisma.lessonQuestion.count({ where: { answeredAt: null } }) });
});

const answerSchema = z.object({ answer: z.string().trim().min(1).max(5000) });

// Thầy trả lời (trả lời lại lần nữa sẽ ghi đè câu cũ)
qaRouter.post('/admin/:id/answer', requireRole('ADMIN'), async (req, res) => {
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Câu trả lời không được để trống (tối đa 5000 ký tự)' });
  const q = await prisma.lessonQuestion.findUnique({ where: { id: req.params.id } });
  if (!q) return res.status(404).json({ error: 'Không tìm thấy câu hỏi' });
  const updated = await prisma.lessonQuestion.update({
    where: { id: q.id },
    data: { answer: parsed.data.answer, answeredAt: new Date() },
  });
  res.json({ id: updated.id, answer: updated.answer, answeredAt: updated.answeredAt });
});
