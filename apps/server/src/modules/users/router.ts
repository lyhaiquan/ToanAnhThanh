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
    // Tăng tokenVersion: refresh token trên máy cũ hết hiệu lực, buộc đăng nhập lại
    data: { boundDeviceId: null, boundDeviceLabel: null, boundDeviceAt: null, tokenVersion: { increment: 1 } },
  });
  res.json({ ok: true });
});

// Mật khẩu ≥ 8 ký tự, có chữ và số — chặn mật khẩu quá dễ đoán
const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải ≥ 8 ký tự')
  .regex(/[A-Za-z]/, 'Mật khẩu phải có chữ cái')
  .regex(/[0-9]/, 'Mật khẩu phải có chữ số');

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: passwordSchema,
});

usersRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' });
  }
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
  const banning = user.status !== 'BANNED';
  const updated = await prisma.user.update({
    where: { id: user.id },
    // Khi ban: thu hồi refresh token ngay (access token tự chết trong 15' + requireAuth chặn ngay)
    data: {
      status: banning ? 'BANNED' : 'ACTIVE',
      ...(banning ? { tokenVersion: { increment: 1 } } : {}),
    },
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
