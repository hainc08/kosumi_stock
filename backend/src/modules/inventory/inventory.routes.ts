import { Request, Response, Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permission } from '../../types/roles';
import * as svc from './inventory.service';
import { success, error } from '../../utils/response';

const router = Router();
const guard = [authenticate, requirePermission(Permission.INVENTORY_READ)];

const handle = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response) => {
  try {
    await fn(req, res);
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
};

router.get(
  '/',
  ...guard,
  handle(async (req, res) => {
    const { year, month, category, search } = req.query as any;
    const parsedYear = year ? Number(year) : undefined;
    const parsedMonth = month ? Number(month) : undefined;
    const data = await svc.getCurrentInventory({ year: parsedYear, month: parsedMonth, category, search });
    return success(res, data);
  }),
);

router.get(
  '/summary',
  ...guard,
  handle(async (_req, res) => {
    return success(res, await svc.getInventorySummary());
  }),
);

router.get(
  '/low-stock',
  ...guard,
  handle(async (_req, res) => {
    return success(res, await svc.getLowStockAlerts());
  }),
);

export default router;
