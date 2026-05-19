// src/modules/inventory/inventory.controller.ts
import { Request, Response } from 'express';
import * as inventoryService from './inventory.service';
import { success, error, parsePagination, paginate } from '../../utils/response';

export async function listBalance(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query as any);
    const periodId = req.query.periodId as string | undefined;
    const productCode = req.query.productCode as string | undefined;

    const { data, total } = await inventoryService.listBalance(page, limit, skip, periodId, productCode);
    return success(res, data, 'OK', 200, paginate(page, limit, total));
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function getCurrentBalance(req: Request, res: Response) {
  try {
    const productId = req.params.productId as string;
    const balance = await inventoryService.getCurrentBalance(productId);
    return success(res, balance, 'OK');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function listPeriods(req: Request, res: Response) {
  try {
    const periods = await inventoryService.listPeriods();
    return success(res, periods, 'OK');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function closePeriod(req: Request, res: Response) {
  try {
    const { periodId } = req.body;
    await inventoryService.closePeriod(periodId, req.user?.id!);
    return success(res, null, 'Đóng kỳ thành công');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function rolloverPeriod(req: Request, res: Response) {
  try {
    const { fromYear, fromMonth, toYear, toMonth } = req.body;
    await inventoryService.rolloverPeriod({ fromYear, fromMonth, toYear, toMonth }, req.user?.id!);
    return success(res, null, 'Chuyển kỳ thành công');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}
