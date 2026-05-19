// tests/integration/04_receipt_flow.test.ts
// Luồng nghiệp vụ nhập kho — CRITICAL
// Kiểm tra: tồn kho chỉ thay đổi khi APPROVE, không phải khi CREATE/SUBMIT

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma, resetDatabase, seedTestData, getClosingQty, ids } from './setup';
import { authed, expectSuccess, expectError, clearTokenCache } from './helpers';

beforeAll(async () => {
  await resetDatabase();
  await seedTestData();
});

afterAll(async () => {
  clearTokenCache();
  await prisma.$disconnect();
});

describe('Phiếu Nhập — DRAFT → PENDING → APPROVED', () => {
  let receiptId: string;
  let initialQty_ON1: number;
  let initialQty_T1: number;

  it('Setup: ghi nhớ tồn kho ban đầu', async () => {
    initialQty_ON1 = await getClosingQty('TEST_ON1'); // 30
    initialQty_T1  = await getClosingQty('TEST_T1');  // 10
    expect(initialQty_ON1).toBe(30);
    expect(initialQty_T1).toBe(10);
  });

  it('✅ ACCOUNTANT tạo phiếu nhập → DRAFT', async () => {
    const res = await (await authed('accountant').post('/api/receipts'))
      .send({
        receiptDate: '2026-05-18',
        supplier: 'Thép Nam Vang Test',
        note: 'Test receipt flow',
        items: [
          { productId: ids['product_TEST_ON1'], quantity: 15, unitPrice: 0 },
          { productId: ids['product_TEST_T1'],  quantity: 5,  unitPrice: 0 },
        ],
      });

    const data = expectSuccess(res, 201);
    expect(data.status).toBe('DRAFT');
    expect(data.receiptNo).toMatch(/^PN-\d{4}-\d+$/);
    expect(data.items).toHaveLength(2);
    receiptId = data.id;
  });

  it('🔒 Tồn kho CHƯA thay đổi sau CREATE (DRAFT)', async () => {
    expect(await getClosingQty('TEST_ON1')).toBe(initialQty_ON1);
    expect(await getClosingQty('TEST_T1')).toBe(initialQty_T1);
  });

  it('❌ VIEWER không thể tạo phiếu nhập → 403', async () => {
    const res = await (await authed('viewer').post('/api/receipts'))
      .send({ receiptDate: '2026-05-18', items: [{ productId: ids['product_TEST_ON1'], quantity: 1 }] });
    expectError(res, 'FORBIDDEN', 403);
  });

  it('❌ WAREHOUSE_STAFF không thể tạo phiếu nhập → 403', async () => {
    const res = await (await authed('staff').post('/api/receipts'))
      .send({ receiptDate: '2026-05-18', items: [{ productId: ids['product_TEST_ON1'], quantity: 1 }] });
    expectError(res, 'FORBIDDEN', 403);
  });

  it('✅ ACCOUNTANT submit phiếu → PENDING', async () => {
    const res = await (await authed('accountant').post(`/api/receipts/${receiptId}/submit`)).send();
    const data = expectSuccess(res);
    expect(data.status).toBe('PENDING');
  });

  it('🔒 Tồn kho CHƯA thay đổi sau SUBMIT (PENDING)', async () => {
    expect(await getClosingQty('TEST_ON1')).toBe(initialQty_ON1);
    expect(await getClosingQty('TEST_T1')).toBe(initialQty_T1);
  });

  it('❌ ACCOUNTANT không thể tự approve phiếu của mình → 403', async () => {
    const res = await (await authed('accountant').post(`/api/receipts/${receiptId}/approve`)).send();
    expectError(res, 'FORBIDDEN', 403);
  });

  it('❌ WAREHOUSE_STAFF không thể approve → 403', async () => {
    const res = await (await authed('staff').post(`/api/receipts/${receiptId}/approve`)).send();
    expectError(res, 'FORBIDDEN', 403);
  });

  it('✅ WAREHOUSE_MANAGER approve phiếu → APPROVED', async () => {
    const res = await (await authed('manager').post(`/api/receipts/${receiptId}/approve`)).send();
    const data = expectSuccess(res);
    expect(data.status).toBe('APPROVED');
    expect(data.approvedBy).toBeDefined();
    expect(data.approvedAt).toBeDefined();
  });

  it('✅ Tồn kho ĐÃ tăng đúng số lượng sau APPROVE', async () => {
    const newQty_ON1 = await getClosingQty('TEST_ON1');
    const newQty_T1  = await getClosingQty('TEST_T1');
    expect(newQty_ON1).toBe(initialQty_ON1 + 15); // 30 + 15 = 45
    expect(newQty_T1).toBe(initialQty_T1   + 5);  // 10 + 5  = 15
  });

  it('❌ Approve lần 2 → 409 INVALID_STATUS_TRANSITION', async () => {
    const res = await (await authed('manager').post(`/api/receipts/${receiptId}/approve`)).send();
    expectError(res, 'INVALID_STATUS_TRANSITION', 409);
  });

  it('❌ Sửa phiếu đã APPROVED → 409 INVALID_STATUS_TRANSITION', async () => {
    const res = await (await authed('accountant').put(`/api/receipts/${receiptId}`))
      .send({ supplier: 'New Supplier' });
    expectError(res, 'INVALID_STATUS_TRANSITION', 409);
  });

  it('✅ Audit log ghi đủ 3 actions', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { entityId: receiptId },
      orderBy: { createdAt: 'asc' },
    });
    const actions = logs.map((l) => l.action);
    expect(actions).toContain('CREATE_RECEIPT');
    expect(actions).toContain('SUBMIT_RECEIPT');
    expect(actions).toContain('APPROVE_RECEIPT');
  });
});

describe('Phiếu Nhập — Luồng Reject', () => {
  let receiptId: string;

  it('Setup: tạo và submit phiếu mới', async () => {
    const createRes = await (await authed('accountant').post('/api/receipts'))
      .send({
        receiptDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ON1'], quantity: 5, unitPrice: 0 }],
      });
    receiptId = expectSuccess(createRes, 201).id;
    await (await authed('accountant').post(`/api/receipts/${receiptId}/submit`)).send();
  });

  it('✅ MANAGER reject phiếu → REJECTED', async () => {
    const res = await (await authed('manager').post(`/api/receipts/${receiptId}/reject`)).send();
    const data = expectSuccess(res);
    expect(data.status).toBe('REJECTED');
  });

  it('🔒 Tồn kho KHÔNG thay đổi sau REJECT', async () => {
    // ON1 hiện tại là 45 (từ test trên), không thêm 5
    expect(await getClosingQty('TEST_ON1')).toBe(45);
  });

  it('❌ Approve phiếu đã REJECTED → 409', async () => {
    const res = await (await authed('manager').post(`/api/receipts/${receiptId}/approve`)).send();
    expectError(res, 'INVALID_STATUS_TRANSITION', 409);
  });
});
