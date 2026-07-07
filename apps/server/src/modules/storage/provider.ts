import type { ReadStream } from 'node:fs';

export interface VideoStream {
  stream: NodeJS.ReadableStream;
  size: number;
  contentType: string;
}

export interface StorageProvider {
  /**
   * Nhận file đã được ghi tạm ra đĩa (tránh nạp cả GB vào RAM), đưa về nơi lưu
   * cuối, trả videoRef để ghi vào Lesson. Provider chịu trách nhiệm dọn file tạm.
   */
  save(tempPath: string, originalName: string): Promise<string>;
  /** Mở stream đọc video theo videoRef, hỗ trợ HTTP Range. */
  createReadStream(videoRef: string, range?: { start: number; end: number }): VideoStream;
  /** Kích thước file (bytes) để trả header Range. */
  getSize(videoRef: string): number;
}
