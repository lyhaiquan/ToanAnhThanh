import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

// Đổi tên bài học / chương từ trang quản lý nội dung: chỉ admin, validate title.
const app = createApp();

const EMAILS = ['rename-admin@example.com', 'rename-student@example.com'];
const DEV = 'dev-rename';

let adminTok = '';
let studentTok = '';
let courseId = '';
let chapterId = '';
let lessonId = '';

beforeAll(async () => {
  const pw = await bcrypt.hash('Passw0rd!', 4);
  await prisma.user.create({ data: { email: EMAILS[0], password: pw, name: 'A', role: 'ADMIN' } });
  await prisma.user.create({ data: { email: EMAILS[1], password: pw, name: 'S', role: 'STUDENT' } });
  const login = async (email: string) => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'Passw0rd!', deviceId: DEV });
    return res.body.accessToken as string;
  };
  adminTok = await login(EMAILS[0]);
  studentTok = await login(EMAILS[1]);

  const course = await prisma.course.create({
    data: {
      title: 'TEST Rename Course', order: 997,
      chapters: { create: { title: 'Chương cũ', order: 0, lessons: { create: { title: 'Bài cũ', order: 0, videoRef: 'x.mp4' } } } },
    },
    include: { chapters: { include: { lessons: true } } },
  });
  courseId = course.id;
  chapterId = course.chapters[0].id;
  lessonId = course.chapters[0].lessons[0].id;
});

afterAll(async () => {
  await prisma.course.delete({ where: { id: courseId } });
  await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
  await prisma.$disconnect();
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}`, 'X-Device-Id': DEV });

describe('đổi tên bài học', () => {
  it('ADMIN đổi được tên bài', async () => {
    const res = await request(app)
      .patch(`/api/courses/lessons/${lessonId}`)
      .set(auth(adminTok))
      .send({ title: 'Bài mới đẹp hơn' });
    expect(res.status).toBe(200);
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    expect(lesson?.title).toBe('Bài mới đẹp hơn');
  });

  it('STUDENT không đổi được (403)', async () => {
    const res = await request(app)
      .patch(`/api/courses/lessons/${lessonId}`)
      .set(auth(studentTok))
      .send({ title: 'Hack' });
    expect(res.status).toBe(403);
  });

  it('bài không tồn tại → 404', async () => {
    const res = await request(app)
      .patch('/api/courses/lessons/khong-ton-tai')
      .set(auth(adminTok))
      .send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('title rỗng bị từ chối (400)', async () => {
    const res = await request(app)
      .patch(`/api/courses/lessons/${lessonId}`)
      .set(auth(adminTok))
      .send({ title: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('đổi tên chương', () => {
  it('ADMIN đổi được tên chương', async () => {
    const res = await request(app)
      .patch(`/api/courses/chapters/${chapterId}`)
      .set(auth(adminTok))
      .send({ title: 'Chương mới' });
    expect(res.status).toBe(200);
    const ch = await prisma.chapter.findUnique({ where: { id: chapterId } });
    expect(ch?.title).toBe('Chương mới');
  });

  it('STUDENT không đổi được (403)', async () => {
    const res = await request(app)
      .patch(`/api/courses/chapters/${chapterId}`)
      .set(auth(studentTok))
      .send({ title: 'Hack' });
    expect(res.status).toBe(403);
  });

  it('chương không tồn tại → 404', async () => {
    const res = await request(app)
      .patch('/api/courses/chapters/khong-ton-tai')
      .set(auth(adminTok))
      .send({ title: 'X' });
    expect(res.status).toBe(404);
  });
});
