// src/modules/users/users.service.ts
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { CreateUserDto, UpdateUserDto, UpdateUserRoleDto, ResetPasswordDto } from './users.schema';
import { writeAuditLog } from '../../middleware/audit.middleware';

export async function createUser(dto: CreateUserDto, userId: string) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: dto.username }, { email: dto.email }] },
  });
  if (existing) {
    throw { code: 'DUPLICATE_USER', message: 'Username hoặc email đã tồn tại', status: 409 };
  }

  const passwordHash = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { ...dto, passwordHash },
    select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
  });

  await writeAuditLog({
    userId,
    action: 'CREATE_USER',
    entityType: 'User',
    entityId: user.id,
    newData: user,
  });

  return user;
}

export async function updateUser(id: string, dto: UpdateUserDto, userId: string) {
  const old = await prisma.user.findUnique({ where: { id } });
  if (!old) {
    throw { code: 'NOT_FOUND', message: 'Người dùng không tồn tại', status: 404 };
  }

  const user = await prisma.user.update({
    where: { id },
    data: dto,
    select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true },
  });

  await writeAuditLog({
    userId,
    action: 'UPDATE_USER',
    entityType: 'User',
    entityId: id,
    oldData: old,
    newData: dto,
  });

  return user;
}

export async function updateUserRole(id: string, dto: UpdateUserRoleDto, userId: string) {
  const old = await prisma.user.findUnique({ where: { id } });
  if (!old) {
    throw { code: 'NOT_FOUND', message: 'Người dùng không tồn tại', status: 404 };
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: dto.role },
    select: { id: true, username: true, email: true, fullName: true, role: true },
  });

  await writeAuditLog({
    userId,
    action: 'UPDATE_USER',
    entityType: 'User',
    entityId: id,
    oldData: { role: old.role },
    newData: { role: user.role },
  });

  return user;
}

export async function resetPassword(id: string, dto: ResetPasswordDto, userId: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw { code: 'NOT_FOUND', message: 'Người dùng không tồn tại', status: 404 };
  }

  const passwordHash = await bcrypt.hash(dto.newPassword, env.BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  await writeAuditLog({
    userId,
    action: 'UPDATE_USER',
    entityType: 'User',
    entityId: id,
    newData: { action: 'password_reset' },
  });
}

export async function deactivateUser(id: string, userId: string) {
  const old = await prisma.user.findUnique({ where: { id } });
  if (!old) {
    throw { code: 'NOT_FOUND', message: 'Người dùng không tồn tại', status: 404 };
  }

  await prisma.user.update({ where: { id }, data: { isActive: false } });

  await writeAuditLog({
    userId,
    action: 'DELETE_USER',
    entityType: 'User',
    entityId: id,
    oldData: { isActive: old.isActive },
    newData: { isActive: false },
  });
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });
  if (!user) {
    throw { code: 'NOT_FOUND', message: 'Người dùng không tồn tại', status: 404 };
  }
  return user;
}

export async function listUsers(page: number, limit: number, skip: number, role?: string, search?: string) {
  const where: any = {
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total };
}
