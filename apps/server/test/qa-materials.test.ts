import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

// Hỏi đáp với giáo viên (riêng tư từng học sinh) + nguồn nội dung Bài tập/Slide
// do admin chọn: "ai" (mặc định, sinh tự động) hoặc "teacher" (thầy soạn).
const app = createApp();

let courseId = '';
let lessonId = '';
let student1 = { id: '', token: '' };
let student2 = { id: '', token: '' };
let outsider = { id: '', token: '' };
let adminTok = '';
const DEV = 'dev-qa';

async function mkUser(email: string, role: 'ADMIN' | 'STUDENT') {
  const u = await prisma.user.create({
    data: { email, password: await bcrypt.hash('Passw0rd!', 4), name: email, role },
  });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Passw0rd!', deviceId: DEV });
  return { id: u.id, token: res.body.accessToken as string };
}

beforeAll(async () => {
  const course = await prisma.course.create({
    data: {
      title: 'TEST QA Course', order: 996,
      chapters: { create: { title: 'C', order: 0, lessons: { create: [{ title: 'Bài đồng biến nghịch biến', order: 0 }] } } },
    },
    include: { chapters: { include: { lessons: true } } },
  });
  courseId = course.id;
  lessonId = course.chapters[0].lessons[0].id;

  student1 = await mkUser('qa-s1@example.com', 'STUDENT');
  student2 = await mkUser('qa-s2@example.com', 'STUDENT');
  outsider = await mkUser('qa-out@example.com', 'STUDENT');
  const admin = await mkUser('qa-admin@example.com', 'ADMIN');
  adminTok = admin.token;

  await prisma.enrollment.createMany({
    data: [
      { userId: student1.id, courseId },
      { userId: student2.id, courseId },
    ],
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: ['qa-s1@example.com', 'qa-s2@example.com', 'qa-out@example.com', 'qa-admin@example.com'] } } });
  await prisma.course.delete({ where: { id: courseId } });
  await prisma.$disconnect();
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}`, 'X-Device-Id': DEV });

describe('hỏi đáp với giáo viên', () => {
  let questionId = '';

  it('học sinh đã ghi danh gửi được câu hỏi', async () => {
    const res = await request(app)
      .post(`/api/qa/lessons/${lessonId}`)
      .set(auth(student1.token))
      .send({ content: 'Vì sao không được viết đồng biến trên hợp hai khoảng ạ?' });
    expect(res.status).toBe(201);
    questionId = res.body.id;
  });

  it('học sinh KHÔNG ghi danh bị chặn', async () => {
    const res = await request(app)
      .post(`/api/qa/lessons/${lessonId}`)
      .set(auth(outsider.token))
      .send({ content: 'hỏi ké' });
    expect(res.status).toBe(403);
  });

  it('câu hỏi rỗng bị từ chối', async () => {
    const res = await request(app).post(`/api/qa/lessons/${lessonId}`).set(auth(student1.token)).send({ content: '   ' });
    expect(res.status).toBe(400);
  });

  it('riêng tư: học sinh khác không thấy câu hỏi của bạn', async () => {
    const res = await request(app).get(`/api/qa/lessons/${lessonId}/mine`).set(auth(student2.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('người hỏi thấy câu hỏi của mình, chưa có trả lời', async () => {
    const res = await request(app).get(`/api/qa/lessons/${lessonId}/mine`).set(auth(student1.token));
    expect(res.body).toHaveLength(1);
    expect(res.body[0].content).toContain('hợp hai khoảng');
    expect(res.body[0].answer).toBe('');
  });

  it('admin thấy câu hỏi trong danh sách kèm tên học sinh + bài', async () => {
    const res = await request(app).get('/api/qa/admin?unanswered=1').set(auth(adminTok));
    expect(res.status).toBe(200);
    const q = res.body.find((x: any) => x.id === questionId);
    expect(q).toBeTruthy();
    expect(q.studentName).toBe('qa-s1@example.com');
    expect(q.lessonTitle).toContain('đồng biến');
  });

  it('học sinh không gọi được API admin', async () => {
    const res = await request(app).get('/api/qa/admin').set(auth(student1.token));
    expect(res.status).toBe(403);
  });

  it('đếm câu chưa trả lời cho chấm đỏ', async () => {
    const res = await request(app).get('/api/qa/admin/unanswered-count').set(auth(adminTok));
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  it('admin trả lời → học sinh thấy câu trả lời, biến mất khỏi danh sách chưa trả lời', async () => {
    const res = await request(app)
      .post(`/api/qa/admin/${questionId}/answer`)
      .set(auth(adminTok))
      .send({ answer: 'Vì tính đơn điệu định nghĩa trên MỘT khoảng em nhé.' });
    expect(res.status).toBe(200);

    const mine = await request(app).get(`/api/qa/lessons/${lessonId}/mine`).set(auth(student1.token));
    expect(mine.body[0].answer).toContain('MỘT khoảng');
    expect(mine.body[0].answeredAt).toBeTruthy();

    const list = await request(app).get('/api/qa/admin?unanswered=1').set(auth(adminTok));
    expect(list.body.find((x: any) => x.id === questionId)).toBeFalsy();
  });
});

describe('nguồn nội dung Bài tập/Slide (ai | teacher)', () => {
  const teacherExercises = [{ question: 'Bài thầy tự soạn số 1?', hint: 'gợi ý của thầy', solution: 'lời giải của thầy' }];
  const teacherSlides = [{ title: 'Slide thầy soạn', bullets: ['ý 1 của thầy', 'ý 2 của thầy'] }];

  it('mặc định tab Bài tập trả nội dung AI sinh', async () => {
    const res = await request(app).get(`/api/ai/exercises/${lessonId}`).set(auth(student1.token));
    expect(res.status).toBe(200);
    expect(res.body[0].question).not.toBe('Bài thầy tự soạn số 1?');
  });

  it('học sinh không sửa được tài liệu', async () => {
    const res = await request(app)
      .put(`/api/courses/lessons/${lessonId}/materials`)
      .set(auth(student1.token))
      .send({ exerciseMode: 'teacher', exercises: teacherExercises, slideMode: 'ai', slides: [] });
    expect(res.status).toBe(403);
  });

  it('admin đặt chế độ teacher cho Bài tập → học sinh nhận bài thầy soạn (URL cũ, hiển thị cũ)', async () => {
    const put = await request(app)
      .put(`/api/courses/lessons/${lessonId}/materials`)
      .set(auth(adminTok))
      .send({ exerciseMode: 'teacher', exercises: teacherExercises, slideMode: 'ai', slides: [] });
    expect(put.status).toBe(200);

    const res = await request(app).get(`/api/ai/exercises/${lessonId}`).set(auth(student1.token));
    expect(res.body).toEqual(teacherExercises);
  });

  it('Slide vẫn ở chế độ ai → trả AI sinh dù Bài tập đã teacher', async () => {
    const res = await request(app).get(`/api/ai/slides/${lessonId}`).set(auth(student1.token));
    expect(res.status).toBe(200);
    expect(res.body[0].title).not.toBe('Slide thầy soạn');
  });

  it('admin bật teacher cho Slide → học sinh nhận slide thầy soạn', async () => {
    await request(app)
      .put(`/api/courses/lessons/${lessonId}/materials`)
      .set(auth(adminTok))
      .send({ exerciseMode: 'teacher', exercises: teacherExercises, slideMode: 'teacher', slides: teacherSlides });
    const res = await request(app).get(`/api/ai/slides/${lessonId}`).set(auth(student1.token));
    expect(res.body).toEqual(teacherSlides);
  });

  it('chế độ teacher nhưng chưa soạn gì → rơi về AI (không hiện tab trống)', async () => {
    await request(app)
      .put(`/api/courses/lessons/${lessonId}/materials`)
      .set(auth(adminTok))
      .send({ exerciseMode: 'teacher', exercises: [], slideMode: 'ai', slides: teacherSlides });
    const res = await request(app).get(`/api/ai/exercises/${lessonId}`).set(auth(student1.token));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('admin đọc lại tài liệu để mở editor', async () => {
    const res = await request(app).get(`/api/courses/lessons/${lessonId}/materials`).set(auth(adminTok));
    expect(res.status).toBe(200);
    expect(res.body.exerciseMode).toBe('teacher');
    expect(res.body.slideMode).toBe('ai');
    expect(res.body.slides).toEqual(teacherSlides);
  });

  it('endpoint AI chat đã bị gỡ', async () => {
    const res = await request(app).post(`/api/ai/chat/${lessonId}`).set(auth(student1.token)).send({ history: [] });
    expect(res.status).toBe(404);
  });
});
