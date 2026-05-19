// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { error } from '../utils/response';

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  fullName: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return error(res, 'UNAUTHORIZED', 'Token không hợp lệ hoặc chưa đăng nhập', 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role as any,
      fullName: payload.fullName,
    };
    next();
  } catch {
    return error(res, 'UNAUTHORIZED', 'Token hết hạn hoặc không hợp lệ', 401);
  }
}
