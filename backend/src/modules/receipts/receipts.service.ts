import { ReceiptStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { generateReceiptNo } from '../../utils/generateCode';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { CreateReceiptDto, UpdateReceiptDto } from './receipts.schema';
import { parsePagination } from '../../utils/response';

export async function listReceipts(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const status = query.status as ReceiptStatus | undefined;
  const search = query.search as string | undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { receiptNo: { contains: search, mode: 'insensitive' as const } },
            { supplier: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.receipt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { fullName: true, role: true } },
        approvedBy: { select: { fullName: true } },
        items: { include: { product: { select: { code: true, name: true, unit: true } } } },
      },
    }),
    prisma.receipt.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getReceipt(id: string) {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      createdBy: { select: { fullName: true, role: true } },
      approvedBy: { select: { fullName: true } },
      items: { include: { product: true } },
    },
  });

  if (!receipt) throw { code: 'NOT_FOUND', message: 'Phieu nhap khong ton tai', status: 404 };
  return receipt;
}

export async function createReceipt(dto: CreateReceiptDto, userId: string) {
  const receiptNo = await generateReceiptNo();
  const date = new Date(dto.receiptDate);

  const period = await prisma.inventoryPeriod.findUnique({
    where: { year_month: { year: date.getFullYear(), month: date.getMonth() + 1 } },
  });

  if (!period) {
    throw { code: 'NOT_FOUND', message: 'Ky ton kho khong ton tai cho ngay nhap', status: 404 };
  }
  if (period.isClosed) {
    throw { code: 'PERIOD_CLOSED', message: 'Ky da dong, khong the tao phieu nhap', status: 409 };
  }

  const receipt = await prisma.receipt.create({
    data: {
      receiptNo,
      receiptDate: date,
      supplier: dto.supplier,
      note: dto.note,
      periodId: period.id,
      createdById: userId,
      items: {
        create: dto.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalValue: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  await writeAuditLog({ userId, action: 'CREATE_RECEIPT', entityType: 'receipt', entityId: receipt.id, newData: receipt });
  return receipt;
}

export async function updateReceipt(id: string, dto: UpdateReceiptDto, userId: string) {
  const existing = await getReceipt(id);
  if (existing.status !== 'DRAFT') {
    throw { code: 'INVALID_STATUS_TRANSITION', message: 'Chi co the sua phieu o trang thai DRAFT', status: 409 };
  }

  let periodId: string | undefined;
  if (dto.receiptDate) {
    const date = new Date(dto.receiptDate);
    const period = await prisma.inventoryPeriod.findUnique({
      where: { year_month: { year: date.getFullYear(), month: date.getMonth() + 1 } },
    });
    if (!period) {
      throw { code: 'NOT_FOUND', message: 'Ky ton kho khong ton tai cho ngay nhap', status: 404 };
    }
    if (period.isClosed) {
      throw { code: 'PERIOD_CLOSED', message: 'Ky da dong, khong the sua phieu nhap', status: 409 };
    }
    periodId = period.id;
  }

  await prisma.receiptItem.deleteMany({ where: { receiptId: id } });

  const updated = await prisma.receipt.update({
    where: { id },
    data: {
      ...(dto.receiptDate ? { receiptDate: new Date(dto.receiptDate), periodId } : {}),
      ...(dto.supplier !== undefined ? { supplier: dto.supplier } : {}),
      ...(dto.note !== undefined ? { note: dto.note } : {}),
      ...(dto.items
        ? {
            items: {
              create: dto.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice ?? 0,
                totalValue: item.quantity * (item.unitPrice ?? 0),
              })),
            },
          }
        : {}),
    },
    include: { items: { include: { product: true } } },
  });

  await writeAuditLog({ userId, action: 'UPDATE_RECEIPT', entityType: 'receipt', entityId: id, oldData: existing, newData: updated });
  return updated;
}

export async function submitReceipt(id: string, userId: string) {
  const existing = await getReceipt(id);
  if (existing.status !== 'DRAFT') {
    throw { code: 'INVALID_STATUS_TRANSITION', message: 'Phieu khong o trang thai DRAFT', status: 409 };
  }

  const updated = await prisma.receipt.update({ where: { id }, data: { status: ReceiptStatus.PENDING } });
  await writeAuditLog({ userId, action: 'SUBMIT_RECEIPT', entityType: 'receipt', entityId: id });
  return updated;
}

export async function approveReceipt(id: string, userId: string) {
  const receipt = await getReceipt(id);
  if (receipt.status !== 'PENDING') {
    throw { code: 'INVALID_STATUS_TRANSITION', message: 'Phieu khong o trang thai PENDING', status: 409 };
  }
  if (!receipt.periodId) {
    throw { code: 'NOT_FOUND', message: 'Khong tim thay ky ton kho cua phieu nhap', status: 404 };
  }

  const period = await prisma.inventoryPeriod.findUnique({ where: { id: receipt.periodId } });
  if (!period) {
    throw { code: 'NOT_FOUND', message: 'Ky ton kho khong ton tai', status: 404 };
  }
  if (period.isClosed) {
    throw { code: 'PERIOD_CLOSED', message: 'Ky da dong, khong the duyet phieu nhap', status: 409 };
  }

  await prisma.$transaction(async (tx) => {
    await tx.receipt.update({
      where: { id },
      data: { status: ReceiptStatus.APPROVED, approvedById: userId, approvedAt: new Date() },
    });

    for (const item of receipt.items) {
      await tx.inventoryBalance.upsert({
        where: { periodId_productId: { periodId: receipt.periodId!, productId: item.productId } },
        update: { closingQty: { increment: item.quantity } },
        create: {
          periodId: receipt.periodId!,
          productId: item.productId,
          openingQty: 0,
          closingQty: item.quantity,
        },
      });
    }
  });

  await writeAuditLog({ userId, action: 'APPROVE_RECEIPT', entityType: 'receipt', entityId: id });
  return getReceipt(id);
}

export async function rejectReceipt(id: string, userId: string) {
  const existing = await getReceipt(id);
  if (existing.status !== 'PENDING') {
    throw { code: 'INVALID_STATUS_TRANSITION', message: 'Phieu khong o trang thai PENDING', status: 409 };
  }

  const updated = await prisma.receipt.update({ where: { id }, data: { status: ReceiptStatus.REJECTED } });
  await writeAuditLog({ userId, action: 'REJECT_RECEIPT', entityType: 'receipt', entityId: id });
  return updated;
}

export async function deleteReceipt(id: string, userId: string) {
  const existing = await getReceipt(id);
  if (existing.status !== 'DRAFT') {
    throw { code: 'INVALID_STATUS_TRANSITION', message: 'Chi co the xoa phieu DRAFT', status: 409 };
  }

  await prisma.receipt.delete({ where: { id } });
  await writeAuditLog({ userId, action: 'DELETE_RECEIPT', entityType: 'receipt', entityId: id, oldData: existing });
}
