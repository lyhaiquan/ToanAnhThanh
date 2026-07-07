import express from 'express';
import 'express-async-errors'; // vá Express 4: lỗi trong async handler đi vào error middleware thay vì giết process
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { metricsMiddleware, metricsHandler } from './metrics.js';
import { config } from './config.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRouter } from './modules/auth/router.js';
import { usersRouter } from './modules/users/router.js';
import { coursesRouter } from './modules/courses/router.js';
import { quizRouter } from './modules/quiz/router.js';
import { progressRouter } from './modules/progress/router.js';
import { aiRouter } from './modules/ai/router.js';
import { storageRouter } from './modules/storage/router.js';
import { streamRouter } from './modules/stream/router.js';
import { securityRouter } from './modules/security/router.js';
import { analyticsRouter } from './modules/analytics/router.js';

// extra: điểm chèn route trước error handler (dùng cho test)
export function createApp(extra?: (app: express.Express) => void) {
  const app = express();
  // Sau reverse proxy (nginx/caddy) đặt TRUST_PROXY=1 để req.ip là IP thật của client
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 0));
  // CSP tắt vì SPA + video cùng origin đã đủ chặt; các header còn lại của helmet giữ nguyên
  app.use(helmet({ contentSecurityPolicy: false }));
  // CORS: web do server phục vụ nên cùng origin (không cần CORS). Chỉ mở khi:
  //  - dev (Vite :5173 gọi API :4000), hoặc
  //  - production có khai báo CORS_ORIGINS (client ngoài, vd bản web tách domain).
  if (!config.isProd) app.use(cors());
  else if (config.corsOrigins.length) app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '1mb' }));
  app.use(metricsMiddleware);

  // Chống dò mật khẩu: giới hạn theo (IP + email) để cả lớp chung NAT trường học
  // không chặn nhầm nhau; kèm trần rộng theo IP chống rải email hàng loạt.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    // ipKeyGenerator gom IPv6 theo /56 — một người không thể đổi địa chỉ trong subnet để lách
    keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}|${req.body?.email ?? ''}`,
    message: { error: 'Sai quá nhiều lần. Thử lại sau 15 phút.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  const ipLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    message: { error: 'Quá nhiều yêu cầu đăng nhập từ mạng này. Thử lại sau.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/login', ipLimiter, loginLimiter);

  app.get('/metrics', metricsHandler); // Prometheus scrape (bảo vệ bằng METRICS_TOKEN nếu đặt)

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/courses', coursesRouter);
  app.use('/api/quiz', quizRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/storage', storageRouter);
  app.use('/api/stream', streamRouter);
  app.use('/api/security', securityRouter);
  app.use('/api/analytics', analyticsRouter);

  app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'Toán Anh Thành LMS' }));

  // Phục vụ web build (SPA) cùng origin — desktop/browser chỉ cần 1 địa chỉ server
  const webDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');
  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(webDist, 'index.html'));
    });
  }

  extra?.(app);

  // Error handler cuối chuỗi — không lộ stack ra client
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Lỗi máy chủ' });
  });

  return app;
}
