# PROMPT GỬI CHO CODEX — Implement Integration Tests

## Bước 1: Đọc trước (bắt buộc)

```
Read these files in order:
1. tests/TEST_AGENTS.md         ← Kiến trúc test, quy tắc, thứ tự
2. tests/fixtures/users.json    ← Tài khoản test
3. tests/fixtures/products.json ← Vật tư test
4. tests/fixtures/scenarios.json ← Kịch bản nghiệp vụ
5. tests/integration/setup.ts   ← DB reset + seed
6. tests/integration/helpers.ts ← loginAs(), expectSuccess(), v.v.
```

## Bước 2: Cài dependencies

```bash
cd backend
npm install -D vitest supertest @faker-js/faker @types/supertest
```

## Bước 3: Thêm scripts vào backend/package.json

```json
"scripts": {
  "test":            "vitest run --config vitest.config.ts",
  "test:watch":      "vitest --config vitest.config.ts",
  "test:integration": "vitest run ../tests/integration/ --config vitest.config.ts",
  "test:e2e":        "vitest run ../tests/e2e/ --config vitest.config.ts",
  "test:coverage":   "vitest run --coverage --config vitest.config.ts"
}
```

## Bước 4: Setup test database

```bash
# Tạo database riêng cho test (QUAN TRỌNG: không dùng chung với DB thật)
createdb wms_test

# Thêm vào backend/.env
DATABASE_URL_TEST=postgresql://wms_user:wms_secret@localhost:5432/wms_test

# Run migrations
DATABASE_URL=$DATABASE_URL_TEST npx prisma migrate deploy
```

## Bước 5: Chạy tests theo thứ tự

```bash
# Chạy từng file để debug
npx vitest run tests/integration/01_auth.test.ts
npx vitest run tests/integration/04_receipt_flow.test.ts
npx vitest run tests/integration/05_issue_flow.test.ts
npx vitest run tests/integration/06_rbac.test.ts
npx vitest run tests/integration/08_edge_cases.test.ts

# Chạy tất cả
bash tests/scripts/run-tests.sh all

# Chạy E2E
npx vitest run tests/e2e/full_scenario.test.ts
```

## Bước 6: Implement test còn thiếu (nếu cần)

Các test files chưa có, Codex cần implement:
- `tests/integration/02_products.test.ts` — CRUD vật tư
- `tests/integration/03_inventory.test.ts` — Tồn kho, kỳ, low-stock
- `tests/integration/07_reports.test.ts` — Báo cáo, Excel export

## Quy tắc KHÔNG được vi phạm khi implement tests

1. KHÔNG mock Prisma — test phải dùng DB thật (DATABASE_URL_TEST)
2. KHÔNG share state giữa describe blocks — mỗi suite reset DB riêng
3. KHÔNG hardcode UUID — lấy ID từ response của API
4. PHẢI test cả happy path + error path
5. PHẢI kiểm tra tồn kho trước VÀ sau mỗi APPROVE/CONFIRM
6. Thứ tự test trong 1 describe: CREATE → SUBMIT → APPROVE/CONFIRM → verify inventory

## Expected output khi tests pass

```
✓ tests/integration/01_auth.test.ts (8 tests)
✓ tests/integration/04_receipt_flow.test.ts (14 tests)
✓ tests/integration/05_issue_flow.test.ts (12 tests)
✓ tests/integration/06_rbac.test.ts (16 tests)
✓ tests/integration/08_edge_cases.test.ts (11 tests)
✓ tests/e2e/full_scenario.test.ts (12 tests)

Test Files  6 passed (6)
Tests      73 passed (73)
```

## Nếu test fail, debug theo thứ tự

1. `01_auth` fail → Backend chưa chạy hoặc DB chưa migrate
2. `04_receipt` fail ở "tồn kho CHƯA thay đổi" → Service đang cập nhật tồn sai lúc CREATE thay vì APPROVE
3. `05_issue` fail ở "actual_qty" → Service đang dùng requestedQty thay vì actualQty khi CONFIRM
4. `06_rbac` fail → ROLE_PERMISSIONS trong types/roles.ts sai
5. `08_edge_cases` fail ở INSUFFICIENT_STOCK → Service chưa validate trước khi tạo phiếu xuất
