// src/modules/issues/issues.controller.ts
import { Request, Response } from 'express';
import * as svc from './issues.service';
import { createIssueSchema, confirmIssueSchema } from './issues.schema';
import { success, error, paginate } from '../../utils/response';

const handle = (fn: (req: Request, res: Response) => Promise<any>) =>
  async (req: Request, res: Response) => {
    try { await fn(req, res); }
    catch (err: any) {
      if (err.code) return error(res, err.code, err.message, err.status ?? 400);
      throw err;
    }
  };

export const list    = handle(async (req, res) => {
  const result = await svc.listIssues(req.query as any);
  return success(res, result.data, 'OK', 200, paginate(result.page, result.limit, result.total));
});
export const getOne  = handle(async (req, res) => success(res, await svc.getIssue(String(req.params.id))));
export const create  = handle(async (req, res) => {
  const dto = createIssueSchema.parse(req.body);
  return success(res, await svc.createIssue(dto, req.user!.id), 'Tạo phiếu xuất thành công', 201);
});
export const submit  = handle(async (req, res) => success(res, await svc.submitIssue(String(req.params.id), req.user!.id), 'Gửi phiếu xuất thành công'));
export const approve = handle(async (req, res) => success(res, await svc.approveIssue(String(req.params.id), req.user!.id), 'Duyệt phiếu xuất thành công'));
export const confirm = handle(async (req, res) => {
  const dto = confirmIssueSchema.parse(req.body);
  return success(res, await svc.confirmIssue(String(req.params.id), dto, req.user!.id), 'Xác nhận xuất kho thành công');
});
export const reject  = handle(async (req, res) => success(res, await svc.rejectIssue(String(req.params.id), req.user!.id), 'Từ chối phiếu xuất'));

