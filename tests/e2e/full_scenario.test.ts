// tests/e2e/full_scenario.test.ts
// Kịch bản E2E xuyên suốt — mô phỏng 1 ngày làm việc thực tế
//
// Timeline:
//   Sáng: Kế toán tạo phiếu nhập → Manager duyệt → Tồn kho tăng
//   Trưa: Kế toán tạo 2 phiếu xuất → Manager duyệt → Staff xác nhận
//   Chiều: Xem báo cáo, kiểm tra số liệu khớp

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, resetDatabase, seedTestData, getClosingQty, ids } from '../integration/setup';
import { authed, expectSuccess, clearTokenCache } from '../integration/helpers';

beforeAll(async () => {
  await resetDatabase();
  await seedTestData();
});

afterAll(async () => {
  clearTokenCache();
  await prisma.$disconnect();
});

describe('E2E — Ngày làm việc đầy đủ (T5/2026)', () => {

  // ── Sáng: Nhập hàng ──────────────────────────────────────────────────────

  it('[08:00] Kế toán tạo phiếu nhập hàng buổi sáng', async () => {
    const res = await (await authed('accountant').post('/api/receipts'))
      .send({
        receiptDate: '2026-05-18',
        supplier: 'Thép Nam Vang',
        note: 'Nhập hàng buổi sáng T5',
        items: [
          { productId: ids['product_TEST_ON1'], quantity: 20, unitPrice: 0 },
          { productId: ids['product_TEST_T1'],  quantity: 10, unitPrice: 0 },
        ],
      });
    expect(expectSuccess(res, 201).status).toBe('DRAFT');
    (global as any).__morning_receipt_id = res.body.data.id;
  });

  it('[08:30] Kế toán submit phiếu nhập → Chờ duyệt', async () => {
    const id = (global as any).__morning_receipt_id;
    const res = await (await authed('accountant').post(`/api/receipts/${id}/submit`)).send();
    expect(expectSuccess(res).status).toBe('PENDING');
  });

  it('[09:00] Manager kiểm tra danh sách chờ duyệt', async () => {
    const res = await (await authed('manager').get('/api/receipts?status=PENDING')).send();
    const data = expectSuccess(res);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('[09:15] Manager duyệt phiếu nhập → Tồn kho tăng', async () => {
    const id = (global as any).__morning_receipt_id;
    const qtyBefore = await getClosingQty('TEST_ON1');
    const res = await (await authed('manager').post(`/api/receipts/${id}/approve`)).send();
    expect(expectSuccess(res).status).toBe('APPROVED');

    const qtyAfter = await getClosingQty('TEST_ON1');
    expect(qtyAfter).toBe(qtyBefore + 20);
    (global as any).__stock_after_morning_receipt = qtyAfter;
  });

  // ── Trưa: Xuất hàng ──────────────────────────────────────────────────────

  it('[11:00] Kế toán tạo phiếu xuất cho công trình A', async () => {
    const res = await (await authed('accountant').post('/api/issues'))
      .send({
        issueDate:  '2026-05-18',
        recipient:  'Nguyễn Văn Thi',
        department: 'Công trình A',
        items: [{ productId: ids['product_TEST_ON1'], requestedQty: 8 }],
      });
    expect(expectSuccess(res, 201).status).toBe('DRAFT');
    (global as any).__issue_A_id = res.body.data.id;
    (global as any).__issue_A_item_id = res.body.data.items[0].id;
  });

  it('[11:15] Kế toán tạo phiếu xuất cho công trình B', async () => {
    const res = await (await authed('accountant').post('/api/issues'))
      .send({
        issueDate:  '2026-05-18',
        recipient:  'Trần Văn Huy',
        department: 'Công trình B',
        items: [{ productId: ids['product_TEST_ON1'], requestedQty: 5 }],
      });
    expect(expectSuccess(res, 201).status).toBe('DRAFT');
    (global as any).__issue_B_id = res.body.data.id;
    (global as any).__issue_B_item_id = res.body.data.items[0].id;
  });

  it('[11:30] Tồn kho CHƯA thay đổi (các phiếu còn DRAFT)', async () => {
    const currentStock = await getClosingQty('TEST_ON1');
    expect(currentStock).toBe((global as any).__stock_after_morning_receipt);
  });

  it('[13:00] Submit cả 2 phiếu xuất', async () => {
    const idA = (global as any).__issue_A_id;
    const idB = (global as any).__issue_B_id;
    await (await authed('accountant').post(`/api/issues/${idA}/submit`)).send();
    await (await authed('accountant').post(`/api/issues/${idB}/submit`)).send();
  });

  it('[13:30] Manager duyệt cả 2 phiếu xuất', async () => {
    const idA = (global as any).__issue_A_id;
    const idB = (global as any).__issue_B_id;
    const r1 = await (await authed('manager').post(`/api/issues/${idA}/approve`)).send();
    const r2 = await (await authed('manager').post(`/api/issues/${idB}/approve`)).send();
    expect(expectSuccess(r1).status).toBe('APPROVED');
    expect(expectSuccess(r2).status).toBe('APPROVED');
  });

  it('[13:35] Tồn kho VẪN CHƯA thay đổi (chưa confirm thực tế)', async () => {
    const currentStock = await getClosingQty('TEST_ON1');
    expect(currentStock).toBe((global as any).__stock_after_morning_receipt);
  });

  it('[14:00] Staff xác nhận công trình A — thực tế xuất 7 (yêu cầu 8)', async () => {
    const idA = (global as any).__issue_A_id;
    const itemA = (global as any).__issue_A_item_id;
    const res = await (await authed('staff').post(`/api/issues/${idA}/confirm`))
      .send({ items: [{ itemId: itemA, actualQty: 7 }] }); // 1 cái bị lỗi, trả lại
    expect(expectSuccess(res).status).toBe('CONFIRMED');
  });

  it('[14:30] Staff xác nhận công trình B — thực tế xuất đúng 5', async () => {
    const idB = (global as any).__issue_B_id;
    const itemB = (global as any).__issue_B_item_id;
    const res = await (await authed('staff').post(`/api/issues/${idB}/confirm`))
      .send({ items: [{ itemId: itemB, actualQty: 5 }] });
    expect(expectSuccess(res).status).toBe('CONFIRMED');
  });

  it('[14:35] Tồn kho giảm đúng theo ACTUAL_QTY (7+5=12)', async () => {
    const stockAfterConfirm = await getClosingQty('TEST_ON1');
    const expectedStock = (global as any).__stock_after_morning_receipt - 7 - 5;
    expect(stockAfterConfirm).toBe(expectedStock);
    (global as any).__final_stock = stockAfterConfirm;
  });

  // ── Chiều: Báo cáo & Kiểm tra ────────────────────────────────────────────

  it('[16:00] Kế toán xem báo cáo tổng hợp tồn kho T5/2026', async () => {
    const res = await (await authed('accountant').get('/api/reports/inventory-summary?year=2026&month=5')).send();
    const data = expectSuccess(res);
    expect(data.rows).toBeDefined();
    expect(Array.isArray(data.rows)).toBe(true);

    const on1Row = data.rows.find((r: any) => r.code === 'TEST_ON1');
    expect(on1Row).toBeDefined();
    expect(on1Row.closingQty).toBe((global as any).__final_stock);
  });

  it('[16:30] Viewer xem được tồn kho nhưng không export được Excel → 403', async () => {
    const viewRes = await (await authed('viewer').get('/api/inventory')).send();
    expect(viewRes.status).toBe(200); // Xem được

    const exportRes = await (await authed('viewer').get('/api/reports/export/excel?year=2026&month=5')).send();
    expect(exportRes.status).toBe(403); // Không export được
  });

  it('[17:00] Admin xem audit log — đủ tất cả actions trong ngày', async () => {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'asc' },
    });
    const actions = logs.map((l) => l.action);
    expect(actions).toContain('CREATE_RECEIPT');
    expect(actions).toContain('SUBMIT_RECEIPT');
    expect(actions).toContain('APPROVE_RECEIPT');
    expect(actions).toContain('CREATE_ISSUE');
    expect(actions).toContain('SUBMIT_ISSUE');
    expect(actions).toContain('APPROVE_ISSUE');
    expect(actions).toContain('CONFIRM_ISSUE');
    console.log(`\n📋 Audit log: ${logs.length} entries ghi nhận trong ngày`);
    console.log(`   Tồn kho TEST_ON1 cuối ngày: ${(global as any).__final_stock}`);
  });

  it('[17:30] ✅ TỔNG KẾT: Số liệu tồn kho khớp với nghiệp vụ thực tế', async () => {
    const startQty     = 30;  // opening_qty từ fixture
    const received     = 20;  // nhập buổi sáng
    const issued_actual = 7 + 5; // xuất thực tế (A: 7, B: 5)
    const expected = startQty + received - issued_actual; // 30 + 20 - 12 = 38

    const actual = await getClosingQty('TEST_ON1');
    expect(actual).toBe(expected);
    expect(actual).toBe((global as any).__final_stock);
  });
});
