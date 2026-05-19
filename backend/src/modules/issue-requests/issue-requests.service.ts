import { IssueRequestStatus, IssueStatus, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { generateIssueNo, generateRequestNo } from '../../utils/generateCode';
import { parsePagination } from '../../utils/response';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { CreateIssueRequestDto } from './issue-requests.schema';

async function notifyReviewers(issueRequestId: string, requestedByName: string, itemCount: number) {
  const reviewers = await prisma.user.findMany({
    where: { isActive: true, role: { in: [Role.ADMIN, Role.WAREHOUSE_MANAGER] } },
    select: { id: true },
  });

  if (!reviewers.length) return;

  await prisma.notification.createMany({
    data: reviewers.map((r) => ({
      userId: r.id,
      type: 'ISSUE_REQUEST_NEW',
      title: 'Yeu cau xuat kho moi',
      message: `${requestedByName} xin xuat kho - ${itemCount} mat hang`,
      entityId: issueRequestId,
      entityType: 'issue_request',
    })),
  });
}

export async function createIssueRequest(dto: CreateIssueRequestDto, userId: string) {
  const requestNo = await generateRequestNo();
  const date = new Date(dto.requestDate);

  const period = await prisma.inventoryPeriod.findUnique({
    where: { year_month: { year: date.getFullYear(), month: date.getMonth() + 1 } },
  });

  if (!period) throw { code: 'NOT_FOUND', message: 'Ky ton kho khong ton tai', status: 404 };
  if (period.isClosed) throw { code: 'PERIOD_CLOSED', message: 'Ky da dong, khong the tao yeu cau', status: 409 };

  const requester = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });

  const created = await prisma.issueRequest.create({
    data: {
      requestNo,
      periodId: period.id,
      requestDate: date,
      reason: dto.reason,
      note: dto.note,
      requestedById: userId,
      items: {
        create: dto.items.map((i) => ({
          productId: i.productId,
          requestedQty: i.requestedQty,
          note: i.note,
        })),
      },
    },
    include: {
      requestedBy: { select: { fullName: true, role: true } },
      items: { include: { product: { select: { id: true, code: true, name: true, unit: true } } } },
    },
  });

  await notifyReviewers(created.id, requester?.fullName ?? 'Nhan vien kho', created.items.length);

  await writeAuditLog({
    userId,
    action: 'CREATE_ISSUE_REQUEST',
    entityType: 'issue_request',
    entityId: created.id,
    newData: created,
  });

  return created;
}

export async function listIssueRequests(query: Record<string, unknown>, callerRole: Role, callerId: string) {
  const { page, limit, skip } = parsePagination(query);
  const status = query.status as IssueRequestStatus | undefined;

  const where: any = {
    ...(status ? { status } : {}),
    ...(callerRole === Role.WAREHOUSE_STAFF ? { requestedById: callerId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.issueRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: { select: { fullName: true, role: true } },
        reviewedBy: { select: { fullName: true } },
        issue: { select: { id: true, issueNo: true, status: true } },
        items: { include: { product: { select: { id: true, code: true, name: true, unit: true } } } },
      },
    }),
    prisma.issueRequest.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getIssueRequest(id: string, callerRole: Role, callerId: string) {
  const req = await prisma.issueRequest.findUnique({
    where: { id },
    include: {
      requestedBy: { select: { fullName: true, role: true } },
      reviewedBy: { select: { fullName: true } },
      issue: { select: { id: true, issueNo: true, status: true } },
      items: { include: { product: true } },
    },
  });

  if (!req) throw { code: 'NOT_FOUND', message: 'Yeu cau khong ton tai', status: 404 };
  if (callerRole === Role.WAREHOUSE_STAFF && req.requestedById !== callerId) {
    throw { code: 'FORBIDDEN', message: 'Khong du quyen', status: 403 };
  }
  return req;
}

export async function approveIssueRequest(id: string, reviewerId: string) {
  const current = await prisma.issueRequest.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!current) throw { code: 'NOT_FOUND', message: 'Yeu cau khong ton tai', status: 404 };
  if (current.status !== IssueRequestStatus.PENDING_APPROVAL) {
    throw { code: 'INVALID_STATUS_TRANSITION', message: 'Yeu cau khong o trang thai cho duyet', status: 409 };
  }

  const issue = await prisma.$transaction(async (tx) => {
    const createdIssue = await tx.issue.create({
      data: {
        issueNo: await generateIssueNo(),
        periodId: current.periodId,
        issueDate: current.requestDate,
        recipient: current.requestedById,
        note: `${current.reason ?? ''}${current.note ? ` | ${current.note}` : ''}`.trim(),
        status: IssueStatus.DRAFT,
        createdById: current.requestedById,
        items: {
          create: current.items.map((i) => ({
            productId: i.productId,
            requestedQty: i.requestedQty,
            unitPrice: 0,
          })),
        },
      },
      select: { id: true, issueNo: true, status: true },
    });

    await tx.issueRequest.update({
      where: { id },
      data: {
        status: IssueRequestStatus.APPROVED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        issueId: createdIssue.id,
      },
    });

    await tx.notification.create({
      data: {
        userId: current.requestedById,
        type: 'ISSUE_REQUEST_APPROVED',
        title: 'Yeu cau xuat kho da duoc duyet',
        message: `Yeu cau ${current.requestNo} da duoc duyet`,
        entityId: id,
        entityType: 'issue_request',
      },
    });

    return createdIssue;
  });

  await writeAuditLog({
    userId: reviewerId,
    action: 'APPROVE_ISSUE_REQUEST',
    entityType: 'issue_request',
    entityId: id,
    newData: { issueId: issue.id, issueNo: issue.issueNo },
  });

  return issue;
}

export async function rejectIssueRequest(id: string, reviewerId: string, rejectReason: string) {
  const current = await prisma.issueRequest.findUnique({ where: { id } });
  if (!current) throw { code: 'NOT_FOUND', message: 'Yeu cau khong ton tai', status: 404 };
  if (current.status !== IssueRequestStatus.PENDING_APPROVAL) {
    throw { code: 'INVALID_STATUS_TRANSITION', message: 'Yeu cau khong o trang thai cho duyet', status: 409 };
  }

  await prisma.$transaction(async (tx) => {
    await tx.issueRequest.update({
      where: { id },
      data: {
        status: IssueRequestStatus.REJECTED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectReason,
      },
    });

    await tx.notification.create({
      data: {
        userId: current.requestedById,
        type: 'ISSUE_REQUEST_REJECTED',
        title: 'Yeu cau xuat kho bi tu choi',
        message: `Yeu cau ${current.requestNo} bi tu choi: ${rejectReason}`,
        entityId: id,
        entityType: 'issue_request',
      },
    });
  });

  await writeAuditLog({
    userId: reviewerId,
    action: 'REJECT_ISSUE_REQUEST',
    entityType: 'issue_request',
    entityId: id,
    newData: { rejectReason },
  });
}
