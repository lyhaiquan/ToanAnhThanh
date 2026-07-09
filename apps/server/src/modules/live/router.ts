import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../db.js';
import { ensureLiveSessionAccess } from './access.js';

export const liveRouter = Router();

// Link phòng học phải là URL http(s) — chặn javascript: và scheme lạ
const meetingLinkSchema = z
  .string()
  .url()
  .refine((s) => /^https?:\/\//i.test(s), 'Link phải bắt đầu bằng http:// hoặc https://');

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().min(5).max(600).optional().default(60),
  meetingLink: meetingLinkSchema,
  studentIds: z.array(z.string()).min(1),
});

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
  durationMinutes: z.number().int().min(5).max(600).optional(),
  meetingLink: meetingLinkSchema.optional(),
  status: z.literal('CANCELLED').optional(),
});

// Trạng thái hiển thị tính từ giờ hẹn + thời lượng — không lưu state máy trong DB
function displayStatus(s: { status: string; scheduledAt: Date; durationMinutes: number }) {
  if (s.status === 'CANCELLED') return 'cancelled';
  const now = Date.now();
  const start = s.scheduledAt.getTime();
  const end = start + s.durationMinutes * 60_000;
  if (now < start) return 'upcoming';
  if (now < end) return 'ongoing';
  return 'past';
}

// ===== Học sinh =====

// Buổi mà học sinh hiện tại được mời (đặt trước /:id để không bị nuốt route)
liveRouter.get('/mine', requireAuth, async (req, res) => {
  const invites = await prisma.liveSessionInvite.findMany({
    where: { userId: req.user!.id },
    include: { liveSession: true },
    orderBy: { liveSession: { scheduledAt: 'desc' } },
  });
  res.json(
    invites.map(({ liveSession: s, joinedAt }) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      scheduledAt: s.scheduledAt,
      durationMinutes: s.durationMinutes,
      status: displayStatus(s),
      joinedAt,
    }))
  );
});

// Vào lớp: điểm danh lần đầu (idempotent) rồi trả link phòng học
liveRouter.post('/:id/join', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  if (!(await ensureLiveSessionAccess(req, res, sessionId))) return;

  if (req.user!.role === 'STUDENT') {
    await prisma.liveSessionInvite.updateMany({
      where: { liveSessionId: sessionId, userId: req.user!.id, joinedAt: null },
      data: { joinedAt: new Date() },
    });
  }
  const session = await prisma.liveSession.findUniqueOrThrow({
    where: { id: sessionId },
    select: { meetingLink: true },
  });
  res.json({ meetingLink: session.meetingLink });
});

// ===== Admin =====

liveRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  const { studentIds, ...data } = parsed.data;

  // Mọi id mời phải là học sinh đang hoạt động — chặn mời nhầm admin/tài khoản khóa
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds }, role: 'STUDENT', status: 'ACTIVE' },
    select: { id: true },
  });
  if (students.length !== new Set(studentIds).size) {
    return res.status(400).json({ error: 'Danh sách mời có học sinh không hợp lệ' });
  }

  const session = await prisma.liveSession.create({
    data: {
      ...data,
      createdById: req.user!.id,
      invites: { create: studentIds.map((userId) => ({ userId })) },
    },
  });
  res.status(201).json(session);
});

liveRouter.get('/', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  const sessions = await prisma.liveSession.findMany({
    orderBy: { scheduledAt: 'desc' },
    include: { invites: { select: { joinedAt: true } } },
  });
  res.json(
    sessions.map(({ invites, ...s }) => ({
      ...s,
      status: displayStatus(s),
      cancelled: s.status === 'CANCELLED',
      invitedCount: invites.length,
      joinedCount: invites.filter((i) => i.joinedAt).length,
    }))
  );
});

liveRouter.get('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const session = await prisma.liveSession.findUnique({
    where: { id: req.params.id },
    include: {
      invites: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { user: { name: 'asc' } },
      },
    },
  });
  if (!session) return res.status(404).json({ error: 'Không tìm thấy buổi học' });
  res.json({
    ...session,
    status: displayStatus(session),
    cancelled: session.status === 'CANCELLED',
    invites: session.invites.map((i) => ({ user: i.user, joinedAt: i.joinedAt })),
  });
});

liveRouter.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });

  const existing = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy buổi học' });
  if (existing.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Buổi học đã hủy, không thể sửa' });
  }

  const session = await prisma.liveSession.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(session);
});
