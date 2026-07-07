import { prisma } from '../../db.js';

// Đệm activity log trong RAM rồi ghi theo batch — 100 học sinh cùng play/pause
// chỉ còn vài lệnh INSERT mỗi chu kỳ thay vì bão ghi từng dòng.
type Entry = { userId: string; type: string; metadata: string };

const buffer: Entry[] = [];
const FLUSH_INTERVAL_MS = 2000;
const FLUSH_THRESHOLD = 500; // đầy sớm thì ghi sớm

let flushing: Promise<void> | null = null;

export function logActivity(entry: Entry) {
  buffer.push(entry);
  if (buffer.length >= FLUSH_THRESHOLD) void flushActivityBuffer();
}

export async function flushActivityBuffer(): Promise<void> {
  if (flushing) return flushing; // không flush chồng nhau
  if (buffer.length === 0) return;
  const batch = buffer.splice(0);
  flushing = prisma.activityLog
    .createMany({ data: batch })
    .then(() => undefined)
    .catch((err: unknown) => {
      // Log giám sát không được phép làm chết server; mất 1 batch chấp nhận được
      console.error(`Ghi ${batch.length} activity log thất bại:`, err);
    })
    .finally(() => {
      flushing = null;
    });
  return flushing;
}

// Chu kỳ nền — unref để không giữ process sống (test/CLI thoát bình thường)
setInterval(() => void flushActivityBuffer(), FLUSH_INTERVAL_MS).unref();
