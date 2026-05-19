# TEST_AGENTS.md — Hướng dẫn viết & chạy Integration Tests
> Đọc file này trước khi implement bất kỳ test nào

---

## 1. Kiến trúc test

```
tests/
├── TEST_AGENTS.md              ← File này — đọc trước
├── fixtures/
│   ├── users.json              ← Tài khoản test cho từng role
│   ├── products.json           ← Vật tư test (subset từ seed)
│   └── scenarios.json          ← Kịch bản luồng đầy đủ
├── integration/
│   ├── setup.ts                ← DB reset + seed trước mỗi test suite
│   ├── helpers.ts              ← loginAs(), expectSuccess(), expectError()
│   ├── 01_auth.test.ts         ← Đăng nhập, refresh, phân quyền
│   ├── 02_products.test.ts     ← CRUD vật tư
│   ├── 03_inventory.test.ts    ← Tồn kho, kỳ, low-stock
│   ├── 04_receipt_flow.test.ts ← Luồng nhập kho đầy đủ DRAFT→APPROVED
│   ├── 05_issue_flow.test.ts   ← Luồng xuất kho đầy đủ DRAFT→CONFIRMED
│   ├── 06_rbac.test.ts         ← Kiểm tra phân quyền từng role
│   ├── 07_reports.test.ts      ← Báo cáo tồn kho, export
│   └── 08_edge_cases.test.ts   ← Stock insufficient, period closed, v.v.
├── e2e/
│   └── full_scenario.test.ts   ← 1 luồng xuyên suốt từ đầu tới cuối
└── scripts/
    ├── run-tests.sh            ← Script chạy toàn bộ
    └── reset-db.ts             ← Reset DB về trạng thái seed
```

---

## 2. Tech stack test

| Tool | Mục đích |
|------|---------|
| **Vitest** | Test runner (nhanh hơn Jest, native TypeScript) |
| **Supertest** | HTTP assertions cho Express |
| **@faker-js/faker** | Generate dữ liệu ngẫu nhiên |
| **Prisma** | Reset DB trong `beforeEach` |

Cài đặt:
```bash
cd backend
npm install -D vitest supertest @faker-js/faker @types/supertest
```

---

## 3. Quy tắc viết test

### PHẢI làm
- **Reset DB** trước mỗi test suite (`beforeAll` → `resetDatabase()`)
- **Đăng nhập** lấy token thực từ API, không mock JWT
- **Test theo thứ tự nghiệp vụ** — không test approve trước khi có phiếu PENDING
- **Kiểm tra tồn kho** sau mỗi APPROVE/CONFIRM — đây là logic quan trọng nhất
- **Test cả happy path lẫn error path** cho mỗi endpoint

### KHÔNG làm
- Không mock Prisma — test phải chạy với DB thật (test database)
- Không share state giữa các `describe` block
- Không hardcode UUID — dùng ID lấy từ response của API
- Không test frontend trong integration tests

---

## 4. Luồng nghiệp vụ cần test (theo thứ tự ưu tiên)

### Luồng A — Nhập kho hoàn chỉnh (CRITICAL)
```
1. ACCOUNTANT tạo phiếu nhập (DRAFT)
2. Kiểm tra: tồn kho CHƯA thay đổi
3. ACCOUNTANT submit phiếu (PENDING)
4. WAREHOUSE_MANAGER approve (APPROVED)
5. Kiểm tra: tồn kho ĐÃ tăng đúng số lượng
6. Kiểm tra: audit_log có ghi đúng
```

### Luồng B — Xuất kho hoàn chỉnh (CRITICAL)
```
1. ACCOUNTANT tạo phiếu xuất (DRAFT)
2. Kiểm tra: tồn kho CHƯA thay đổi
3. ACCOUNTANT submit (PENDING)
4. WAREHOUSE_MANAGER approve (APPROVED)
5. Kiểm tra: tồn kho CHƯA thay đổi (chỉ thay đổi khi CONFIRM)
6. WAREHOUSE_STAFF confirm với actual_qty
7. Kiểm tra: tồn kho ĐÃ giảm đúng actual_qty (không phải requested_qty)
```

### Luồng C — RBAC (CRITICAL)
```
Mỗi endpoint test với VIEWER → expect 403
Mỗi endpoint test không có token → expect 401
```

### Luồng D — Edge cases (IMPORTANT)
```
- Xuất kho khi tồn = 0 → expect 409 INSUFFICIENT_STOCK
- Xuất kho qty > tồn → expect 409 INSUFFICIENT_STOCK
- Approve phiếu đã APPROVED → expect 409 INVALID_STATUS_TRANSITION
- Sửa phiếu đã APPROVED → expect 409
```

---

## 5. Database test isolation

```typescript
// Dùng database riêng cho test — KHÔNG dùng database production
// DATABASE_URL_TEST=postgresql://wms_user:secret@localhost:5432/wms_test

// Trong setup.ts:
beforeAll(async () => {
  await resetDatabase();   // xóa data, giữ schema
  await seedTestData();    // seed fixtures/
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

---

## 6. Mapping fixture → test expectation

| Fixture | Dùng để test |
|---------|-------------|
| `users.json` | Token cho từng role, test RBAC |
| `products.json` | productId trong phiếu nhập/xuất |
| `scenarios.json` | Kịch bản đầy đủ với expected results |
