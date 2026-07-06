import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../db.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }
  let payload: AuthUser & { type: string };
  try {
    payload = jwt.verify(header.slice(7), config.jwtSecret) as AuthUser & { type: string };
    if (payload.type !== 'access') return res.status(401).json({ error: 'Token không hợp lệ' });
  } catch {
    return res.status(401).json({ error: 'Token hết hạn hoặc không hợp lệ' });
  }
  req.user = { id: payload.id, email: payload.email, role: payload.role };

  // Học sinh: mọi request phải đến từ đúng thiết bị đã khóa. Cũng chặn ngay nếu bị ban.
  if (payload.role === 'STUDENT') {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { status: true, boundDeviceId: true },
    });
    if (!user || user.status === 'BANNED') {
      return res.status(401).json({ error: 'Tài khoản đã bị khóa', code: 'BANNED' });
    }
    const deviceId = String(req.headers['x-device-id'] ?? '');
    if (user.boundDeviceId && deviceId !== user.boundDeviceId) {
      return res.status(403).json({ error: 'Thiết bị không được phép truy cập', code: 'DEVICE_MISMATCH' });
    }
  }
  next();
}

export function requireRole(role: 'ADMIN' | 'STUDENT') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Chưa đăng nhập' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Không có quyền truy cập' });
    next();
  };
}
