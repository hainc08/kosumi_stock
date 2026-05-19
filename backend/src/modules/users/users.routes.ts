// src/modules/users/users.routes.ts
// Phase 1.7 — User management (ADMIN only)

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permission } from '../../types/roles';
import * as userController from './users.controller';

const router = Router();
const guard = [authenticate, requirePermission(Permission.USER_MANAGE)];

router.get('/', ...guard, userController.listUsers);
router.post('/', ...guard, userController.createUser);
router.get('/:id', ...guard, userController.getUser);
router.put('/:id', ...guard, userController.updateUser);
router.put('/:id/role', ...guard, userController.updateUserRole);
router.put('/:id/password', ...guard, userController.resetPassword);
router.delete('/:id', ...guard, userController.deactivateUser);

export default router;
