import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permission } from '../../types/roles';
import * as ctrl from './notifications.controller';

const router = Router();

router.get('/', authenticate, requirePermission(Permission.NOTIFICATION_READ), ctrl.list);
router.get('/unread-count', authenticate, requirePermission(Permission.NOTIFICATION_READ), ctrl.unreadCount);
router.put('/:id/read', authenticate, requirePermission(Permission.NOTIFICATION_READ), ctrl.readOne);
router.put('/read-all', authenticate, requirePermission(Permission.NOTIFICATION_READ), ctrl.readAll);

export default router;
