// src/modules/reports/reports.controller.ts
import { Request, Response } from 'express';
import { exportInventorySchema, exportReceiptSchema, exportIssueSchema } from './reports.schema';
import * as reportService from './reports.service';
import { success, error } from '../../utils/response';

export async function exportInventory(req: Request, res: Response) {
  try {
    const dto = exportInventorySchema.parse(req.query);
    const report = await reportService.generateInventoryReport(dto);

    if (dto.format === 'xlsx') {
      const buffer = await reportService.convertToExcel(report, 'Tồn kho');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Tonkho_${new Date().getTime()}.xlsx"`);
      return res.send(buffer);
    }

    return success(res, report.data, 'Báo cáo tồn kho');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function exportReceipt(req: Request, res: Response) {
  try {
    const dto = exportReceiptSchema.parse(req.query);
    const report = await reportService.generateReceiptReport(dto);

    if (dto.format === 'xlsx') {
      const buffer = await reportService.convertToExcel(report, 'Phiếu Nhập');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="PhieuNhap_${new Date().getTime()}.xlsx"`);
      return res.send(buffer);
    }

    return success(res, report.data, 'Báo cáo phiếu nhập');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function exportIssue(req: Request, res: Response) {
  try {
    const dto = exportIssueSchema.parse(req.query);
    const report = await reportService.generateIssueReport(dto);

    if (dto.format === 'xlsx') {
      const buffer = await reportService.convertToExcel(report, 'Phiếu Xuất');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="PhieuXuat_${new Date().getTime()}.xlsx"`);
      return res.send(buffer);
    }

    return success(res, report.data, 'Báo cáo phiếu xuất');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const { prisma } = await import('../../config/database');
    const [totalProducts, totalUsers, recentReceipts, recentIssues, lowStockProducts] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.receipt.findMany({ where: { status: 'APPROVED' }, take: 5, orderBy: { approvedAt: 'desc' } }),
      prisma.issue.findMany({ where: { status: 'CONFIRMED' }, take: 5, orderBy: { confirmedAt: 'desc' } }),
      prisma.product.findMany({ where: { isActive: true, balances: { some: {} } } }),
    ]);

    return success(res, {
      totalProducts,
      totalUsers,
      recentReceipts: recentReceipts.length,
      recentIssues: recentIssues.length,
      lowStockProducts,
    }, 'OK');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}
