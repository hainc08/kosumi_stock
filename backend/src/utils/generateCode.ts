// src/utils/generateCode.ts
// Sinh mã phiếu tự động: PN-2026-001, PX-2026-025

import { prisma } from '../config/database';

export async function generateReceiptNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.receipt.count({
    where: { receiptNo: { startsWith: `PN-${year}-` } },
  });
  return `PN-${year}-${String(count + 1).padStart(3, '0')}`;
}

export async function generateIssueNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.issue.count({
    where: { issueNo: { startsWith: `PX-${year}-` } },
  });
  return `PX-${year}-${String(count + 1).padStart(3, '0')}`;
}

export async function generateRequestNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.issueRequest.count({
    where: { requestNo: { startsWith: `XK-${year}-` } },
  });
  return `XK-${year}-${String(count + 1).padStart(3, '0')}`;
}
