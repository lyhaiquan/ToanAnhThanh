import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('metrics', () => {
  it('GET /metrics trả dữ liệu Prometheus', async () => {
    await request(app).get('/api/health'); // tạo ít traffic để có số liệu
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('tat_http_request_duration_seconds');
    expect(res.text).toContain('process_cpu_user_seconds_total');
  });

  it('có METRICS_TOKEN thì thiếu token → 403, đúng token → 200', async () => {
    process.env.METRICS_TOKEN = 'secret-token';
    try {
      const denied = await request(app).get('/metrics');
      expect(denied.status).toBe(403);
      const ok = await request(app).get('/metrics?token=secret-token');
      expect(ok.status).toBe(200);
    } finally {
      delete process.env.METRICS_TOKEN;
    }
  });
});

describe('security headers (helmet)', () => {
  it('có các header bảo vệ cơ bản', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeTruthy();
    expect(res.headers['x-powered-by']).toBeUndefined(); // không lộ Express
  });
});

describe('rate limit đăng nhập', () => {
  it('cùng IP + email: quá 10 lần sai trong 15 phút → 429', async () => {
    const attempt = () =>
      request(app)
        .post('/api/auth/login')
        .send({ email: 'brute-force@example.com', password: 'sai', deviceId: 'd1' });

    for (let i = 0; i < 10; i++) {
      const res = await attempt();
      expect(res.status).toBe(401); // sai mật khẩu bình thường
    }
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
  });

  it('email khác từ cùng IP vẫn đăng nhập được (NAT trường học)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ban-cung-lop@example.com', password: 'sai', deviceId: 'd2' });
    expect(res.status).toBe(401); // không bị 429 — chỉ bị chặn theo (IP+email)
  });
});
