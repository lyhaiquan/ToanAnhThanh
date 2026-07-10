import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../db.js';
import { config } from '../../config.js';
import type { AIProvider } from './provider.js';
import { MockAIProvider } from './mock.js';
import { OpenNotebookProvider } from './opennotebook.js';
import { ensureLessonAccess } from '../courses/access.js';

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

// Mọi endpoint AI đều gắn với 1 bài học → kiểm tra quyền truy cập bài đó,
// tránh học sinh moi nội dung AI của khóa/bài chưa được phép.
aiRouter.get('/analyze/:lessonId', async (req, res) => {
  if (!(await ensureLessonAccess(req, res, req.params.lessonId))) return;
  await log(req.user!.id, 'AI_ANALYZE', req.params.lessonId);
  res.json(await getAI().analyzeLecture(req.params.lessonId));
});

// Đọc nội dung thầy soạn nếu bài đang ở chế độ "teacher" và có nội dung;
// không thì trả null để rơi về AI sinh (URL không đổi → client hiển thị như cũ).
async function teacherContent(lessonId: string, kind: 'exercise' | 'slide'): Promise<unknown[] | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { exerciseMode: true, slideMode: true, exercisesJson: true, slidesJson: true },
  });
  if (!lesson) return null;
  const mode = kind === 'exercise' ? lesson.exerciseMode : lesson.slideMode;
  const json = kind === 'exercise' ? lesson.exercisesJson : lesson.slidesJson;
  if (mode !== 'teacher' || !json) return null;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

aiRouter.get('/exercises/:lessonId', async (req, res) => {
  if (!(await ensureLessonAccess(req, res, req.params.lessonId))) return;
  await log(req.user!.id, 'AI_EXERCISES', req.params.lessonId);
  const teacher = await teacherContent(req.params.lessonId, 'exercise');
  res.json(teacher ?? (await getAI().generateExercises(req.params.lessonId)));
});

aiRouter.get('/slides/:lessonId', async (req, res) => {
  if (!(await ensureLessonAccess(req, res, req.params.lessonId))) return;
  await log(req.user!.id, 'AI_SLIDES', req.params.lessonId);
  const teacher = await teacherContent(req.params.lessonId, 'slide');
  res.json(teacher ?? (await getAI().generateSlides(req.params.lessonId)));
});

// Endpoint AI chat đã gỡ: tab Hỏi đáp giờ là kênh hỏi trực tiếp giáo viên (modules/qa).
