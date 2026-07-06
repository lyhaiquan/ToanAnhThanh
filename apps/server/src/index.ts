import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();
app.listen(config.port, () => {
  console.log(`✦ Toán Anh Thành LMS server: http://localhost:${config.port}`);
  console.log(`  AI provider: ${config.aiProvider} | Storage: ${config.storageProvider}`);
});
