import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

const app = createApp();
const EMAIL = 'test-device@example.com';

beforeAll(async () => {
  const password = await bcrypt.hash('Test@123', 10);
  await prisma.user.upsert({
    where: { email: EMAIL },
    update: { status: 'ACTIVE', boundDeviceId: null, boundDeviceLabel: null, boundDeviceAt: null },
    create: { email: EMAIL, password, name: 'Device Tester', role: 'STUDENT' },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await prisma.$disconnect();
});

const login = (deviceId?: string) =>
  request(app).post('/api/auth/login').send({ email: EMAIL, password: 'Test@123', deviceId });

describe('khóa 1 thiết bị / học sinh', () => {
  it('lần đầu đăng nhập → khóa vào thiết bị đó', async () => {
    const res = await login('device-A');
    expect(res.status).toBe(200);
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    expect(user?.boundDeviceId).toBe('device-A');
  });

  it('đăng nhập lại cùng thiết bị → OK', async () => {
    const res = await login('device-A');
    expect(res.status).toBe(200);
  });

  it('đăng nhập thiết bị khác → 403 DEVICE_LOCKED', async () => {
    const res = await login('device-B');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('DEVICE_LOCKED');
  });

  it('thiếu deviceId → bị từ chối', async () => {
    const res = await login(undefined);
    expect(res.status).toBe(401);
  });

  it('request với sai X-Device-Id → 403 DEVICE_MISMATCH', async () => {
    const good = await login('device-A');
    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${good.body.accessToken}`)
      .set('X-Device-Id', 'device-KHAC');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('DEVICE_MISMATCH');
  });

  it('request với đúng X-Device-Id → OK', async () => {
    const good = await login('device-A');
    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${good.body.accessToken}`)
      .set('X-Device-Id', 'device-A');
    expect(res.status).toBe(200);
  });

  it('admin reset thiết bị → đăng nhập được máy mới, khóa lại máy mới', async () => {
    await prisma.user.update({
      where: { email: EMAIL },
      data: { boundDeviceId: null, boundDeviceLabel: null, boundDeviceAt: null },
    });
    const res = await login('device-B');
    expect(res.status).toBe(200);
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    expect(user?.boundDeviceId).toBe('device-B');
  });
});
