import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

// Kịch bản lớp học live: admin tạo buổi + mời invited; outsider không được mời.
// Kiểm: quyền tạo, danh sách /mine, điểm danh join (idempotent), chặn outsider,
// chặn buổi đã hủy, validate meetingLink và danh sách mời.
const app = createApp();

const EMAILS = [
  'live-admin@example.com',
  'live-invited@example.com',
  'live-outsider@example.com',
  'live-banned@example.com',
];
const DEV = 'dev-live';

let adminTok = '';
let invitedTok = '';
let outsiderTok = '';
let invitedId = '';
let bannedId = '';
let adminId = '';

async function login(email: string, password: string) {
  const res = await request(app).post('/api/auth/login').send({ email, password, deviceId: DEV });
  return res.body.accessToken as string;
}

beforeAll(async () => {
  const pw = await bcrypt.hash('Passw0rd!', 4);
  const admin = await prisma.user.create({
    data: { email: EMAILS[0], password: pw, name: 'LiveAdmin', role: 'ADMIN' },
  });
  adminId = admin.id;
  const invited = await prisma.user.create({
    data: { email: EMAILS[1], password: pw, name: 'Invited', role: 'STUDENT' },
  });
  invitedId = invited.id;
  const outsider = await prisma.user.create({
    data: { email: EMAILS[2], password: pw, name: 'Outsider', role: 'STUDENT' },
  });
  const banned = await prisma.user.create({
    data: { email: EMAILS[3], password: pw, name: 'Banned', role: 'STUDENT', status: 'BANNED' },
  });
  bannedId = banned.id;

  adminTok = await login(EMAILS[0], 'Passw0rd!');
  invitedTok = await login(EMAILS[1], 'Passw0rd!');
  outsiderTok = await login(EMAILS[2], 'Passw0rd!');
});

afterAll(async () => {
  await prisma.liveSession.deleteMany({ where: { createdBy: { email: EMAILS[0] } } });
  await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
  await prisma.$disconnect();
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}`, 'X-Device-Id': DEV });

function mkPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Ôn tập hình học',
    description: 'Chương 3',
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    studentIds: [invitedId],
    ...overrides,
  };
}

describe('tạo buổi live', () => {
  it('ADMIN tạo được buổi kèm danh sách mời', async () => {
    const res = await request(app).post('/api/live-sessions').set(auth(adminTok)).send(mkPayload());
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.title).toBe('Ôn tập hình học');
    const invites = await prisma.liveSessionInvite.findMany({ where: { liveSessionId: res.body.id } });
    expect(invites.map((i) => i.userId)).toEqual([invitedId]);
  });

  it('STUDENT không tạo được buổi (403)', async () => {
    const res = await request(app).post('/api/live-sessions').set(auth(invitedTok)).send(mkPayload());
    expect(res.status).toBe(403);
  });

  it('meetingLink không phải http(s) bị từ chối (400)', async () => {
    const res = await request(app)
      .post('/api/live-sessions')
      .set(auth(adminTok))
      .send(mkPayload({ meetingLink: 'javascript:alert(1)' }));
    expect(res.status).toBe(400);
  });

  it('mời id không phải STUDENT-ACTIVE bị từ chối (400)', async () => {
    for (const bad of [['id-khong-ton-tai'], [adminId], [bannedId]]) {
      const res = await request(app)
        .post('/api/live-sessions')
        .set(auth(adminTok))
        .send(mkPayload({ studentIds: bad }));
      expect(res.status).toBe(400);
    }
  });
});

describe('học sinh xem và vào lớp', () => {
  let sessionId = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/live-sessions').set(auth(adminTok)).send(mkPayload());
    sessionId = res.body.id;
  });

  it('học sinh được mời thấy buổi trong /mine, outsider thì không', async () => {
    const mine = await request(app).get('/api/live-sessions/mine').set(auth(invitedTok));
    expect(mine.status).toBe(200);
    expect(mine.body.some((s: { id: string }) => s.id === sessionId)).toBe(true);
    expect(mine.body[0].status).toBe('upcoming');

    const other = await request(app).get('/api/live-sessions/mine').set(auth(outsiderTok));
    expect(other.body.some((s: { id: string }) => s.id === sessionId)).toBe(false);
  });

  it('join ghi joinedAt lần đầu và idempotent khi gọi lại', async () => {
    const res1 = await request(app).post(`/api/live-sessions/${sessionId}/join`).set(auth(invitedTok));
    expect(res1.status).toBe(200);
    expect(res1.body.meetingLink).toBe('https://meet.google.com/abc-defg-hij');
    const inv1 = await prisma.liveSessionInvite.findUnique({
      where: { liveSessionId_userId: { liveSessionId: sessionId, userId: invitedId } },
    });
    expect(inv1?.joinedAt).toBeTruthy();

    const res2 = await request(app).post(`/api/live-sessions/${sessionId}/join`).set(auth(invitedTok));
    expect(res2.status).toBe(200);
    const inv2 = await prisma.liveSessionInvite.findUnique({
      where: { liveSessionId_userId: { liveSessionId: sessionId, userId: invitedId } },
    });
    expect(inv2?.joinedAt?.getTime()).toBe(inv1?.joinedAt?.getTime());
  });

  it('outsider không join được (403)', async () => {
    const res = await request(app).post(`/api/live-sessions/${sessionId}/join`).set(auth(outsiderTok));
    expect(res.status).toBe(403);
  });

  it('buổi đã hủy chặn join và /mine trả trạng thái cancelled', async () => {
    const patch = await request(app)
      .patch(`/api/live-sessions/${sessionId}`)
      .set(auth(adminTok))
      .send({ status: 'CANCELLED' });
    expect(patch.status).toBe(200);

    const join = await request(app).post(`/api/live-sessions/${sessionId}/join`).set(auth(invitedTok));
    expect(join.status).toBe(403);

    const mine = await request(app).get('/api/live-sessions/mine').set(auth(invitedTok));
    const found = mine.body.find((s: { id: string }) => s.id === sessionId);
    expect(found.status).toBe('cancelled');
  });
});

describe('admin quản lý', () => {
  it('GET danh sách + chi tiết kèm điểm danh', async () => {
    const list = await request(app).get('/api/live-sessions').set(auth(adminTok));
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThan(0);
    expect(list.body[0]).toHaveProperty('invitedCount');
    expect(list.body[0]).toHaveProperty('joinedCount');

    const detail = await request(app).get(`/api/live-sessions/${list.body[0].id}`).set(auth(adminTok));
    expect(detail.status).toBe(200);
    expect(Array.isArray(detail.body.invites)).toBe(true);
    expect(detail.body.invites[0]).toHaveProperty('joinedAt');
  });

  it('STUDENT không xem được danh sách admin (403)', async () => {
    const res = await request(app).get('/api/live-sessions').set(auth(invitedTok));
    expect(res.status).toBe(403);
  });
});
