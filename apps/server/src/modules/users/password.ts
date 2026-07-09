import { z } from 'zod';
import crypto from 'node:crypto';

// Chính sách mật khẩu dùng chung cho tạo tài khoản / đổi / đặt lại:
// ≥ 8 ký tự, có chữ và số — chặn mật khẩu quá dễ đoán.
export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải ≥ 8 ký tự')
  .regex(/[A-Za-z]/, 'Mật khẩu phải có chữ cái')
  .regex(/[0-9]/, 'Mật khẩu phải có chữ số');

// Sinh mật khẩu ngẫu nhiên đạt chính sách, dễ đọc chép tay cho học sinh
// (không dùng ký tự dễ nhầm như 0/O, 1/l).
export function generatePassword(): string {
  const letters = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick = (pool: string, n: number) =>
    Array.from(crypto.randomBytes(n), (b) => pool[b % pool.length]).join('');
  return pick(letters, 1).toUpperCase() + pick(letters, 4) + pick(digits, 4);
}
