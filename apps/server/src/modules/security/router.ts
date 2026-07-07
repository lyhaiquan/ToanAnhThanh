import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../db.js';
import { logActivity } from './logbuffer.js';

export const securityRouter = Router();

// Client ghi nhận hoạt động thường (play/pause/seek/...) — đệm rồi ghi batch
securityRouter.post('/activity', requireAuth, (req, res) => {
  const { type, metadata } = req.body ?? {};
  if (typeof type !== 'string') return res.status(400).json({ error: 'Thiếu type' });
  logActivity({ userId: req.user!.id, type, metadata: JSON.stringify(metadata ?? {}) });
  res.json({ ok: true });
});

// Client báo sự kiện bảo mật (devtools, quay màn hình...) → hiển thị cho admin
securityRouter.post('/security-event', requireAuth, async (req, res) => {
  const { type, detail } = req.body ?? {};
  if (typeof type !== 'string') return res.status(400).json({ error: 'Thiếu type' });
  await prisma.securityEvent.create({
    data: { userId: req.user!.id, type, detail: String(detail ?? '') },
  });
  res.json({ ok: true });
});

// ===== Admin: xem log =====

securityRouter.get('/activities', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const userId = req.query.userId as string | undefined;
  const activities = await prisma.activityLog.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  });
  res.json(
    activities.map((a) => ({
      id: a.id,
      type: a.type,
      metadata: JSON.parse(a.metadata),
      at: a.createdAt,
      userName: a.user.name,
      userEmail: a.user.email,
      userId: a.userId,
    }))
  );
});

securityRouter.get('/security-events', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const events = await prisma.securityEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });
  res.json(
    events.map((e) => ({
      id: e.id,
      type: e.type,
      detail: e.detail,
      resolved: e.resolved,
      at: e.createdAt,
      userName: e.user.name,
      userEmail: e.user.email,
      userId: e.userId,
    }))
  );
});

securityRouter.patch('/security-events/:id/resolve', requireAuth, requireRole('ADMIN'), async (req, res) => {
  await prisma.securityEvent.update({ where: { id: req.params.id }, data: { resolved: true } });
  res.json({ ok: true });
});
