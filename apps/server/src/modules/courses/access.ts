import { prisma } from '../../db.js';
import { isLessonUnlocked } from '../quiz/service.js';
import type { AuthUser } from '../../middleware/auth.js';

// Kết quả kiểm tra quyền truy cập một bài học. Tập trung mọi luật ở đây để
// không route nào tự chế lại (nguồn gây lỗ hổng IDOR/bypass gate trước đây).
export type AccessResult = { ok: true } | { ok: false; status: 403 | 404; error: string };

/**
 * Một học sinh được xem/tương tác với bài học khi hội đủ:
 *  1. Bài tồn tại.
 *  2. Đã ghi danh khóa học chứa bài (admin bỏ qua toàn bộ).
 *  3. Bài đã mở khóa theo quiz gate.
 * Trả về thay vì ném lỗi để caller quyết mã HTTP.
 */
export async function checkLessonAccess(user: AuthUser, lessonId: string): Promise<AccessResult> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, chapter: { select: { courseId: true } } },
  });
  if (!lesson) return { ok: false, status: 404, error: 'Không tìm thấy bài học' };

  if (user.role === 'ADMIN') return { ok: true };

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: lesson.chapter.courseId } },
    select: { id: true },
  });
  if (!enrolled) return { ok: false, status: 403, error: 'Bạn chưa được ghi danh khóa học này' };

  if (!(await isLessonUnlocked(user.id, lessonId))) {
    return { ok: false, status: 403, error: 'Bài học chưa mở khóa. Hãy hoàn thành quiz bài trước.' };
  }
  return { ok: true };
}

/**
 * Tiện ích cho route: kiểm tra + tự gửi lỗi. Trả true nếu được phép đi tiếp.
 * Dùng: `if (!(await ensureLessonAccess(req, res, lessonId))) return;`
 */
export async function ensureLessonAccess(
  req: { user?: AuthUser },
  res: { status: (c: number) => { json: (b: unknown) => void } },
  lessonId: string
): Promise<boolean> {
  const result = await checkLessonAccess(req.user!, lessonId);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return false;
  }
  return true;
}
