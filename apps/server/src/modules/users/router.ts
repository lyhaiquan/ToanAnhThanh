import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../db.js';

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole('ADMIN'));

usersRouter.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, name: true, status: true, createdAt: true,
      boundDeviceLabel: true, boundDeviceAt: true,
      // boundDeviceId có giá trị nghĩa là đã khóa vào 1 máy
      boundDeviceId: true,
      _count: { select: { attempts: true, activities: true, securityEvents: true } },
    },
  });
  res.json(users.map((u) => ({ ...u, deviceBound: !!u.boundDeviceId, boundDeviceId: undefined })));
});

// Admin mở khóa thiết bị để học sinh đăng nhập trên máy mới
usersRouter.patch('/:id/reset-device', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user || user.role !== 'STUDENT') return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  await prisma.user.update({
    where: { id: user.id },
    data: { boundDeviceId: null, boundDeviceLabel: null, boundDeviceAt: null },
  });
  res.json({ ok: true });
});

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
});

usersRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dữ liệu không hợp lệ (mật khẩu ≥ 6 ký tự)' });
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return res.status(409).json({ error: 'Email đã tồn tại' });

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      password: await bcrypt.hash(parsed.data.password, 10),
      role: 'STUDENT',
    },
    select: { id: true, email: true, name: true, status: true },
  });

  // Tự động ghi danh vào mọi khóa học hiện có
  const courses = await prisma.course.findMany({ select: { id: true } });
  for (const c of courses) {
    await prisma.enrollment.create({ data: { userId: user.id, courseId: c.id } });
  }
  res.status(201).json(user);
});

usersRouter.patch('/:id/ban', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user || user.role !== 'STUDENT') return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { status: user.status === 'BANNED' ? 'ACTIVE' : 'BANNED' },
    select: { id: true, status: true },
  });
  res.json(updated);
});

usersRouter.delete('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user || user.role !== 'STUDENT') return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  await prisma.user.delete({ where: { id: user.id } });
  res.json({ ok: true });
});
