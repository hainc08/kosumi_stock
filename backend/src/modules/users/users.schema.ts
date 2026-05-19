// src/modules/users/users.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username ít nhất 3 ký tự').max(50),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Password ít nhất 8 ký tự'),
  fullName: z.string().min(1, 'Họ tên là bắt buộc'),
  role: z.enum(['ADMIN', 'WAREHOUSE_MANAGER', 'ACCOUNTANT', 'WAREHOUSE_STAFF', 'VIEWER']),
});

export const updateUserSchema = z.object({
  email: z.string().email('Email không hợp lệ').optional(),
  fullName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'WAREHOUSE_MANAGER', 'ACCOUNTANT', 'WAREHOUSE_STAFF', 'VIEWER']),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password ít nhất 8 ký tự'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
