import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

// Kịch bản: 1 khóa học, chương có bài 1 (quiz) + bài 2 (khóa cho tới khi pass bài 1).
// - studentEnrolled: đã ghi danh, CHƯA làm quiz → bài 2 phải bị chặn.
// - studentOutsider: KHÔNG ghi danh → mọi bài phải bị chặn.
const app = createApp();

let courseId = '';
let lesson1Id = '';
let lesson2Id = '';
let quiz1Id = '';
let enrolledTok = '';
let outsiderTok = '';
const DEV = 'dev-access';

async function mkStudent(email: string) {
  const u = await prisma.user.create({
    data: { email, password: await bcrypt.hash('Passw0rd!', 4), name: email, role: 'STUDENT' },
  });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Passw0rd!', deviceId: DEV });
  return { id: u.id, token: res.body.accessToken as string };
}

beforeAll(async () => {
  const course = await prisma.course.create({
    data: {
      title: 'TEST Access Course', order: 998,
      chapters: {
        create: {
          title: 'C', order: 0,
          lessons: {
            create: [
              {
                title: 'A1', order: 0, videoRef: 'sample1.mp4',
                quiz: { create: { passScore: 70, questions: { create: [
                  { order: 0, text: 'q', optionsJson: '["1","2"]', answerIndex: 1 },
                ] } } },
              },
              { title: 'A2', order: 1, videoRef: 'sample2.mp4' },
            ],
          },
        },
      },
    },
    include: { chapters: { include: { lessons: { include: { quiz: true } } } } },
  });
  courseId = course.id;
  const lessons = course.chapters[0].lessons.sort((a, b) => a.order - b.order);
  lesson1Id = lessons[0].id;
  lesson2Id = lessons[1].id;
  quiz1Id = lessons[0].quiz!.id;

  const enrolled = await mkStudent('access-enrolled@example.com');
  enrolledTok = enrolled.token;
  await prisma.enrollment.create({ data: { userId: enrolled.id, courseId } });

  const outsider = await mkStudent('access-outsider@example.com');
  outsiderTok = outsider.token;
  // KHÔNG ghi danh outsider
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: ['access-enrolled@example.com', 'access-outsider@example.com'] } } });
  await prisma.course.delete({ where: { id: courseId } });
  await prisma.$disconnect();
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}`, 'X-Device-Id': DEV });

describe('gate video (stream token) không được bypass', () => {
  it('học sinh đã ghi danh KHÔNG xin được token cho bài đang khóa', async () => {
    const res = await request(app).post(`/api/stream/token/${lesson2Id}`).set(auth(enrolledTok));
    expect(res.status).toBe(403);
  });
  it('học sinh xin được token cho bài đầu (đã mở)', async () => {
    const res = await request(app).post(`/api/stream/token/${lesson1Id}`).set(auth(enrolledTok));
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
});

describe('chặn truy cập khóa chưa ghi danh (enrollment)', () => {
  it('outsider KHÔNG xin được token bài đầu của khóa chưa ghi danh', async () => {
    const res = await request(app).post(`/api/stream/token/${lesson1Id}`).set(auth(outsiderTok));
    expect(res.status).toBe(403);
  });
  it('outsider KHÔNG lấy được quiz của khóa chưa ghi danh', async () => {
    const res = await request(app).get(`/api/quiz/lesson/${lesson1Id}`).set(auth(outsiderTok));
    expect(res.status).toBe(403);
  });
  it('outsider KHÔNG gọi được AI cho bài của khóa chưa ghi danh', async () => {
    const res = await request(app).get(`/api/ai/analyze/${lesson1Id}`).set(auth(outsiderTok));
    expect(res.status).toBe(403);
  });
});

describe('gate quiz theo bài', () => {
  it('học sinh đã ghi danh KHÔNG lấy được quiz bài đang khóa', async () => {
    const res = await request(app).get(`/api/quiz/lesson/${lesson2Id}`).set(auth(enrolledTok));
    expect(res.status).toBe(403);
  });
});
