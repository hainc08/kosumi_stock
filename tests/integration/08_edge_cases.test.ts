// tests/integration/08_edge_cases.test.ts
// Kiểm tra các trường hợp biên và lỗi nghiệp vụ

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, resetDatabase, seedTestData, getClosingQty, ids } from './setup';
import { authed, expectSuccess, expectError, createAndApproveReceipt, clearTokenCache } from './helpers';

beforeAll(async () => {
  await resetDatabase();
  await seedTestData();
  // Nhập hàng để có tồn
  await createAndApproveReceipt([{ productId: ids['product_TEST_ON1'], quantity: 30 }]);
});

afterAll(async () => {
  clearTokenCache();
  await prisma.$disconnect();
});

describe('Edge Cases — Validation', () => {

  it('❌ Tạo phiếu nhập với items = [] → 422 VALIDATION_ERROR', async () => {
    const res = await (await authed('accountant').post('/api/receipts'))
      .send({ receiptDate: '2026-05-18', items: [] });
    expectError(res, 'VALIDATION_ERROR', 422);
  });

  it('❌ Tạo phiếu nhập thiếu receiptDate → 422', async () => {
    const res = await (await authed('accountant').post('/api/receipts'))
      .send({ items: [{ productId: ids['product_TEST_ON1'], quantity: 1 }] });
    expectError(res, 'VALIDATION_ERROR', 422);
  });

  it('❌ Tạo phiếu nhập với quantity = 0 → 422', async () => {
    const res = await (await authed('accountant').post('/api/receipts'))
      .send({
        receiptDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ON1'], quantity: 0 }],
      });
    expectError(res, 'VALIDATION_ERROR', 422);
  });

  it('❌ Tạo phiếu nhập với quantity âm → 422', async () => {
    const res = await (await authed('accountant').post('/api/receipts'))
      .send({
        receiptDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ON1'], quantity: -5 }],
      });
    expectError(res, 'VALIDATION_ERROR', 422);
  });
});

describe('Edge Cases — Insufficient Stock', () => {

  it('❌ Xuất kho khi tồn = 0 → 409 INSUFFICIENT_STOCK', async () => {
    const res = await (await authed('accountant').post('/api/issues'))
      .send({
        issueDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ZERO'], requestedQty: 1 }],
      });
    expectError(res, 'INSUFFICIENT_STOCK', 409);
    expect(res.body.error.message).toContain('TEST_ZERO'.toLowerCase().replace('_', '')); // mention product
  });

  it('❌ Xuất kho vượt tồn → 409 INSUFFICIENT_STOCK', async () => {
    const currentStock = await getClosingQty('TEST_LOW'); // = 3
    const res = await (await authed('accountant').post('/api/issues'))
      .send({
        issueDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_LOW'], requestedQty: currentStock + 1 }],
      });
    expectError(res, 'INSUFFICIENT_STOCK', 409);
  });

  it('✅ Xuất kho đúng bằng tồn → thành công', async () => {
    const currentStock = await getClosingQty('TEST_LOW'); // = 3
    const res = await (await authed('accountant').post('/api/issues'))
      .send({
        issueDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_LOW'], requestedQty: currentStock }],
      });
    expectSuccess(res, 201); // Phải thành công
  });
});

describe('Edge Cases — Status Transitions', () => {
  let draftReceiptId: string;
  let approvedReceiptId: string;

  beforeAll(async () => {
    // Draft receipt
    const r1 = await (await authed('accountant').post('/api/receipts'))
      .send({
        receiptDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ON1'], quantity: 1, unitPrice: 0 }],
      });
    draftReceiptId = r1.body.data.id;

    // Approved receipt
    const r2 = await (await authed('accountant').post('/api/receipts'))
      .send({
        receiptDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ON1'], quantity: 1, unitPrice: 0 }],
      });
    approvedReceiptId = r2.body.data.id;
    await (await authed('accountant').post(`/api/receipts/${approvedReceiptId}/submit`)).send();
    await (await authed('manager').post(`/api/receipts/${approvedReceiptId}/approve`)).send();
  });

  it('❌ Approve phiếu nhập còn DRAFT (chưa submit) → 409', async () => {
    const res = await (await authed('manager').post(`/api/receipts/${draftReceiptId}/approve`)).send();
    expectError(res, 'INVALID_STATUS_TRANSITION', 409);
  });

  it('❌ Submit phiếu nhập đã APPROVED → 409', async () => {
    const res = await (await authed('accountant').post(`/api/receipts/${approvedReceiptId}/submit`)).send();
    expectError(res, 'INVALID_STATUS_TRANSITION', 409);
  });

  it('❌ Approve phiếu nhập đã APPROVED (double approve) → 409', async () => {
    const res = await (await authed('manager').post(`/api/receipts/${approvedReceiptId}/approve`)).send();
    expectError(res, 'INVALID_STATUS_TRANSITION', 409);
  });

  it('❌ Sửa phiếu nhập đã APPROVED → 409', async () => {
    const res = await (await authed('accountant').put(`/api/receipts/${approvedReceiptId}`))
      .send({ supplier: 'Hacked Supplier' });
    expectError(res, 'INVALID_STATUS_TRANSITION', 409);
  });

  it('❌ Xóa phiếu nhập đã APPROVED → 409', async () => {
    const res = await (await authed('accountant').delete(`/api/receipts/${approvedReceiptId}`)).send();
    expectError(res, 'INVALID_STATUS_TRANSITION', 409);
  });

  it('✅ Xóa phiếu nhập còn DRAFT → thành công', async () => {
    // Tạo 1 draft mới để xóa
    const r = await (await authed('accountant').post('/api/receipts'))
      .send({
        receiptDate: '2026-05-18',
        items: [{ productId: ids['product_TEST_ON1'], quantity: 1, unitPrice: 0 }],
      });
    const toDeleteId = r.body.data.id;
    const deleteRes = await (await authed('accountant').delete(`/api/receipts/${toDeleteId}`)).send();
    expectSuccess(deleteRes);
  });
});

describe('Edge Cases — Not Found', () => {

  it('❌ GET phiếu nhập không tồn tại → 404', async () => {
    const res = await (await authed('admin').get('/api/receipts/00000000-0000-0000-0000-000000000000')).send();
    expectError(res, 'NOT_FOUND', 404);
  });

  it('❌ GET phiếu xuất không tồn tại → 404', async () => {
    const res = await (await authed('admin').get('/api/issues/00000000-0000-0000-0000-000000000000')).send();
    expectError(res, 'NOT_FOUND', 404);
  });
});

describe('Edge Cases — Duplicate', () => {

  it('❌ Tạo vật tư với mã đã tồn tại → 409 DUPLICATE_CODE', async () => {
    // Tạo lần 1
    await (await authed('manager').post('/api/products'))
      .send({ code: 'DUP_TEST_001', name: 'Hàng dup test', unit: 'cái' });

    // Tạo lần 2 cùng code
    const res = await (await authed('manager').post('/api/products'))
      .send({ code: 'DUP_TEST_001', name: 'Hàng dup khác', unit: 'kg' });
    expectError(res, 'DUPLICATE_CODE', 409);
  });
});
