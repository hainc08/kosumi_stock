// src/modules/reports/reports.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permission } from '../../types/roles';
import { prisma } from '../../config/database';
import { success } from '../../utils/response';
import ExcelJS from 'exceljs';

const router = Router();
const canRead   = [authenticate, requirePermission(Permission.INVENTORY_READ)];
const canExport = [authenticate, requirePermission(Permission.REPORT_EXPORT)];

// Báo cáo tổng hợp tồn kho theo kỳ
router.get('/inventory-summary', ...canRead, async (req, res) => {
  const year  = parseInt(String(req.query.year  ?? new Date().getFullYear()));
  const month = parseInt(String(req.query.month ?? new Date().getMonth() + 1));

  const period = await prisma.inventoryPeriod.findUnique({
    where: { year_month: { year, month } },
  });
  if (!period) return success(res, []);

  // Tổng hợp: đầu kỳ + nhập + xuất + cuối kỳ
  const balances = await prisma.inventoryBalance.findMany({
    where: { periodId: period.id, product: { isActive: true } },
    include: { product: true },
    orderBy: { product: { code: 'asc' } },
  });

  const receiptAgg = await prisma.receiptItem.groupBy({
    by: ['productId'],
    where: {
      receipt: { periodId: period.id, status: 'APPROVED' },
    },
    _sum: { quantity: true },
  });

  const issueAgg = await prisma.issueItem.groupBy({
    by: ['productId'],
    where: {
      issue: { periodId: period.id, status: 'CONFIRMED' },
    },
    _sum: { actualQty: true },
  });

  const rMap = Object.fromEntries(receiptAgg.map((r) => [r.productId, Number(r._sum.quantity ?? 0)]));
  const iMap = Object.fromEntries(issueAgg.map((i)   => [i.productId, Number(i._sum.actualQty ?? 0)]));

  const rows = balances.map((b) => ({
    code:         b.product.code,
    name:         b.product.name,
    unit:         b.product.unit,
    openingQty:   Number(b.openingQty),
    receiptQty:   rMap[b.productId] ?? 0,
    issueQty:     iMap[b.productId] ?? 0,
    closingQty:   Number(b.closingQty),
  }));

  return success(res, { period, rows });
});

// Xuất Excel
router.get('/export/excel', ...canExport, async (req, res) => {
  const year  = parseInt(String(req.query.year  ?? new Date().getFullYear()));
  const month = parseInt(String(req.query.month ?? new Date().getMonth() + 1));

  const period = await prisma.inventoryPeriod.findUnique({
    where: { year_month: { year, month } },
  });

  const balances = period ? await prisma.inventoryBalance.findMany({
    where: { periodId: period.id, product: { isActive: true } },
    include: { product: true },
    orderBy: { product: { code: 'asc' } },
  }) : [];

  const wb   = new ExcelJS.Workbook();
  const ws   = wb.addWorksheet(`Tồn Kho T${month}/${year}`);

  ws.columns = [
    { header: 'STT',      width: 6  },
    { header: 'Mã hàng',  width: 10 },
    { header: 'Tên hàng', width: 35 },
    { header: 'ĐVT',      width: 8  },
    { header: 'Đầu kỳ',   width: 10 },
    { header: 'Nhập kỳ',  width: 10 },
    { header: 'Xuất kỳ',  width: 10 },
    { header: 'Cuối kỳ',  width: 10 },
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C2333' } };
  ws.getRow(1).font = { bold: true, color: { argb: 'FFE6EDF3' } };

  balances.forEach((b, i) => {
    ws.addRow([
      i + 1,
      b.product.code,
      b.product.name,
      b.product.unit,
      Number(b.openingQty),
      0, // receipt qty - có thể enhance
      0, // issue qty   - có thể enhance
      Number(b.closingQty),
    ]);
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=TonKho_T${month}_${year}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
});

export default router;
