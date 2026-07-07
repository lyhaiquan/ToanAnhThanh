import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { flushActivityBuffer } from '../src/modules/security/logbuffer.js';

const EMAIL = 'test-resilience@example.com';
const DEVICE = 'test-device-resilience';
let token = '';

// Route ném lỗi async — mô phỏng DB timeout giữa chừng
const app = createApp((a) => {
  a.get('/api/test-boom', async () => {
    throw new Error('boom');
  });
});

beforeAll(async () => {
  const password = await bcrypt.hash('Test@123', 10);
  await prisma.user.upsert({
    where: { email: EMAIL },
    update: { status: 'ACTIVE', boundDeviceId: null },
    create: { email: EMAIL, password, name: 'Resilience User', role: 'STUDENT' },
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: 'Test@123', deviceId: DEVICE });
  token = res.body.accessToken;
});

afterAll(async () => {
  await prisma.activityLog.deleteMany({ where: { user: { email: EMAIL } } });
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await prisma.$disconnect();
});

describe('chống chết server (async error)', () => {
  it('route async ném lỗi → 500 JSON, không crash', async () => {
    const res = await request(app).get('/api/test-boom');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('boom');
  });

  it('server vẫn phục vụ request tiếp theo bình thường', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('activity log batching', () => {
  it('POST /activity trả ok ngay, ghi DB theo batch sau khi flush', async () => {
    const before = await prisma.activityLog.count({ where: { user: { email: EMAIL } } });

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/security/activity')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Device-Id', DEVICE)
        .send({ type: 'VIDEO_PLAY', metadata: { i } });
      expect(res.status).toBe(200);
    }

    await flushActivityBuffer();
    const after = await prisma.activityLog.count({ where: { user: { email: EMAIL } } });
    expect(after - before).toBe(5);
  });

  it('flush lần nữa khi buffer rỗng không lỗi, không ghi thêm', async () => {
    const before = await prisma.activityLog.count({ where: { user: { email: EMAIL } } });
    await flushActivityBuffer();
    const after = await prisma.activityLog.count({ where: { user: { email: EMAIL } } });
    expect(after).toBe(before);
  });
});
