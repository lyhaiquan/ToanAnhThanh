import type { ReadStream } from 'node:fs';

export interface VideoStream {
  stream: NodeJS.ReadableStream;
  size: number;
  contentType: string;
}

export interface StorageProvider {
  /** Lưu file video, trả về videoRef để ghi vào Lesson. */
  save(file: Buffer, filename: string): Promise<string>;
  /** Mở stream đọc video theo videoRef, hỗ trợ HTTP Range. */
  createReadStream(videoRef: string, range?: { start: number; end: number }): VideoStream;
  /** Kích thước file (bytes) để trả header Range. */
  getSize(videoRef: string): number;
}
