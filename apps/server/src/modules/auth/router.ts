import { Router } from 'express';
import { z } from 'zod';
import { login, refresh } from './service.js';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../db.js';

export const authRouter = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  const deviceId = typeof req.body?.deviceId === 'string' ? req.body.deviceId : undefined;
  const deviceLabel = String(req.headers['user-agent'] ?? '').slice(0, 200);
  const result = await login(parsed.data.email, parsed.data.password, deviceId, deviceLabel);
  if ('error' in result) {
    if (result.error === 'DEVICE_LOCKED') {
      return res.status(403).json({
        error: 'Tài khoản đã được đăng ký trên một thiết bị khác. Vui lòng liên hệ giáo viên để đổi thiết bị.',
        code: 'DEVICE_LOCKED',
      });
    }
    return res.status(401).json({ error: result.error });
  }
  res.json(result);
});

authRouter.post('/refresh', async (req, res) => {
  const token = req.body?.refreshToken;
  if (typeof token !== 'string') return res.status(400).json({ error: 'Thiếu refresh token' });
  const result = await refresh(token);
  if (!result) return res.status(401).json({ error: 'Refresh token không hợp lệ' });
  res.json(result);
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  // Thu hồi refresh token của phiên này (tăng version) — logout thật sự, không chỉ xóa phía client
  await prisma.user.update({ where: { id: req.user!.id }, data: { tokenVersion: { increment: 1 } } });
  await prisma.activityLog.create({ data: { userId: req.user!.id, type: 'LOGOUT' } });
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, role: true, status: true },
  });
  res.json(user);
});
