import express from 'express';
import 'express-async-errors'; // vá Express 4: lỗi trong async handler đi vào error middleware thay vì giết process
import cors from 'cors';
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
  app.use(cors());
  app.use(express.json());

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
