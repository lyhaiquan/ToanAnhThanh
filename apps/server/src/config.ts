import path from 'node:path';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  jwtAccessTtl: '15m',
  jwtRefreshTtl: '7d',
  streamTokenTtlSec: 60,
  aiProvider: process.env.AI_PROVIDER ?? 'mock', // mock | opennotebook
  storageProvider: process.env.STORAGE_PROVIDER ?? 'local', // local | gdrive
  openNotebookUrl: process.env.ON_API_URL ?? '',
  openNotebookPassword: process.env.ON_API_PASSWORD ?? '',
  mediaDir: process.env.MEDIA_DIR ?? path.join(import.meta.dirname, '..', 'media'),
  uploadDir: process.env.UPLOAD_DIR ?? path.join(import.meta.dirname, '..', 'uploads'),
  defaultPassScore: Number(process.env.PASS_SCORE ?? 70),
};
