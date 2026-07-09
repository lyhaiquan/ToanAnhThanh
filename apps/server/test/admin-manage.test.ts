import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

// Cụm quản trị cho production: sửa/xóa khóa học, đổi mật khẩu (tự đổi + admin đặt lại),
// tạo học sinh hàng loạt (tự sinh mật khẩu đạt chính sách nếu bỏ trống).
const app = createApp();

const EMAILS = [
  'manage-admin@example.com',
  'manage-student@example.com',
  'bulk-a@example.com',
  'bulk-b@example.com',
  'bulk-dup@example.com',
];
const DEV = 'dev-manage';

let adminTok = '';
let studentTok = '';
let studentRefresh = '';
let studentId = '';
let courseId = '';

async function login(email: string, password: string) {
  return request(app).post('/api/auth/login').send({ email, password, deviceId: DEV });
}

beforeAll(async () => {
  const pw = await bcrypt.hash('Passw0rd!', 4);
  await prisma.user.create({ data: { email: EMAILS[0], password: pw, name: 'A', role: 'ADMIN' } });
  const student = await prisma.user.create({ data: { email: EMAILS[1], password: pw, name: 'S', role: 'STUDENT' } });
  studentId = student.id;
  await prisma.user.create({ data: { email: EMAILS[4], password: pw, name: 'Dup', role: 'STUDENT' } });

  const course = await prisma.course.create({ data: { title: 'TEST Manage Course', order: 995 } });
  courseId = course.id;

  adminTok = (await login(EMAILS[0], 'Passw0rd!')).body.accessToken;
  const sres = await login(EMAILS[1], 'Passw0rd!');
  studentTok = sres.body.accessToken;
  studentRefresh = sres.body.refreshToken;
});

afterAll(async () => {
  await prisma.course.deleteMany({ where: { title: { startsWith: 'TEST Manage' } } });
  await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
  await prisma.$disconnect();
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}`, 'X-Device-Id': DEV });

describe('sửa / xóa khóa học', () => {
  it('ADMIN đổi được tiêu đề + mô tả khóa', async () => {
    const res = await request(app)
      .patch(`/api/courses/${courseId}`)
      .set(auth(adminTok))
      .send({ title: 'TEST Manage Course (mới)', description: 'mô tả mới' });
    expect(res.status).toBe(200);
    const c = await prisma.course.findUnique({ where: { id: courseId } });
    expect(c?.title).toBe('TEST Manage Course (mới)');
    expect(c?.description).toBe('mô tả mới');
  });

  it('STUDENT không sửa được khóa (403)', async () => {
    const res = await request(app).patch(`/api/courses/${courseId}`).set(auth(studentTok)).send({ title: 'Hack' });
    expect(res.status).toBe(403);
  });

  it('khóa không tồn tại → 404', async () => {
    const res = await request(app).patch('/api/courses/khong-co').set(auth(adminTok)).send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('ADMIN xóa được khóa (cascade chương/bài)', async () => {
    const tmp = await prisma.course.create({
      data: { title: 'TEST Manage Del', order: 994, chapters: { create: { title: 'C', order: 0 } } },
    });
    const res = await request(app).delete(`/api/courses/${tmp.id}`).set(auth(adminTok));
    expect(res.status).toBe(200);
    expect(await prisma.course.findUnique({ where: { id: tmp.id } })).toBeNull();
  });
});

describe('tự đổi mật khẩu', () => {
  it('sai mật khẩu cũ → 400, không đổi gì', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set(auth(studentTok))
      .send({ oldPassword: 'SaiRoi123', newPassword: 'MatKhauMoi9' });
    expect(res.status).toBe(400);
    expect((await login(EMAILS[1], 'Passw0rd!')).status).toBe(200);
  });

  it('mật khẩu mới yếu (không số) → 400', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set(auth(studentTok))
      .send({ oldPassword: 'Passw0rd!', newPassword: 'toanlaykho' });
    expect(res.status).toBe(400);
  });

  it('đổi đúng: mật khẩu cũ hết dùng được, mới dùng được, refresh token cũ bị thu hồi', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set(auth(studentTok))
      .send({ oldPassword: 'Passw0rd!', newPassword: 'MatKhauMoi9' });
    expect(res.status).toBe(200);

    expect((await login(EMAILS[1], 'Passw0rd!')).status).toBe(401);
    expect((await login(EMAILS[1], 'MatKhauMoi9')).status).toBe(200);

    const refresh = await request(app).post('/api/auth/refresh').send({ refreshToken: studentRefresh });
    expect(refresh.status).toBe(401);
  });
});

describe('admin đặt lại mật khẩu học sinh', () => {
  it('ADMIN đặt lại được, học sinh đăng nhập bằng mật khẩu mới', async () => {
    const res = await request(app)
      .patch(`/api/users/${studentId}/password`)
      .set(auth(adminTok))
      .send({ password: 'ThayDatLai8' });
    expect(res.status).toBe(200);
    expect((await login(EMAILS[1], 'ThayDatLai8')).status).toBe(200);
  });

  it('không đặt được cho tài khoản không phải học sinh (404)', async () => {
    const admin = await prisma.user.findUnique({ where: { email: EMAILS[0] } });
    const res = await request(app)
      .patch(`/api/users/${admin!.id}/password`)
      .set(auth(adminTok))
      .send({ password: 'ThayDatLai8' });
    expect(res.status).toBe(404);
  });

  it('mật khẩu yếu → 400', async () => {
    const res = await request(app)
      .patch(`/api/users/${studentId}/password`)
      .set(auth(adminTok))
      .send({ password: 'ngan1' });
    expect(res.status).toBe(400);
  });
});

describe('tạo học sinh hàng loạt', () => {
  it('tạo nhiều em: có mật khẩu tự chọn, tự sinh khi bỏ trống, báo email trùng; auto-enroll mọi khóa', async () => {
    const res = await request(app)
      .post('/api/users/bulk')
      .set(auth(adminTok))
      .send({
        students: [
          { name: 'Bulk A', email: EMAILS[2], password: 'MatKhau123' },
          { name: 'Bulk B', email: EMAILS[3] },
          { name: 'Trùng', email: EMAILS[4] },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.created).toHaveLength(2);
    expect(res.body.skipped).toHaveLength(1);
    expect(res.body.skipped[0].email).toBe(EMAILS[4]);

    // Mật khẩu tự sinh phải đạt chính sách và đăng nhập được
    const genPw = res.body.created.find((c: { email: string }) => c.email === EMAILS[3]).password;
    expect(genPw).toMatch(/^(?=.*[A-Za-z])(?=.*[0-9]).{8,}$/);
    expect((await login(EMAILS[3], genPw)).status).toBe(200);

    // Auto-enroll đủ mọi khóa hiện có
    const courseCount = await prisma.course.count();
    const b = await prisma.user.findUnique({ where: { email: EMAILS[3] }, include: { enrollments: true } });
    expect(b?.enrollments).toHaveLength(courseCount);
  });

  it('STUDENT không gọi được (403)', async () => {
    const res = await request(app)
      .post('/api/users/bulk')
      .set(auth(studentTok))
      .send({ students: [{ name: 'X', email: 'x@example.com' }] });
    expect(res.status).toBe(403);
  });

  it('danh sách rỗng hoặc email sai định dạng → 400', async () => {
    for (const bad of [{ students: [] }, { students: [{ name: 'X', email: 'khong-phai-email' }] }]) {
      const res = await request(app).post('/api/users/bulk').set(auth(adminTok)).send(bad);
      expect(res.status).toBe(400);
    }
  });
});
