import { IssueStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { generateIssueNo } from '../../utils/generateCode';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { CreateIssueDto, ConfirmIssueDto } from './issues.schema';
import { parsePagination } from '../../utils/response';

export async function listIssues(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const status = query.status as IssueStatus | undefined;
  const search = query.search as string | undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(search ? { OR: [{ issueNo: { contains: search, mode: 'insensitive' as const } }] } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { fullName: true, role: true } },
        approvedBy: { select: { fullName: true } },
        confirmedBy: { select: { fullName: true } },
        items: { include: { product: { select: { code: true, name: true, unit: true } } } },
      },
    }),
    prisma.issue.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getIssue(id: string) {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      createdBy: { select: { fullName: true, role: true } },
      approvedBy: { select: { fullName: true } },
      confirmedBy: { select: { fullName: true } },
      items: { include: { product: true } },
    },
  });
  if (!issue) throw { code: 'NOT_FOUND', message: 'Phieu xuat khong ton tai', status: 404 };
  return issue;
}

export async function createIssue(dto: CreateIssueDto, userId: string) {
  const issueNo = await generateIssueNo();
  const date = new Date(dto.issueDate);

  const period = await prisma.inventoryPeriod.findUnique({
    where: { year_month: { year: date.getFullYear(), month: date.getMonth() + 1 } },
  });

  if (!period) {
    throw { code: 'NOT_FOUND', message: 'Ky ton kho khong ton tai cho ngay xuat', status: 404 };
  }
  if (period.isClosed) {
    throw { code: 'PERIOD_CLOSED', message: 'Ky da dong, khong the tao phieu xuat', status: 409 };
  }

  for (const item of dto.items) {
    const balance = await prisma.inventoryBalance.findUnique({
      where: { periodId_productId: { periodId: period.id, productId: item.productId } },
    });
    const currentQty = Number(balance?.closingQty ?? 0);
    if (item.requestedQty > currentQty) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      throw {
        code: 'INSUFFICIENT_STOCK',
        message: `Hang "${product?.name ?? item.productId}" khong du ton kho. Ton hien tai: ${currentQty}`,
        status: 409,
      };
    }
  }

  const issue = await prisma.issue.create({
    data: {
      issueNo,
      issueDate: date,
      recipient: dto.recipient,
      department: dto.department,
      note: dto.note,
      periodId: period.id,
      createdById: userId,
      items: {
        create: dto.items.map((item) => ({
          productId: item.productId,
          requestedQty: item.requestedQty,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  await writeAuditLog({ userId, action: 'CREATE_ISSUE', entityType: 'issue', entityId: issue.id, newData: issue });
  return issue;
}

export async function submitIssue(id: string, userId: string) {
  const existing = await getIssue(id);
  if (existing.status !== 'DRAFT') {
    throw { code: 'INVALID_STATUS_TRANSITION', message: 'Phieu khong o trang thai DRAFT', status: 409 };
  }

  const updated = await prisma.issue.update({ where: { id }, data: { status: IssueStatus.PENDING } });
  await writeAuditLog({ userId, action: 'SUBMIT_ISSUE', entityType: 'issue', entityId: id });
  return updated;
}

export async function approveIssue(id: string, userId: string) {
  const existing = await getIssue(id);
  if (existing.status !== 'PENDING') {
    throw { code: 'INVALID_STATUS_TRANSITION', message: 'Phieu khong o trang thai PENDING', status: 409 };
  }

  const period = existing.periodId ? await prisma.inventoryPeriod.findUnique({ where: { id: existing.periodId } }) : null;
  if (!period) {
    throw { code: 'NOT_FOUND', message: 'Khong tim thay ky ton kho cua phieu xuat', status: 404 };
  }
  if (period.isClosed) {
    throw { code: 'PERIOD_CLOSED', message: 'Ky da dong, khong the duyet phieu xuat', status: 409 };
  }

  const updated = await prisma.issue.update({
    where: { id },
    data: { status: IssueStatus.APPROVED, approvedById: userId, approvedAt: new Date() },
  });
  await writeAuditLog({ userId, action: 'APPROVE_ISSUE', entityType: 'issue', entityId: id });
  return updated;
}

export async function confirmIssue(id: string, dto: ConfirmIssueDto, userId: string) {
  const issue = await getIssue(id);
  if (issue.status !== 'APPROVED') {
    throw { code: 'INVALID_STATUS_TRANSITION', message: 'Phieu chua duoc duyet', status: 409 };
  }
  if (!issue.periodId) {
    throw { code: 'NOT_FOUND', message: 'Khong tim thay ky ton kho cua phieu xuat', status: 404 };
  }

  const period = await prisma.inventoryPeriod.findUnique({ where: { id: issue.periodId } });
  if (!period) {
    throw { code: 'NOT_FOUND', message: 'Ky ton kho khong ton tai', status: 404 };
  }
  if (period.isClosed) {
    throw { code: 'PERIOD_CLOSED', message: 'Ky da dong, khong the xac nhan xuat kho', status: 409 };
  }

  const issueItemsById = new Map(issue.items.map((item) => [item.id, item]));
  for (const confirm of dto.items) {
    const item = issueItemsById.get(confirm.itemId);
    if (!item) {
      throw { code: 'VALIDATION_ERROR', message: 'Item xac nhan khong thuoc phieu xuat', status: 422 };
    }

    const balance = await prisma.inventoryBalance.findUnique({
      where: { periodId_productId: { periodId: issue.periodId, productId: item.productId } },
    });
    const currentQty = Number(balance?.closingQty ?? 0);
    if (confirm.actualQty > currentQty) {
      throw { code: 'INSUFFICIENT_STOCK', message: `Khong du ton kho de xac nhan xuat. Ton hien tai: ${currentQty}`, status: 409 };
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const confirm of dto.items) {
      await tx.issueItem.update({ where: { id: confirm.itemId }, data: { actualQty: confirm.actualQty } });
    }

    await tx.issue.update({
      where: { id },
      data: { status: IssueStatus.CONFIRMED, confirmedById: userId, confirmedAt: new Date() },
    });

    for (const confirm of dto.items) {
      const item = issueItemsById.get(confirm.itemId)!;
      await tx.inventoryBalance.upsert({
        where: { periodId_productId: { periodId: issue.periodId!, productId: item.productId } },
        update: { closingQty: { decrement: confirm.actualQty } },
        create: {
          periodId: issue.periodId!,
          productId: item.productId,
          openingQty: 0,
          closingQty: -confirm.actualQty,
        },
      });
    }
  });

  await writeAuditLog({ userId, action: 'CONFIRM_ISSUE', entityType: 'issue', entityId: id });
  return getIssue(id);
}

export async function rejectIssue(id: string, userId: string) {
  const existing = await getIssue(id);
  if (existing.status !== 'PENDING') {
    throw { code: 'INVALID_STATUS_TRANSITION', message: 'Phieu khong o trang thai PENDING', status: 409 };
  }
  const updated = await prisma.issue.update({ where: { id }, data: { status: IssueStatus.REJECTED } });
  await writeAuditLog({ userId, action: 'REJECT_ISSUE', entityType: 'issue', entityId: id });
  return updated;
}
