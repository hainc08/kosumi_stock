// src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { LoginDto } from './auth.schema';

export async function login(dto: LoginDto) {
  const user = await prisma.user.findUnique({ where: { username: dto.username } });
  if (!user || !user.isActive) {
    throw { code: 'INVALID_CREDENTIALS', message: 'Tên đăng nhập hoặc mật khẩu không đúng', status: 401 };
  }

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) {
    throw { code: 'INVALID_CREDENTIALS', message: 'Tên đăng nhập hoặc mật khẩu không đúng', status: 401 };
  }

  const payload = { sub: user.id, username: user.username, role: user.role, fullName: user.fullName };

  const accessToken  = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_TTL as any });
  const refreshToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_TTL as any });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
  };
}

export async function refreshTokens(token: string) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new Error();

    const newPayload = { sub: user.id, username: user.username, role: user.role, fullName: user.fullName };
    const accessToken  = jwt.sign(newPayload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_TTL as any });
    const refreshToken = jwt.sign(newPayload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_TTL as any });

    return { accessToken, refreshToken };
  } catch {
    throw { code: 'INVALID_TOKEN', message: 'Refresh token không hợp lệ hoặc đã hết hạn', status: 401 };
  }
}
