import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

const app = createApp();
const EMAIL = 'test-revoke@example.com';
const DEV = 'dev-revoke';
let userId = '';
let refreshToken = '';

beforeAll(async () => {
  const u = await prisma.user.create({
    data: { email: EMAIL, password: await bcrypt.hash('Passw0rd!', 4), name: 'Revoke', role: 'STUDENT' },
  });
  userId = u.id;
  const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'Passw0rd!', deviceId: DEV });
  refreshToken = res.body.refreshToken;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await prisma.$disconnect();
});

describe('thu hồi refresh token', () => {
  it('refresh token dùng được khi tài khoản bình thường', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('sau khi admin reset thiết bị, refresh token cũ bị vô hiệu', async () => {
    // Mô phỏng reset-device (tăng tokenVersion)
    await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });

  it('đăng nhập lại lấy token mới → dùng được; logout → token mới đó bị thu hồi', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'Passw0rd!', deviceId: DEV });
    const fresh = login.body.refreshToken;
    const access = login.body.accessToken;
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: fresh })).status).toBe(200);

    await request(app).post('/api/auth/logout').set({ Authorization: `Bearer ${access}`, 'X-Device-Id': DEV });
    const afterLogout = await request(app).post('/api/auth/refresh').send({ refreshToken: fresh });
    expect(afterLogout.status).toBe(401);
  });
});
