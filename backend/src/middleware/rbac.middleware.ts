// src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { Permission, hasPermission } from '../types/roles';
import { error } from '../utils/response';

/**
 * Middleware kiểm tra quyền.
 * Luôn dùng sau authenticate().
 *
 * @example
 * router.post('/', authenticate, requirePermission(Permission.RECEIPT_CREATE), controller)
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return error(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
    }

    const allowed = permissions.every((p) => hasPermission(req.user!.role, p));
    if (!allowed) {
      return error(res, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này', 403);
    }

    next();
  };
}
