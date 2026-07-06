import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../db.js';
import { isLessonUnlocked } from '../quiz/service.js';

export const coursesRouter = Router();

// Danh sách khóa học kèm tiến độ của user hiện tại
coursesRouter.get('/', requireAuth, async (req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { order: 'asc' },
    include: { chapters: { include: { lessons: { select: { id: true } } } } },
  });
  const completed = await prisma.progress.findMany({
    where: { userId: req.user!.id, completed: true },
    select: { lessonId: true },
  });
  const done = new Set(completed.map((p) => p.lessonId));

  res.json(
    courses.map((c) => {
      const lessonIds = c.chapters.flatMap((ch) => ch.lessons.map((l) => l.id));
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        totalLessons: lessonIds.length,
        completedLessons: lessonIds.filter((id) => done.has(id)).length,
      };
    })
  );
});

// Cây khóa học: chương → bài, kèm trạng thái khóa/mở và hoàn thành
coursesRouter.get('/:courseId', requireAuth, async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.courseId },
    include: {
      chapters: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { quiz: { select: { id: true } } },
          },
        },
      },
    },
  });
  if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });

  const progress = await prisma.progress.findMany({ where: { userId: req.user!.id } });
  const progressMap = new Map(progress.map((p) => [p.lessonId, p]));

  const chapters = [];
  for (const ch of course.chapters) {
    const lessons = [];
    for (const l of ch.lessons) {
      lessons.push({
        id: l.id,
        title: l.title,
        description: l.description,
        hasQuiz: !!l.quiz,
        unlocked: req.user!.role === 'ADMIN' ? true : await isLessonUnlocked(req.user!.id, l.id),
        completed: progressMap.get(l.id)?.completed ?? false,
      });
    }
    chapters.push({ id: ch.id, title: ch.title, lessons });
  }

  res.json({ id: course.id, title: course.title, description: course.description, chapters });
});

// Chi tiết bài học (chỉ khi đã mở khóa)
coursesRouter.get('/lessons/:lessonId', requireAuth, async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.lessonId },
    include: { chapter: { include: { course: { select: { id: true, title: true } } } }, quiz: { select: { id: true } } },
  });
  if (!lesson) return res.status(404).json({ error: 'Không tìm thấy bài học' });

  if (req.user!.role !== 'ADMIN' && !(await isLessonUnlocked(req.user!.id, lesson.id))) {
    return res.status(403).json({ error: 'Bài học chưa mở khóa. Hãy hoàn thành quiz bài trước.' });
  }

  await prisma.activityLog.create({
    data: { userId: req.user!.id, type: 'PAGE_VIEW', metadata: JSON.stringify({ lessonId: lesson.id, title: lesson.title }) },
  });

  res.json({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    hasVideo: !!lesson.videoRef,
    hasQuiz: !!lesson.quiz,
    chapterTitle: lesson.chapter.title,
    courseId: lesson.chapter.course.id,
    courseTitle: lesson.chapter.course.title,
  });
});

// ===== Admin CRUD =====

const courseSchema = z.object({ title: z.string().min(1), description: z.string().default('') });

coursesRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  const count = await prisma.course.count();
  const course = await prisma.course.create({ data: { ...parsed.data, order: count } });
  res.status(201).json(course);
});

coursesRouter.post('/:courseId/chapters', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const title = req.body?.title;
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Thiếu tiêu đề chương' });
  const count = await prisma.chapter.count({ where: { courseId: req.params.courseId } });
  const chapter = await prisma.chapter.create({
    data: { title: title.trim(), order: count, courseId: req.params.courseId },
  });
  res.status(201).json(chapter);
});

coursesRouter.delete('/lessons/:lessonId', requireAuth, requireRole('ADMIN'), async (req, res) => {
  await prisma.lesson.delete({ where: { id: req.params.lessonId } });
  res.json({ ok: true });
});

coursesRouter.delete('/chapters/:chapterId', requireAuth, requireRole('ADMIN'), async (req, res) => {
  await prisma.chapter.delete({ where: { id: req.params.chapterId } });
  res.json({ ok: true });
});
