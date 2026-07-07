import fs from 'node:fs';
import os from 'node:os';
import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../db.js';
import { getStorage } from './index.js';

export const storageRouter = Router();

// Ghi thẳng ra file tạm trên đĩa thay vì giữ cả GB trong RAM (chống cạn RAM khi
// nhiều admin upload cùng lúc). Lọc cả mimetype lẫn đuôi file — mimetype do
// client khai nên không tin một mình nó.
const upload = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: (_req, file, cb) => {
    const okMime = /video\/(mp4|webm|quicktime)/.test(file.mimetype);
    const okExt = /\.(mp4|webm|mov)$/i.test(file.originalname);
    cb(null, okMime && okExt);
  },
});

// Kéo-thả video vào chương → tạo lesson mới gắn thẳng vào chương đó.
storageRouter.post(
  '/upload/:chapterId',
  requireAuth,
  requireRole('ADMIN'),
  upload.single('video'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Thiếu file video (mp4/webm)' });
    const chapter = await prisma.chapter.findUnique({ where: { id: req.params.chapterId } });
    if (!chapter) {
      fs.unlink(req.file.path, () => {}); // dọn file tạm khi chương không tồn tại
      return res.status(404).json({ error: 'Không tìm thấy chương' });
    }

    const videoRef = await getStorage().save(req.file.path, req.file.originalname);
    const count = await prisma.lesson.count({ where: { chapterId: chapter.id } });
    const title =
      (req.body?.title as string)?.trim() ||
      `Bài ${count + 1}: ${req.file.originalname.replace(/\.[^.]+$/, '')}`;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description: (req.body?.description as string) ?? '',
        order: count,
        videoSource: 'local',
        videoRef,
        chapterId: chapter.id,
      },
    });
    res.status(201).json(lesson);
  }
);
