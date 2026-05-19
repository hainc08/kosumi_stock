// tests/integration/06_rbac.test.ts
// Kiểm tra toàn bộ ma trận phân quyền — mỗi endpoint × mỗi role

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma, resetDatabase, seedTestData, ids } from './setup';
import { authed, expectError, createAndApproveReceipt, clearTokenCache, loginAs } from './helpers';

let pendingReceiptId: string;
let pendingIssueId:   string;
let approvedIssueId:  string;

beforeAll(async () => {
  await resetDatabase();
  await seedTestData();

  // Chuẩn bị phiếu PENDING để test approve/reject
  const createRes = await (await authed('accountant').post('/api/receipts'))
    .send({
      receiptDate: '2026-05-18',
      items: [{ productId: ids['product_TEST_ON1'], quantity: 5, unitPrice: 0 }],
    });
  pendingReceiptId = createRes.body.data.id;
  await (await authed('accountant').post(`/api/receipts/${pendingReceiptId}/submit`)).send();

  // Nhập hàng trước để có tồn cho xuất
  await createAndApproveReceipt([{ productId: ids['product_TEST_ON1'], quantity: 50 }]);

  // Chuẩn bị phiếu xuất PENDING
  const issueCreate = await (await authed('accountant').post('/api/issues'))
    .send({
      issueDate: '2026-05-18',
      items: [{ productId: ids['product_TEST_ON1'], requestedQty: 3 }],
    });
  pendingIssueId = issueCreate.body.data.id;
  await (await authed('accountant').post(`/api/issues/${pendingIssueId}/submit`)).send();

  // Chuẩn bị phiếu xuất APPROVED để test confirm
  const issueCreate2 = await (await authed('accountant').post('/api/issues'))
    .send({
      issueDate: '2026-05-18',
      items: [{ productId: ids['product_TEST_ON1'], requestedQty: 2 }],
    });
  approvedIssueId = issueCreate2.body.data.id;
  await (await authed('accountant').post(`/api/issues/${approvedIssueId}/submit`)).send();
  await (await authed('manager').post(`/api/issues/${approvedIssueId}/approve`)).send();
});

afterAll(async () => {
  clearTokenCache();
  await prisma.$disconnect();
});

// ── Helper: test cùng 1 endpoint với nhiều role ─────────────────────────────

async function testForbidden(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  roles: string[],
  body?: object,
) {
  for (const role of roles) {
    const req = await (authed(role as any)[method](url));
    const res = body ? req.send(body) : req.send();
    expect(
      (await res).status,
      `Role ${role} nên bị 403 với ${method.toUpperCase()} ${url}`,
    ).toBe(403);
  }
}

async function testAllowed(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  roles: string[],
  body?: object,
) {
  for (const role of roles) {
    const req = await (authed(role as any)[method](url));
    const res = body ? req.send(body) : req.send();
    const status = (await res).status;
    expect(
      status,
      `Role ${role} nên được phép với ${method.toUpperCase()} ${url} (got ${status})`,
    ).not.toBe(403);
    expect(status).not.toBe(401);
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('RBAC — Không có token', () => {
  const protectedRoutes = [
    { method: 'get',  url: '/api/inventory' },
    { method: 'get',  url: '/api/receipts' },
    { method: 'post', url: '/api/receipts' },
    { method: 'get',  url: '/api/issues' },
    { method: 'post', url: '/api/issues' },
    { method: 'get',  url: '/api/reports/inventory-summary' },
    { method: 'get',  url: '/api/users' },
  ] as const;

  protectedRoutes.forEach(({ method, url }) => {
    it(`❌ ${method.toUpperCase()} ${url} không có token → 401`, async () => {
      const res = await (request(app) as any)[method](url);
      expect(res.status).toBe(401);
    });
  });
});

describe('RBAC — inventory:read', () => {
  it('✅ Tất cả roles đều đọc được tồn kho', async () => {
    await testAllowed('get', '/api/inventory', ['admin', 'manager', 'accountant', 'staff', 'viewer']);
  });
});

describe('RBAC — receipt:create', () => {
  it('✅ admin, manager, accountant tạo được phiếu nhập', async () => {
    await testAllowed('post', '/api/receipts',
      ['admin', 'manager', 'accountant'],
      {
        receiptDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ON1'], quantity: 1, unitPrice: 0 }],
      },
    );
  });

  it('❌ staff, viewer không tạo được phiếu nhập → 403', async () => {
    await testForbidden('post', '/api/receipts',
      ['staff', 'viewer'],
      {
        receiptDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ON1'], quantity: 1, unitPrice: 0 }],
      },
    );
  });
});

describe('RBAC — receipt:approve', () => {
  it('✅ admin, manager duyệt được phiếu nhập', async () => {
    await testAllowed('post', `/api/receipts/${pendingReceiptId}/approve`, ['admin', 'manager']);
  });

  it('❌ accountant, staff, viewer không duyệt được → 403', async () => {
    await testForbidden('post', `/api/receipts/${pendingReceiptId}/approve`,
      ['accountant', 'staff', 'viewer'],
    );
  });
});

describe('RBAC — issue:confirm_actual', () => {
  it('✅ admin, manager, staff confirm được phiếu xuất APPROVED', async () => {
    // Lấy itemId từ issue đã APPROVED
    const issueRes = await (await authed('admin').get(`/api/issues/${approvedIssueId}`)).send();
    const itemId = issueRes.body.data.items[0].id;

    // staff confirm
    const res = await (await authed('staff').post(`/api/issues/${approvedIssueId}/confirm`))
      .send({ items: [{ itemId, actualQty: 1 }] });
    // Không expect 403
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });

  it('❌ accountant, viewer không confirm được → 403', async () => {
    await testForbidden('post', `/api/issues/${approvedIssueId}/confirm`,
      ['accountant', 'viewer'],
      { items: [{ itemId: 'fake-id', actualQty: 1 }] },
    );
  });
});

describe('RBAC — user:manage', () => {
  it('✅ Chỉ ADMIN xem được danh sách users', async () => {
    const res = await (await authed('admin').get('/api/users')).send();
    expect(res.status).toBe(200);
  });

  it('❌ manager, accountant, staff, viewer không xem được users → 403', async () => {
    await testForbidden('get', '/api/users', ['manager', 'accountant', 'staff', 'viewer']);
  });
});

describe('RBAC — report:export', () => {
  it('✅ admin, manager, accountant export được Excel', async () => {
    await testAllowed('get', '/api/reports/export/excel?year=2026&month=5',
      ['admin', 'manager', 'accountant'],
    );
  });

  it('❌ staff, viewer không export được → 403', async () => {
    await testForbidden('get', '/api/reports/export/excel?year=2026&month=5',
      ['staff', 'viewer'],
    );
  });
});
