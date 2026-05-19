// src/modules/receipts/receipts.controller.ts
import { Request, Response } from 'express';
import * as svc from './receipts.service';
import { createReceiptSchema, updateReceiptSchema } from './receipts.schema';
import { success, error, paginate } from '../../utils/response';

const handle = (fn: (req: Request, res: Response) => Promise<any>) =>
  async (req: Request, res: Response) => {
    try { await fn(req, res); }
    catch (err: any) {
      if (err.code) return error(res, err.code, err.message, err.status ?? 400);
      throw err;
    }
  };

export const list = handle(async (req, res) => {
  const result = await svc.listReceipts(req.query as any);
  return success(res, result.data, 'OK', 200, paginate(result.page, result.limit, result.total));
});

export const getOne = handle(async (req, res) => {
  const data = await svc.getReceipt(String(req.params.id));
  return success(res, data);
});

export const create = handle(async (req, res) => {
  const dto = createReceiptSchema.parse(req.body);
  const data = await svc.createReceipt(dto, req.user!.id);
  return success(res, data, 'Tạo phiếu nhập thành công', 201);
});

export const update = handle(async (req, res) => {
  const dto = updateReceiptSchema.parse(req.body);
  const data = await svc.updateReceipt(String(req.params.id), dto, req.user!.id);
  return success(res, data, 'Cập nhật phiếu nhập thành công');
});

export const submit = handle(async (req, res) => {
  const data = await svc.submitReceipt(String(req.params.id), req.user!.id);
  return success(res, data, 'Gửi phiếu nhập thành công');
});

export const approve = handle(async (req, res) => {
  const data = await svc.approveReceipt(String(req.params.id), req.user!.id);
  return success(res, data, 'Duyệt phiếu nhập thành công');
});

export const reject = handle(async (req, res) => {
  const data = await svc.rejectReceipt(String(req.params.id), req.user!.id);
  return success(res, data, 'Từ chối phiếu nhập');
});

export const remove = handle(async (req, res) => {
  await svc.deleteReceipt(String(req.params.id), req.user!.id);
  return success(res, null, 'Đã xóa phiếu nhập');
});

