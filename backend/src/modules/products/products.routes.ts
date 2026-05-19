import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permission } from '../../types/roles';
import * as ctrl from './products.controller';
import multer from 'multer';

const router = Router();
const canRead = [authenticate, requirePermission(Permission.INVENTORY_READ)];
const canManage = [authenticate, requirePermission(Permission.PRODUCT_MANAGE)];
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', ...canRead, ctrl.listProducts);
router.get('/units', ...canRead, ctrl.listUnits);
router.post('/units', ...canManage, ctrl.createUnit);
router.put('/units/:id', ...canManage, ctrl.updateUnit);
router.delete('/units/:id', ...canManage, ctrl.deleteUnit);
router.get('/categories', ...canRead, ctrl.listCategories);
router.post('/categories', ...canManage, ctrl.createCategory);
router.put('/categories/:id', ...canManage, ctrl.updateCategory);
router.delete('/categories/:id', ...canManage, ctrl.deleteCategory);
router.get('/template', ...canManage, ctrl.downloadImportTemplate);
router.post('/import', ...canManage, upload.single('file'), ctrl.importProducts);
router.get('/:id', ...canRead, ctrl.getProduct);
router.post('/', ...canManage, ctrl.createProduct);
router.put('/:id', ...canManage, ctrl.updateProduct);
router.delete('/:id', ...canManage, ctrl.deleteProduct);

export default router;
