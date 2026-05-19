import { prisma } from '../../config/database';
import { writeAuditLog } from '../../middleware/audit.middleware';

export async function getCurrentInventory(query: { year?: number; month?: number; category?: string; search?: string }) {
  const now = new Date();
  const year = query.year ?? now.getFullYear();
  const month = query.month ?? now.getMonth() + 1;

  const period = await prisma.inventoryPeriod.findUnique({ where: { year_month: { year, month } } });
  if (!period) return { period: null, items: [] };

  const balances = await prisma.inventoryBalance.findMany({
    where: {
      periodId: period.id,
      product: {
        isActive: true,
        ...(query.category ? { category: query.category } : {}),
        ...(query.search
          ? {
              OR: [
                { code: { contains: query.search } },
                { name: { contains: query.search } },
              ],
            }
          : {}),
      },
    },
    include: { product: true },
    orderBy: { product: { code: 'asc' } },
  });

  const items = balances.map((b) => ({
    ...b,
    status: Number(b.closingQty) <= b.product.minStock / 2 ? 'LOW' : Number(b.closingQty) <= b.product.minStock ? 'MID' : 'OK',
  }));

  return { period, items };
}

export async function getLowStockAlerts() {
  const now = new Date();
  const period = await prisma.inventoryPeriod.findUnique({
    where: { year_month: { year: now.getFullYear(), month: now.getMonth() + 1 } },
  });
  if (!period) return [];

  const balances = await prisma.inventoryBalance.findMany({
    where: { periodId: period.id, product: { isActive: true } },
    include: { product: true },
  });

  return balances
    .filter((b) => Number(b.closingQty) <= b.product.minStock)
    .map((b) => ({
      productId: b.productId,
      code: b.product.code,
      name: b.product.name,
      unit: b.product.unit,
      closingQty: Number(b.closingQty),
      minStock: b.product.minStock,
    }));
}

export async function getInventorySummary() {
  const now = new Date();
  const period = await prisma.inventoryPeriod.findUnique({
    where: { year_month: { year: now.getFullYear(), month: now.getMonth() + 1 } },
  });

  const [totalProducts, lowStockCount, pendingReceipts, pendingIssues] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    getLowStockAlerts().then((a) => a.length),
    prisma.receipt.count({ where: { status: 'PENDING' } }),
    prisma.issue.count({ where: { status: 'PENDING' } }),
  ]);

  return { totalProducts, lowStockCount, pendingReceipts, pendingIssues, period };
}

export async function listBalance(page: number, limit: number, skip: number, periodId?: string, productCode?: string) {
  const where: any = {};
  if (periodId) where.periodId = periodId;
  if (productCode) where.product = { code: { contains: productCode } };

  const [data, total] = await Promise.all([
    prisma.inventoryBalance.findMany({
      where,
      skip,
      take: limit,
      include: { product: true, period: true },
      orderBy: [{ period: { year: 'desc' } }, { period: { month: 'desc' } }, { product: { code: 'asc' } }],
    }),
    prisma.inventoryBalance.count({ where }),
  ]);

  return { data, total };
}

export async function getCurrentBalance(productId: string) {
  const now = new Date();
  const period = await prisma.inventoryPeriod.findUnique({
    where: { year_month: { year: now.getFullYear(), month: now.getMonth() + 1 } },
  });

  if (!period) throw { code: 'NOT_FOUND', message: 'Ky hien tai khong ton tai', status: 404 };

  const balance = await prisma.inventoryBalance.findUnique({
    where: { periodId_productId: { periodId: period.id, productId } },
    include: { product: true },
  });

  if (!balance) throw { code: 'NOT_FOUND', message: 'Khong tim thay du lieu ton kho', status: 404 };
  return balance;
}

export async function listPeriods() {
  return prisma.inventoryPeriod.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] });
}

export async function closePeriod(periodId: string, userId: string) {
  const period = await prisma.inventoryPeriod.findUnique({ where: { id: periodId } });
  if (!period) throw { code: 'NOT_FOUND', message: 'Ky khong ton tai', status: 404 };
  if (period.isClosed) throw { code: 'PERIOD_CLOSED', message: 'Ky da duoc dong', status: 409 };

  const updated = await prisma.inventoryPeriod.update({
    where: { id: periodId },
    data: { isClosed: true, closedAt: new Date(), closedBy: userId },
  });

  await writeAuditLog({ userId, action: 'CLOSE_PERIOD', entityType: 'InventoryPeriod', entityId: periodId, newData: { isClosed: true } });
  return updated;
}

export async function rolloverPeriod(params: { fromYear: number; fromMonth: number; toYear: number; toMonth: number }, userId: string) {
  const { fromYear, fromMonth, toYear, toMonth } = params;

  const fromPeriod = await prisma.inventoryPeriod.findUnique({
    where: { year_month: { year: fromYear, month: fromMonth } },
  });
  if (!fromPeriod) throw { code: 'NOT_FOUND', message: 'Ky nguon khong ton tai', status: 404 };

  let toPeriod = await prisma.inventoryPeriod.findUnique({ where: { year_month: { year: toYear, month: toMonth } } });

  await prisma.$transaction(async (tx) => {
    if (!fromPeriod.isClosed) {
      await tx.inventoryPeriod.update({
        where: { id: fromPeriod.id },
        data: { isClosed: true, closedAt: new Date(), closedBy: userId },
      });
    }

    if (!toPeriod) {
      toPeriod = await tx.inventoryPeriod.create({ data: { year: toYear, month: toMonth } });
    }

    const balances = await tx.inventoryBalance.findMany({ where: { periodId: fromPeriod.id } });

    for (const b of balances) {
      await tx.inventoryBalance.upsert({
        where: { periodId_productId: { periodId: toPeriod!.id, productId: b.productId } },
        update: { openingQty: b.closingQty, closingQty: b.closingQty },
        create: {
          periodId: toPeriod!.id,
          productId: b.productId,
          openingQty: b.closingQty,
          closingQty: b.closingQty,
        },
      });
    }
  });

  await writeAuditLog({
    userId,
    action: 'ROLLOVER_PERIOD',
    entityType: 'InventoryPeriod',
    entityId: toPeriod!.id,
    newData: { fromPeriod: fromPeriod.id, toPeriod: toPeriod!.id },
  });

  return toPeriod!;
}

