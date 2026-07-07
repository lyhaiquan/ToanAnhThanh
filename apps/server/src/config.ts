import path from 'node:path';

const DEV_SECRET = 'dev-secret-change-in-production';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  isProd: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET ?? DEV_SECRET,
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
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

/**
 * Chặn khởi động production với cấu hình bảo mật yếu. Gọi ở bootstrap (index.ts),
 * KHÔNG gọi trong createApp để test/dev vẫn chạy với secret mặc định.
 * Thà server không lên còn hơn lên với secret ai cũng đoán được.
 */
export function assertProductionSecurity(): void {
  if (!config.isProd) return;
  const problems: string[] = [];
  if (config.jwtSecret === DEV_SECRET) problems.push('JWT_SECRET đang dùng giá trị mặc định — BẮT BUỘC đổi.');
  if (config.jwtSecret.length < 32) problems.push('JWT_SECRET phải dài ≥ 32 ký tự ngẫu nhiên.');
  if (!process.env.METRICS_TOKEN) problems.push('METRICS_TOKEN chưa đặt — endpoint /metrics sẽ bị lộ.');
  if (config.corsOrigins.length === 0) {
    console.warn('⚠ CORS_ORIGINS trống — API chỉ nhận request cùng origin (web do server phục vụ vẫn chạy tốt).');
  }
  if (problems.length) {
    console.error('✗ Cấu hình bảo mật không đạt, server dừng:\n  - ' + problems.join('\n  - '));
    console.error('  Sinh secret mạnh: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    process.exit(1);
  }
}
