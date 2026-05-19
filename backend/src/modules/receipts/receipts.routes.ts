// src/modules/receipts/receipts.routes.ts
import { Router } from 'express';
import * as ctrl from './receipts.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permission } from '../../types/roles';

const router = Router();
const auth = authenticate;
const canCreate  = requirePermission(Permission.RECEIPT_CREATE);
const canApprove = requirePermission(Permission.RECEIPT_APPROVE);
const canRead    = requirePermission(Permission.INVENTORY_READ);

router.get   ('/',              auth, canRead,    ctrl.list);
router.get   ('/:id',           auth, canRead,    ctrl.getOne);
router.post  ('/',              auth, canCreate,  ctrl.create);
router.put   ('/:id',           auth, canCreate,  ctrl.update);
router.post  ('/:id/submit',    auth, canCreate,  ctrl.submit);
router.post  ('/:id/approve',   auth, canApprove, ctrl.approve);
router.post  ('/:id/reject',    auth, canApprove, ctrl.reject);
router.delete('/:id',           auth, canCreate,  ctrl.remove);

export default router;
