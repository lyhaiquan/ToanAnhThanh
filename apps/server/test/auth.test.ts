import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

const app = createApp();
const EMAIL = 'test-auth@example.com';
const BANNED_EMAIL = 'test-banned@example.com';

beforeAll(async () => {
  const password = await bcrypt.hash('Test@123', 10);
  await prisma.user.upsert({
    where: { email: EMAIL },
    update: { status: 'ACTIVE' },
    create: { email: EMAIL, password, name: 'Test User', role: 'STUDENT' },
  });
  await prisma.user.upsert({
    where: { email: BANNED_EMAIL },
    update: { status: 'BANNED' },
    create: { email: BANNED_EMAIL, password, name: 'Banned User', role: 'STUDENT', status: 'BANNED' },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [EMAIL, BANNED_EMAIL] } } });
  await prisma.$disconnect();
});

describe('auth', () => {
  it('login đúng trả về token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'Test@123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.role).toBe('STUDENT');
  });

  it('login sai mật khẩu → 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'sai-mat-khau' });
    expect(res.status).toBe(401);
  });

  it('user bị ban không login được', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: BANNED_EMAIL, password: 'Test@123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('khóa');
  });

  it('refresh token hợp lệ cấp access token mới', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'Test@123' });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: login.body.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('access token không dùng được làm refresh token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'Test@123' });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: login.body.accessToken });
    expect(res.status).toBe(401);
  });
});

describe('RBAC', () => {
  it('STUDENT bị chặn khỏi route admin', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'Test@123' });
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('chưa đăng nhập → 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('ADMIN truy cập được route admin', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@toananhthanh.vn', password: 'Admin@123' });
    expect(login.status).toBe(200);
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(res.status).toBe(200);
  });
});
