import { createApp } from './app.js';
import { config, assertProductionSecurity } from './config.js';

assertProductionSecurity(); // dừng ngay nếu production mà secret yếu/thiếu
import { flushActivityBuffer } from './modules/security/logbuffer.js';
import { prisma } from './db.js';

// Lưới an toàn cuối: một promise lạc trôi không được phép giết cả server
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection (server vẫn chạy):', reason);
});
process.on('uncaughtException', (err) => {
  // Exception đồng bộ không bắt được → trạng thái không tin cậy, log rồi thoát
  console.error('Uncaught exception, thoát:', err);
  process.exit(1);
});

// Tắt êm: ghi nốt activity log đang đệm rồi mới thoát
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    await flushActivityBuffer();
    await prisma.$disconnect();
    process.exit(0);
  });
}

const app = createApp();
app.listen(config.port, () => {
  console.log(`✦ Toán Anh Thành LMS server: http://localhost:${config.port}`);
  console.log(`  AI provider: ${config.aiProvider} | Storage: ${config.storageProvider}`);
});
