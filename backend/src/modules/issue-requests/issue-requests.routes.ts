import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permission } from '../../types/roles';
import * as ctrl from './issue-requests.controller';

const router = Router();

router.get('/', authenticate, requirePermission(Permission.INVENTORY_READ), ctrl.list);
router.get('/:id', authenticate, requirePermission(Permission.INVENTORY_READ), ctrl.getOne);
router.post('/', authenticate, requirePermission(Permission.ISSUE_REQUEST_CREATE), ctrl.create);
router.post('/:id/approve', authenticate, requirePermission(Permission.ISSUE_REQUEST_REVIEW), ctrl.approve);
router.post('/:id/reject', authenticate, requirePermission(Permission.ISSUE_REQUEST_REVIEW), ctrl.reject);

export default router;
