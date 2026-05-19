// src/modules/reports/reports.service.ts
import { prisma } from '../../config/database';
import { ExportInventoryDto, ExportReceiptDto, ExportIssueDto } from './reports.schema';
import * as ExcelJS from 'exceljs';

export async function generateInventoryReport(dto: ExportInventoryDto) {
  const where: any = {};
  if (dto.periodId) {
    where.periodId = dto.periodId;
  }

  const balances = await prisma.inventoryBalance.findMany({
    where,
    include: {
      product: true,
      period: true,
    },
    orderBy: [{ period: { year: 'desc' } }, { period: { month: 'desc' } }, { product: { code: 'asc' } }],
  });

  return {
    title: 'Báo cáo Tồn kho',
    timestamp: new Date().toISOString(),
    data: balances.map((b) => ({
      periodYear: b.period.year,
      periodMonth: b.period.month,
      productCode: b.product.code,
      productName: b.product.name,
      productUnit: b.product.unit,
      openingQty: Number(b.openingQty),
      openingValue: Number(b.openingValue),
      closingQty: Number(b.closingQty),
      closingValue: Number(b.closingValue),
    })),
  };
}

export async function generateReceiptReport(dto: ExportReceiptDto) {
  const where: any = {
    status: 'APPROVED', // Chỉ lấy phiếu đã approved
  };
  if (dto.startDate || dto.endDate) {
    where.receiptDate = {};
    if (dto.startDate) where.receiptDate.gte = new Date(dto.startDate);
    if (dto.endDate) where.receiptDate.lte = new Date(dto.endDate);
  }

  const receipts = await prisma.receipt.findMany({
    where,
    include: {
      items: {
        include: { product: true },
      },
      createdBy: { select: { username: true, fullName: true } },
      approvedBy: { select: { username: true, fullName: true } },
    },
    orderBy: { receiptDate: 'desc' },
  });

  return {
    title: 'Báo cáo Phiếu Nhập',
    timestamp: new Date().toISOString(),
    data: receipts.map((r) => ({
      receiptNo: r.receiptNo,
      receiptDate: r.receiptDate,
      supplier: r.supplier,
      status: r.status,
      createdBy: r.createdBy?.fullName,
      approvedBy: r.approvedBy?.fullName,
      approvedAt: r.approvedAt,
      items: r.items.map((i) => ({
        productCode: i.product.code,
        productName: i.product.name,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        totalValue: Number(i.totalValue),
      })),
    })),
  };
}

export async function generateIssueReport(dto: ExportIssueDto) {
  const where: any = {
    status: 'CONFIRMED', // Chỉ lấy phiếu đã confirm
  };
  if (dto.startDate || dto.endDate) {
    where.issueDate = {};
    if (dto.startDate) where.issueDate.gte = new Date(dto.startDate);
    if (dto.endDate) where.issueDate.lte = new Date(dto.endDate);
  }

  const issues = await prisma.issue.findMany({
    where,
    include: {
      items: {
        include: { product: true },
      },
      createdBy: { select: { username: true, fullName: true } },
      approvedBy: { select: { username: true, fullName: true } },
      confirmedBy: { select: { username: true, fullName: true } },
    },
    orderBy: { issueDate: 'desc' },
  });

  return {
    title: 'Báo cáo Phiếu Xuất',
    timestamp: new Date().toISOString(),
    data: issues.map((i) => ({
      issueNo: i.issueNo,
      issueDate: i.issueDate,
      recipient: i.recipient,
      department: i.department,
      status: i.status,
      createdBy: i.createdBy?.fullName,
      approvedBy: i.approvedBy?.fullName,
      confirmedBy: i.confirmedBy?.fullName,
      confirmedAt: i.confirmedAt,
      items: i.items.map((it) => ({
        productCode: it.product.code,
        productName: it.product.name,
        requestedQty: Number(it.requestedQty),
        actualQty: Number(it.actualQty ?? 0),
        unitPrice: Number(it.unitPrice),
      })),
    })),
  };
}

/**
 * Convert data to XLSX Buffer
 */
export async function convertToExcel(data: any, sheetName: string = 'Sheet1'): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Simple flat export - just the title and data as rows
  if (Array.isArray(data.data) && data.data.length > 0) {
    const headers = Object.keys(data.data[0]);
    worksheet.addRow(headers);
    data.data.forEach((row: any) => {
      worksheet.addRow(headers.map((h) => row[h]));
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
