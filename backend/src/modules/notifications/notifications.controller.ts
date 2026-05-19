import { Request, Response } from 'express';
import { success, error } from '../../utils/response';
import * as svc from './notifications.service';

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
  const data = await svc.getMyNotifications(req.user!.id);
  return success(res, data, 'OK');
});

export const unreadCount = handle(async (req, res) => {
  const count = await svc.getUnreadCount(req.user!.id);
  return success(res, { count }, 'OK');
});

export const readOne = handle(async (req, res) => {
  const data = await svc.markRead(String(req.params.id), req.user!.id);
  return success(res, data, 'OK');
});

export const readAll = handle(async (req, res) => {
  await svc.markAllRead(req.user!.id);
  return success(res, null, 'OK');
});
