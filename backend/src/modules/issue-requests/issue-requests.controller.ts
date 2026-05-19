import { Request, Response } from 'express';
import { success, error, paginate } from '../../utils/response';
import * as svc from './issue-requests.service';
import { createIssueRequestSchema, rejectRequestSchema } from './issue-requests.schema';

const handle = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (err: any) {
      if (err.code) return error(res, err.code, err.message, err.status ?? 400);
      throw err;
    }
  };

export const list = handle(async (req, res) => {
  const result = await svc.listIssueRequests(req.query as any, req.user!.role as any, req.user!.id);
  return success(res, result.data, 'OK', 200, paginate(result.page, result.limit, result.total));
});

export const getOne = handle(async (req, res) => {
  const data = await svc.getIssueRequest(String(req.params.id), req.user!.role as any, req.user!.id);
  return success(res, data, 'OK');
});

export const create = handle(async (req, res) => {
  const dto = createIssueRequestSchema.parse(req.body);
  const data = await svc.createIssueRequest(dto, req.user!.id);
  return success(res, data, 'Da gui yeu cau xuat kho', 201);
});

export const approve = handle(async (req, res) => {
  const issue = await svc.approveIssueRequest(String(req.params.id), req.user!.id);
  return success(res, { issue }, 'Da duyet yeu cau');
});

export const reject = handle(async (req, res) => {
  const dto = rejectRequestSchema.parse(req.body);
  await svc.rejectIssueRequest(String(req.params.id), req.user!.id, dto.rejectReason);
  return success(res, null, 'Da tu choi yeu cau');
});
