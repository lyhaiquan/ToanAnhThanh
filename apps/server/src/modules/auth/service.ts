import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db.js';
import { config } from '../../config.js';
import type { AuthUser } from '../../middleware/auth.js';
import { loginFailures } from '../../metrics.js';

export function signAccessToken(user: AuthUser): string {
  return jwt.sign({ ...user, type: 'access' }, config.jwtSecret, { expiresIn: config.jwtAccessTtl });
}

export function signRefreshToken(user: AuthUser): string {
  return jwt.sign({ ...user, type: 'refresh' }, config.jwtSecret, { expiresIn: config.jwtRefreshTtl });
}

export async function login(email: string, password: string, deviceId?: string, deviceLabel?: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    loginFailures.inc({ reason: 'bad_credentials' });
    return { error: 'Email hoặc mật khẩu không đúng' as const };
  }
  if (user.status === 'BANNED') {
    loginFailures.inc({ reason: 'banned' });
    return { error: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.' as const };
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    loginFailures.inc({ reason: 'bad_credentials' });
    return { error: 'Email hoặc mật khẩu không đúng' as const };
  }

  // Ràng buộc 1 thiết bị/học sinh (admin không bị giới hạn — dạy nhiều máy).
  if (user.role === 'STUDENT') {
    if (!deviceId) return { error: 'Không xác định được thiết bị. Vui lòng dùng trình duyệt cho phép lưu dữ liệu.' as const };
    if (!user.boundDeviceId) {
      // Lần đầu: khóa tài khoản vào thiết bị này
      await prisma.user.update({
        where: { id: user.id },
        data: { boundDeviceId: deviceId, boundDeviceLabel: deviceLabel ?? '', boundDeviceAt: new Date() },
      });
    } else if (user.boundDeviceId !== deviceId) {
      await prisma.securityEvent.create({
        data: { userId: user.id, type: 'SUSPICIOUS_KEY', detail: `Đăng nhập từ thiết bị lạ (khóa ở máy khác): ${deviceLabel ?? ''}` },
      });
      loginFailures.inc({ reason: 'device_mismatch' });
      return { error: 'DEVICE_LOCKED' as const };
    }
  }

  const authUser: AuthUser = { id: user.id, email: user.email, role: user.role as AuthUser['role'] };
  await prisma.activityLog.create({ data: { userId: user.id, type: 'LOGIN' } });
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken: signAccessToken(authUser),
    refreshToken: signRefreshToken(authUser),
  };
}

export async function refresh(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, config.jwtSecret) as AuthUser & { type: string };
    if (payload.type !== 'refresh') return null;
    // Re-check user still active
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.status === 'BANNED') return null;
    const authUser: AuthUser = { id: user.id, email: user.email, role: user.role as AuthUser['role'] };
    return { accessToken: signAccessToken(authUser), refreshToken: signRefreshToken(authUser) };
  } catch {
    return null;
  }
}
