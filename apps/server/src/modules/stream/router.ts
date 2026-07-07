import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { signStreamToken, verifyStreamToken } from './token.js';
import { getStorage } from '../storage/index.js';
import { prisma } from '../../db.js';
import { ensureLessonAccess } from '../courses/access.js';

export const streamRouter = Router();

// Client xin token mới trước mỗi lần play (token sống 60s).
// Chỉ cấp token khi học sinh thực sự được xem bài (ghi danh + đã mở khóa) —
// nếu không, gate video bị bypass bằng cách đoán lessonId.
streamRouter.post('/token/:lessonId', requireAuth, async (req, res) => {
  if (!(await ensureLessonAccess(req, res, req.params.lessonId))) return;
  res.json({ token: signStreamToken(req.user!.id, req.params.lessonId) });
});

// <video src="/api/stream/:lessonId?token=..."> — xác thực bằng token ký, không cần header.
streamRouter.get('/:lessonId', async (req, res) => {
  const token = String(req.query.token ?? '');
  const payload = verifyStreamToken(token);
  if (!payload || payload.lessonId !== req.params.lessonId) {
    return res.status(403).json({ error: 'Token stream không hợp lệ hoặc đã hết hạn' });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
  if (!lesson || !lesson.videoRef) return res.status(404).json({ error: 'Không tìm thấy video' });

  const storage = getStorage();
  let size: number;
  try {
    size = storage.getSize(lesson.videoRef);
  } catch {
    return res.status(404).json({ error: 'File video không tồn tại' });
  }

  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    const start = match?.[1] ? parseInt(match[1], 10) : 0;
    const end = match?.[2] ? Math.min(parseInt(match[2], 10), size - 1) : Math.min(start + 1024 * 1024 - 1, size - 1);
    if (start >= size) return res.status(416).end();

    const { stream, contentType } = storage.createReadStream(lesson.videoRef, { start, end });
    res.status(206).set({
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    stream.pipe(res);
  } else {
    const { stream, contentType } = storage.createReadStream(lesson.videoRef);
    res.status(200).set({
      'Content-Length': size,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    });
    stream.pipe(res);
  }
});
