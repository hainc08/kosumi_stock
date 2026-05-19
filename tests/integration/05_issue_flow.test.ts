// tests/integration/05_issue_flow.test.ts
// Luồng nghiệp vụ xuất kho — CRITICAL
// Điểm quan trọng nhất: tồn kho trừ theo ACTUAL_QTY khi CONFIRM, không phải khi APPROVE

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, resetDatabase, seedTestData, getClosingQty, ids } from './setup';
import { authed, expectSuccess, expectError, createAndApproveReceipt, clearTokenCache } from './helpers';

beforeAll(async () => {
  await resetDatabase();
  await seedTestData();
  // Nhập trước 20 hàng TEST_RECV để test xuất
  await createAndApproveReceipt([
    { productId: ids['product_TEST_RECV'], quantity: 20 },
  ]);
});

afterAll(async () => {
  clearTokenCache();
  await prisma.$disconnect();
});

describe('Phiếu Xuất — DRAFT → PENDING → APPROVED → CONFIRMED', () => {
  let issueId: string;
  let itemId:  string;
  let qtyBeforeIssue: number;

  it('Setup: ghi nhớ tồn kho trước khi xuất', async () => {
    qtyBeforeIssue = await getClosingQty('TEST_RECV'); // 20 (vừa nhập)
    expect(qtyBeforeIssue).toBe(20);
  });

  it('✅ ACCOUNTANT tạo phiếu xuất → DRAFT', async () => {
    const res = await (await authed('accountant').post('/api/issues'))
      .send({
        issueDate:  '2026-05-18',
        recipient:  'Nguyễn Văn Test',
        department: 'Thi công A',
        items: [{ productId: ids['product_TEST_RECV'], requestedQty: 10 }],
      });

    const data = expectSuccess(res, 201);
    expect(data.status).toBe('DRAFT');
    expect(data.issueNo).toMatch(/^PX-\d{4}-\d+$/);
    issueId = data.id;
    itemId  = data.items[0].id;
  });

  it('🔒 Tồn kho CHƯA thay đổi sau CREATE', async () => {
    expect(await getClosingQty('TEST_RECV')).toBe(qtyBeforeIssue);
  });

  it('✅ ACCOUNTANT submit phiếu → PENDING', async () => {
    const res = await (await authed('accountant').post(`/api/issues/${issueId}/submit`)).send();
    expect(expectSuccess(res).status).toBe('PENDING');
  });

  it('🔒 Tồn kho CHƯA thay đổi sau SUBMIT', async () => {
    expect(await getClosingQty('TEST_RECV')).toBe(qtyBeforeIssue);
  });

  it('❌ STAFF không thể approve → 403', async () => {
    const res = await (await authed('staff').post(`/api/issues/${issueId}/approve`)).send();
    expectError(res, 'FORBIDDEN', 403);
  });

  it('✅ MANAGER approve phiếu → APPROVED', async () => {
    const res = await (await authed('manager').post(`/api/issues/${issueId}/approve`)).send();
    expect(expectSuccess(res).status).toBe('APPROVED');
  });

  it('🔒 Tồn kho CHƯA thay đổi sau APPROVE — ĐÂY LÀ ĐIỂM QUAN TRỌNG NHẤT', async () => {
    // Tồn kho chỉ thay đổi khi CONFIRM, không phải khi APPROVE
    expect(await getClosingQty('TEST_RECV')).toBe(qtyBeforeIssue);
  });

  it('❌ ACCOUNTANT không thể confirm → 403', async () => {
    const res = await (await authed('accountant').post(`/api/issues/${issueId}/confirm`))
      .send({ items: [{ itemId, actualQty: 8 }] });
    expectError(res, 'FORBIDDEN', 403);
  });

  it('✅ STAFF confirm với actual_qty = 8 (ít hơn requested_qty = 10)', async () => {
    const res = await (await authed('staff').post(`/api/issues/${issueId}/confirm`))
      .send({ items: [{ itemId, actualQty: 8 }] });

    const data = expectSuccess(res);
    expect(data.status).toBe('CONFIRMED');
    expect(data.confirmedBy).toBeDefined();

    const confirmedItem = data.items.find((i: any) => i.id === itemId);
    expect(Number(confirmedItem.actualQty)).toBe(8);
    expect(Number(confirmedItem.requestedQty)).toBe(10); // không thay đổi
  });

  it('✅ Tồn kho giảm đúng ACTUAL_QTY (8), không phải REQUESTED_QTY (10)', async () => {
    const newQty = await getClosingQty('TEST_RECV');
    expect(newQty).toBe(qtyBeforeIssue - 8); // 20 - 8 = 12
  });

  it('❌ Confirm lần 2 → 409 INVALID_STATUS_TRANSITION', async () => {
    const res = await (await authed('staff').post(`/api/issues/${issueId}/confirm`))
      .send({ items: [{ itemId, actualQty: 1 }] });
    expectError(res, 'INVALID_STATUS_TRANSITION', 409);
  });
});

describe('Phiếu Xuất — Edge case tồn kho', () => {

  it('❌ Xuất khi tồn = 0 → 409 INSUFFICIENT_STOCK', async () => {
    const res = await (await authed('accountant').post('/api/issues'))
      .send({
        issueDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ZERO'], requestedQty: 1 }],
      });
    expectError(res, 'INSUFFICIENT_STOCK', 409);
  });

  it('❌ Xuất qty > tồn → 409 INSUFFICIENT_STOCK', async () => {
    const currentQty = await getClosingQty('TEST_ON1'); // 30 từ seed
    const res = await (await authed('accountant').post('/api/issues'))
      .send({
        issueDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ON1'], requestedQty: currentQty + 100 }],
      });
    expectError(res, 'INSUFFICIENT_STOCK', 409);
  });

  it('❌ Approve phiếu còn DRAFT → 409 INVALID_STATUS_TRANSITION', async () => {
    const createRes = await (await authed('accountant').post('/api/issues'))
      .send({
        issueDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ON1'], requestedQty: 1 }],
      });
    const draft = expectSuccess(createRes, 201);

    const res = await (await authed('manager').post(`/api/issues/${draft.id}/approve`)).send();
    expectError(res, 'INVALID_STATUS_TRANSITION', 409);
  });
});

describe('Phiếu Xuất — Nhập → Xuất → Kiểm tra liên tiếp', () => {

  it('✅ Chuỗi nhập rồi xuất liên tiếp — tồn kho luôn chính xác', async () => {
    const productId = ids['product_TEST_T1'];
    const startQty = await getClosingQty('TEST_T1'); // 10 từ seed

    // Nhập 5
    await createAndApproveReceipt([{ productId, quantity: 5 }]);
    expect(await getClosingQty('TEST_T1')).toBe(startQty + 5); // 15

    // Xuất 3 (actual = 3)
    const issue1 = await (await authed('accountant').post('/api/issues'))
      .send({ issueDate: '2026-05-18', items: [{ productId, requestedQty: 3 }] });
    const i1 = expectSuccess(issue1, 201);
    await (await authed('accountant').post(`/api/issues/${i1.id}/submit`)).send();
    await (await authed('manager').post(`/api/issues/${i1.id}/approve`)).send();
    await (await authed('staff').post(`/api/issues/${i1.id}/confirm`))
      .send({ items: [{ itemId: i1.items[0].id, actualQty: 3 }] });
    expect(await getClosingQty('TEST_T1')).toBe(startQty + 5 - 3); // 12

    // Nhập thêm 8
    await createAndApproveReceipt([{ productId, quantity: 8 }]);
    expect(await getClosingQty('TEST_T1')).toBe(startQty + 5 - 3 + 8); // 20

    // Xuất 4 (actual = 2 — chỉ có 2 cái đạt chất lượng)
    const issue2 = await (await authed('accountant').post('/api/issues'))
      .send({ issueDate: '2026-05-18', items: [{ productId, requestedQty: 4 }] });
    const i2 = expectSuccess(issue2, 201);
    await (await authed('accountant').post(`/api/issues/${i2.id}/submit`)).send();
    await (await authed('manager').post(`/api/issues/${i2.id}/approve`)).send();
    await (await authed('staff').post(`/api/issues/${i2.id}/confirm`))
      .send({ items: [{ itemId: i2.items[0].id, actualQty: 2 }] }); // actual < requested
    expect(await getClosingQty('TEST_T1')).toBe(startQty + 5 - 3 + 8 - 2); // 18
  });
});
