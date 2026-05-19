// src/utils/response.ts
import { Response } from 'express';
import { PaginationMeta } from '../types/api';

export function success<T>(
  res: Response,
  data: T,
  message = 'OK',
  statusCode = 200,
  meta?: PaginationMeta,
) {
  return res.status(statusCode).json({ success: true, data, message, ...(meta ? { meta } : {}) });
}

export function error(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
) {
  return res.status(statusCode).json({ success: false, error: { code, message }, data: null });
}

export function paginate(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

// Parse pagination query params with defaults
export function parsePagination(query: Record<string, unknown>) {
  const page  = Math.max(1, parseInt(String(query.page  ?? '1'),  10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10)));
  return { page, limit, skip: (page - 1) * limit };
}
