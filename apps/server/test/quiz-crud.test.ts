import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

// Soạn quiz từ trang quản trị: tạo/sửa/xóa quiz cho bài học, xem đề kèm đáp án.
// Học sinh tuyệt đối không thấy answerIndex và không đụng được các route soạn đề.
const app = createApp();

const EMAILS = ['quizcrud-admin@example.com', 'quizcrud-student@example.com'];
const DEV = 'dev-quizcrud';

let adminTok = '';
let studentTok = '';
let courseId = '';
let lessonId = '';

const validQuiz = {
  passScore: 80,
  questions: [
    { text: '1+1=?', options: ['1', '2', '3', '4'], answerIndex: 1, explanation: 'hiển nhiên' },
    { text: '2x3=?', options: ['5', '6', '7', '8'], answerIndex: 1 },
  ],
};

beforeAll(async () => {
  const pw = await bcrypt.hash('Passw0rd!', 4);
  await prisma.user.create({ data: { email: EMAILS[0], password: pw, name: 'A', role: 'ADMIN' } });
  const student = await prisma.user.create({ data: { email: EMAILS[1], password: pw, name: 'S', role: 'STUDENT' } });

  const course = await prisma.course.create({
    data: {
      title: 'TEST QuizCrud', order: 996,
      chapters: { create: { title: 'C', order: 0, lessons: { create: { title: 'L1', order: 0, videoRef: 'x.mp4' } } } },
    },
    include: { chapters: { include: { lessons: true } } },
  });
  courseId = course.id;
  lessonId = course.chapters[0].lessons[0].id;
  await prisma.enrollment.create({ data: { userId: student.id, courseId } });

  const login = async (email: string) => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'Passw0rd!', deviceId: DEV });
    return res.body.accessToken as string;
  };
  adminTok = await login(EMAILS[0]);
  studentTok = await login(EMAILS[1]);
});

afterAll(async () => {
  await prisma.course.delete({ where: { id: courseId } });
  await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
  await prisma.$disconnect();
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}`, 'X-Device-Id': DEV });

describe('tạo quiz cho bài học', () => {
  it('ADMIN tạo được quiz, học sinh xem đề KHÔNG thấy đáp án', async () => {
    const res = await request(app).post(`/api/quiz/lesson/${lessonId}`).set(auth(adminTok)).send(validQuiz);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();

    const view = await request(app).get(`/api/quiz/lesson/${lessonId}`).set(auth(studentTok));
    expect(view.status).toBe(200);
    expect(view.body.questions).toHaveLength(2);
    expect(JSON.stringify(view.body)).not.toContain('answerIndex');
  });

  it('bài đã có quiz thì không tạo thêm (409)', async () => {
    const res = await request(app).post(`/api/quiz/lesson/${lessonId}`).set(auth(adminTok)).send(validQuiz);
    expect(res.status).toBe(409);
  });

  it('STUDENT không tạo được (403)', async () => {
    const res = await request(app).post(`/api/quiz/lesson/${lessonId}`).set(auth(studentTok)).send(validQuiz);
    expect(res.status).toBe(403);
  });

  it('bài không tồn tại → 404', async () => {
    const res = await request(app).post('/api/quiz/lesson/khong-co').set(auth(adminTok)).send(validQuiz);
    expect(res.status).toBe(404);
  });

  it('validate: thiếu câu hỏi / options ≠ 4 / answerIndex ngoài 0-3 / passScore ngoài 0-100 → 400', async () => {
    const bads = [
      { ...validQuiz, questions: [] },
      { ...validQuiz, questions: [{ text: 'q', options: ['1', '2', '3'], answerIndex: 0 }] },
      { ...validQuiz, questions: [{ text: 'q', options: ['1', '2', '3', '4'], answerIndex: 4 }] },
      { ...validQuiz, passScore: 101 },
    ];
    for (const bad of bads) {
      // dùng lesson khác chưa có quiz để không dính 409 trước khi validate
      const l2 = await prisma.lesson.create({
        data: { title: 'tmp', order: 99, videoRef: 'x.mp4', chapterId: (await prisma.lesson.findUnique({ where: { id: lessonId }, select: { chapterId: true } }))!.chapterId },
      });
      const res = await request(app).post(`/api/quiz/lesson/${l2.id}`).set(auth(adminTok)).send(bad);
      expect(res.status).toBe(400);
      await prisma.lesson.delete({ where: { id: l2.id } });
    }
  });
});

describe('xem đề kèm đáp án (admin)', () => {
  it('ADMIN xem full đề có answerIndex + explanation', async () => {
    const res = await request(app).get(`/api/quiz/lesson/${lessonId}/admin`).set(auth(adminTok));
    expect(res.status).toBe(200);
    expect(res.body.passScore).toBe(80);
    expect(res.body.questions[0].answerIndex).toBe(1);
    expect(res.body.questions[0].explanation).toBe('hiển nhiên');
  });

  it('STUDENT không xem được (403)', async () => {
    const res = await request(app).get(`/api/quiz/lesson/${lessonId}/admin`).set(auth(studentTok));
    expect(res.status).toBe(403);
  });
});

describe('sửa và xóa quiz', () => {
  it('PUT thay toàn bộ đề: số câu + điểm đạt đổi theo', async () => {
    const quiz = await prisma.quiz.findUnique({ where: { lessonId } });
    const res = await request(app)
      .put(`/api/quiz/${quiz!.id}`)
      .set(auth(adminTok))
      .send({ passScore: 60, questions: [{ text: 'chỉ 1 câu', options: ['a', 'b', 'c', 'd'], answerIndex: 3 }] });
    expect(res.status).toBe(200);

    const after = await prisma.quiz.findUnique({ where: { lessonId }, include: { questions: true } });
    expect(after?.passScore).toBe(60);
    expect(after?.questions).toHaveLength(1);
    expect(after?.questions[0].answerIndex).toBe(3);
  });

  it('DELETE xóa quiz — học sinh xem đề nhận 404', async () => {
    const quiz = await prisma.quiz.findUnique({ where: { lessonId } });
    const res = await request(app).delete(`/api/quiz/${quiz!.id}`).set(auth(adminTok));
    expect(res.status).toBe(200);

    const view = await request(app).get(`/api/quiz/lesson/${lessonId}`).set(auth(studentTok));
    expect(view.status).toBe(404);
  });
});
