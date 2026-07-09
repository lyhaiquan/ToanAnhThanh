import { prisma } from '../../db.js';
import type { AuthUser } from '../../middleware/auth.js';

// Kiểm soát truy cập buổi live tập trung (mirror courses/access.ts):
// mọi route đụng tới 1 buổi cụ thể của học sinh PHẢI đi qua đây.
export type LiveAccessResult = { ok: true } | { ok: false; status: 403 | 404; error: string };

/**
 * Một học sinh được tương tác với buổi live khi:
 *  1. Buổi tồn tại.
 *  2. Có lời mời (LiveSessionInvite) cho chính mình (admin bỏ qua).
 *  3. Buổi chưa bị hủy.
 */
export async function checkLiveSessionAccess(
  user: AuthUser,
  sessionId: string
): Promise<LiveAccessResult> {
  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });
  if (!session) return { ok: false, status: 404, error: 'Không tìm thấy buổi học' };

  if (user.role === 'ADMIN') return { ok: true };

  const invite = await prisma.liveSessionInvite.findUnique({
    where: { liveSessionId_userId: { liveSessionId: sessionId, userId: user.id } },
    select: { id: true },
  });
  if (!invite) return { ok: false, status: 403, error: 'Bạn không được mời vào buổi học này' };

  if (session.status === 'CANCELLED') {
    return { ok: false, status: 403, error: 'Buổi học đã bị hủy' };
  }
  return { ok: true };
}

/**
 * Tiện ích cho route: kiểm tra + tự gửi lỗi. Trả true nếu được phép đi tiếp.
 * Dùng: `if (!(await ensureLiveSessionAccess(req, res, sessionId))) return;`
 */
export async function ensureLiveSessionAccess(
  req: { user?: AuthUser },
  res: { status: (c: number) => { json: (b: unknown) => void } },
  sessionId: string
): Promise<boolean> {
  const result = await checkLiveSessionAccess(req.user!, sessionId);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return false;
  }
  return true;
}
