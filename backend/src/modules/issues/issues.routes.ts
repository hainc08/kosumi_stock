// src/modules/issues/issues.routes.ts
import { Router } from 'express';
import * as ctrl from './issues.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permission } from '../../types/roles';

const router = Router();
const auth    = authenticate;
const canRead    = requirePermission(Permission.INVENTORY_READ);
const canCreate  = requirePermission(Permission.ISSUE_CREATE);
const canApprove = requirePermission(Permission.ISSUE_APPROVE);
const canConfirm = requirePermission(Permission.ISSUE_CONFIRM);

router.get ('/',                auth, canRead,    ctrl.list);
router.get ('/:id',             auth, canRead,    ctrl.getOne);
router.post('/',                auth, canCreate,  ctrl.create);
router.post('/:id/submit',      auth, canCreate,  ctrl.submit);
router.post('/:id/approve',     auth, canApprove, ctrl.approve);
router.post('/:id/confirm',     auth, canConfirm, ctrl.confirm);
router.post('/:id/reject',      auth, canApprove, ctrl.reject);

export default router;
