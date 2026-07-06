import crypto from 'node:crypto';
import { config } from '../../config.js';

// Token stream ngắn hạn: HMAC-SHA256 trên payload base64url, hết hạn 60s.
// Không dùng JWT để token gọn, gắn được vào query string của <video src>.

export function signStreamToken(userId: string, lessonId: string, ttlSec = config.streamTokenTtlSec): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = Buffer.from(JSON.stringify({ u: userId, l: lessonId, e: exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', config.jwtSecret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyStreamToken(token: string): { userId: string; lessonId: string } | null {
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', config.jwtSecret).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.e !== 'number' || data.e < Math.floor(Date.now() / 1000)) return null;
    return { userId: data.u, lessonId: data.l };
  } catch {
    return null;
  }
}
