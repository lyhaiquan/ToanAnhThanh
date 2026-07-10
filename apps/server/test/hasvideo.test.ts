import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { config } from '../src/config.js';

// Bug thực tế trên VPS: seed gán videoRef nhưng file không có trên đĩa
// → client render player, stream 404, retry vô hạn gây nhấp nháy.
// hasVideo phải phản ánh việc file THẬT SỰ tồn tại, kèm cờ videoPending
// để UI phân biệt "bài không có video" với "video chưa được tải lên".
const app = createApp();

const EXISTING_FILE = 'test-hasvideo-exists.mp4';
let courseId = '';
let lessonWithFile = '';
let lessonMissingFile = '';
let lessonNoVideo = '';
let adminTok = '';
const DEV = 'dev-hasvideo';

beforeAll(async () => {
  fs.mkdirSync(config.uploadDir, { recursive: true });
  fs.writeFileSync(path.join(config.uploadDir, EXISTING_FILE), 'fake-mp4-bytes');

  await prisma.user.create({
    data: { email: 'hasvideo-admin@example.com', password: await bcrypt.hash('Passw0rd!', 4), name: 'HV Admin', role: 'ADMIN' },
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'hasvideo-admin@example.com', password: 'Passw0rd!', deviceId: DEV });
  adminTok = login.body.accessToken;

  const course = await prisma.course.create({
    data: {
      title: 'TEST HasVideo Course', order: 997,
      chapters: {
        create: {
          title: 'C', order: 0,
          lessons: {
            create: [
              { title: 'Có file', order: 0, videoRef: EXISTING_FILE },
              { title: 'Mất file', order: 1, videoRef: 'test-hasvideo-missing.mp4' },
              { title: 'Không video', order: 2, videoRef: '' },
            ],
          },
        },
      },
    },
    include: { chapters: { include: { lessons: true } } },
  });
  courseId = course.id;
  const lessons = course.chapters[0].lessons.sort((a, b) => a.order - b.order);
  lessonWithFile = lessons[0].id;
  lessonMissingFile = lessons[1].id;
  lessonNoVideo = lessons[2].id;
});

afterAll(async () => {
  fs.rmSync(path.join(config.uploadDir, EXISTING_FILE), { force: true });
  await prisma.course.delete({ where: { id: courseId } });
  await prisma.user.deleteMany({ where: { email: 'hasvideo-admin@example.com' } });
  await prisma.$disconnect();
});

const auth = { get Authorization() { return `Bearer ${adminTok}`; }, 'X-Device-Id': DEV };

describe('hasVideo phản ánh file thật trên đĩa', () => {
  it('videoRef có + file tồn tại → hasVideo true, videoPending false', async () => {
    const res = await request(app).get(`/api/courses/lessons/${lessonWithFile}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.hasVideo).toBe(true);
    expect(res.body.videoPending).toBe(false);
  });

  it('videoRef có nhưng file MẤT → hasVideo false, videoPending true (không render player hỏng)', async () => {
    const res = await request(app).get(`/api/courses/lessons/${lessonMissingFile}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.hasVideo).toBe(false);
    expect(res.body.videoPending).toBe(true);
  });

  it('không có videoRef → hasVideo false, videoPending false', async () => {
    const res = await request(app).get(`/api/courses/lessons/${lessonNoVideo}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.hasVideo).toBe(false);
    expect(res.body.videoPending).toBe(false);
  });
});
