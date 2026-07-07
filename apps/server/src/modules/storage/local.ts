import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '../../config.js';
import type { StorageProvider, VideoStream } from './provider.js';

// Video demo nằm trong media/, video admin upload nằm trong uploads/.
// videoRef là tên file; tra cứu lần lượt uploads/ rồi media/.

export class LocalStorageProvider implements StorageProvider {
  private resolve(videoRef: string): string {
    const safe = path.basename(videoRef); // chống path traversal
    for (const dir of [config.uploadDir, config.mediaDir]) {
      const p = path.join(dir, safe);
      if (fs.existsSync(p)) return p;
    }
    throw Object.assign(new Error(`Không tìm thấy video: ${safe}`), { code: 'VIDEO_NOT_FOUND' });
  }

  async save(tempPath: string, originalName: string): Promise<string> {
    fs.mkdirSync(config.uploadDir, { recursive: true });
    const ext = path.extname(originalName) || '.mp4';
    const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    // rename trong cùng ổ đĩa là thao tác nguyên tử, không copy dữ liệu
    fs.renameSync(tempPath, path.join(config.uploadDir, name));
    return name;
  }

  getSize(videoRef: string): number {
    return fs.statSync(this.resolve(videoRef)).size;
  }

  createReadStream(videoRef: string, range?: { start: number; end: number }): VideoStream {
    const filePath = this.resolve(videoRef);
    const size = fs.statSync(filePath).size;
    const stream = range ? fs.createReadStream(filePath, range) : fs.createReadStream(filePath);
    return { stream, size, contentType: 'video/mp4' };
  }
}
