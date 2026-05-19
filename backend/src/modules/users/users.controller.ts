// src/modules/users/users.controller.ts
import { Request, Response } from 'express';
import { createUserSchema, updateUserSchema, updateUserRoleSchema, resetPasswordSchema } from './users.schema';
import * as userService from './users.service';
import { success, error, parsePagination, paginate } from '../../utils/response';

export async function listUsers(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query as any);
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;

    const { data, total } = await userService.listUsers(page, limit, skip, role, search);
    return success(res, data, 'OK', 200, paginate(page, limit, total));
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const dto = createUserSchema.parse(req.body);
    const user = await userService.createUser(dto, req.user?.id!);
    return success(res, user, 'Tạo người dùng thành công', 201);
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const user = await userService.getUser(String(req.params.id));
    return success(res, user, 'OK');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const dto = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(String(req.params.id), dto, req.user?.id!);
    return success(res, user, 'Cập nhật người dùng thành công');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const dto = updateUserRoleSchema.parse(req.body);
    const user = await userService.updateUserRole(String(req.params.id), dto, req.user?.id!);
    return success(res, user, 'Đổi vai trò thành công');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const dto = resetPasswordSchema.parse(req.body);
    await userService.resetPassword(String(req.params.id), dto, req.user?.id!);
    return success(res, null, 'Đặt lại mật khẩu thành công');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function deactivateUser(req: Request, res: Response) {
  try {
    await userService.deactivateUser(String(req.params.id), req.user?.id!);
    return success(res, null, 'Đã vô hiệu hóa tài khoản');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

