import { describe, it, expect } from 'vitest';
import { signStreamToken, verifyStreamToken } from '../src/modules/stream/token.js';

describe('stream token', () => {
  it('ký và xác thực token hợp lệ', () => {
    const token = signStreamToken('user1', 'lesson1');
    const payload = verifyStreamToken(token);
    expect(payload).toEqual({ userId: 'user1', lessonId: 'lesson1' });
  });

  it('từ chối token hết hạn', () => {
    const token = signStreamToken('user1', 'lesson1', -10);
    expect(verifyStreamToken(token)).toBeNull();
  });

  it('từ chối token bị sửa payload', () => {
    const token = signStreamToken('user1', 'lesson1');
    const [payload, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ u: 'hacker', l: 'lesson1', e: 9999999999 })).toString('base64url');
    expect(verifyStreamToken(`${forged}.${sig}`)).toBeNull();
    expect(verifyStreamToken(`${payload}.xxxx`)).toBeNull();
  });

  it('từ chối chuỗi rác', () => {
    expect(verifyStreamToken('not-a-token')).toBeNull();
    expect(verifyStreamToken('')).toBeNull();
  });
});
