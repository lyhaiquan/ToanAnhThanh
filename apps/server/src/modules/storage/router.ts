import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../db.js';
import { getStorage } from './index.js';

export const storageRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: (_req, file, cb) => {
    cb(null, /video\/(mp4|webm|quicktime)/.test(file.mimetype));
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
    if (!chapter) return res.status(404).json({ error: 'Không tìm thấy chương' });

    const videoRef = await getStorage().save(req.file.buffer, req.file.originalname);
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
