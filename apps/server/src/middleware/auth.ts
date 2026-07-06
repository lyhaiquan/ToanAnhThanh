import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

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

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as AuthUser & { type: string };
    if (payload.type !== 'access') return res.status(401).json({ error: 'Token không hợp lệ' });
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Token hết hạn hoặc không hợp lệ' });
  }
}

export function requireRole(role: 'ADMIN' | 'STUDENT') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Chưa đăng nhập' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Không có quyền truy cập' });
    next();
  };
}
