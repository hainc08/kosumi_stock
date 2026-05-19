// src/middleware/audit.middleware.ts
// Ghi audit log sau mỗi mutation thành công

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

type AuditAction =
  | 'CREATE_RECEIPT' | 'UPDATE_RECEIPT' | 'SUBMIT_RECEIPT' | 'APPROVE_RECEIPT' | 'REJECT_RECEIPT'
  | 'CREATE_ISSUE'   | 'UPDATE_ISSUE'   | 'SUBMIT_ISSUE'   | 'APPROVE_ISSUE'   | 'REJECT_ISSUE' | 'CONFIRM_ISSUE'
  | 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT'
  | 'CREATE_USER'    | 'UPDATE_USER'    | 'DELETE_USER';

/**
 * Ghi audit log. Dùng sau action thực sự xảy ra, không phải middleware chain.
 */
export async function writeAuditLog(params: {
  userId?: string;
  action: AuditAction | string;
  entityType?: string;
  entityId?: string;
  oldData?: object;
  newData?: object;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch (e) {
    console.error('[AuditLog] Failed to write:', e);
  }
}
