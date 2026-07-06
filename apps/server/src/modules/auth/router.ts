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
  const result = await login(parsed.data.email, parsed.data.password);
  if ('error' in result) return res.status(401).json({ error: result.error });
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
