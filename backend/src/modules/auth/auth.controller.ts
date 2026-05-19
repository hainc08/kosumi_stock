// src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { loginSchema } from './auth.schema';
import * as authService from './auth.service';
import { success, error } from '../../utils/response';

export async function loginHandler(req: Request, res: Response) {
  try {
    const dto = loginSchema.parse(req.body);
    const result = await authService.login(dto);
    return success(res, result, 'Đăng nhập thành công');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function refreshHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'MISSING_TOKEN', 'Thiếu refresh token', 400);
    const result = await authService.refreshTokens(refreshToken);
    return success(res, result, 'Token đã được làm mới');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function meHandler(req: Request, res: Response) {
  return success(res, req.user, 'OK');
}
