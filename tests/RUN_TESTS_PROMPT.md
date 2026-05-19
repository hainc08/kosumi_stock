# PROMPT GỬI CHO CODEX — Chạy Integration Tests WMS

## Yêu cầu

Chạy toàn bộ integration tests và e2e tests cho hệ thống WMS.
Báo cáo kết quả: số test pass, fail, và lý do fail nếu có.

---

## Bước 0 — Đọc file hướng dẫn trước

```
Read file: tests/TEST_AGENTS.md
Read file: tests/CODEX_PROMPT.md
```

---

## Bước 1 — Cài dependencies test

```bash
cd backend
npm install -D vitest supertest @faker-js/faker @types/supertest
```

---

## Bước 2 — Tạo test database

```bash
# Tạo DB riêng cho test (bắt buộc, không dùng chung DB thật)
createdb wms_test 2>/dev/null || echo "DB đã tồn tại, bỏ qua"

# Thêm dòng sau vào backend/.env nếu chưa có:
echo "DATABASE_URL_TEST=postgresql://wms_user:wms_secret@localhost:5432/wms_test" >> backend/.env

# Chạy migration trên test DB
cd backend
DATABASE_URL=postgresql://wms_user:wms_secret@localhost:5432/wms_test \
  npx prisma migrate deploy
```

---

## Bước 3 — Thêm test scripts vào backend/package.json

Mở `backend/package.json`, thêm vào `"scripts"`:

```json
"test":             "vitest run --config vitest.config.ts",
"test:integration": "vitest run --config vitest.config.ts --reporter=verbose ../tests/integration/",
"test:e2e":         "vitest run --config vitest.config.ts --reporter=verbose ../tests/e2e/",
"test:watch":       "vitest --config vitest.config.ts"
```

---

## Bước 4 — Chạy tests theo thứ tự

Chạy từng file một để dễ debug:

```bash
cd backend

# 1. Auth tests
DATABASE_URL_TEST=postgresql://wms_user:wms_secret@localhost:5432/wms_test \
  npx vitest run --config vitest.config.ts ../tests/integration/01_auth.test.ts

# 2. Receipt flow (CRITICAL — kiểm tra tồn kho)
DATABASE_URL_TEST=postgresql://wms_user:wms_secret@localhost:5432/wms_test \
  npx vitest run --config vitest.config.ts ../tests/integration/04_receipt_flow.test.ts

# 3. Issue flow (CRITICAL — kiểm tra actual_qty)
DATABASE_URL_TEST=postgresql://wms_user:wms_secret@localhost:5432/wms_test \
  npx vitest run --config vitest.config.ts ../tests/integration/05_issue_flow.test.ts

# 4. RBAC matrix
DATABASE_URL_TEST=postgresql://wms_user:wms_secret@localhost:5432/wms_test \
  npx vitest run --config vitest.config.ts ../tests/integration/06_rbac.test.ts

# 5. Edge cases
DATABASE_URL_TEST=postgresql://wms_user:wms_secret@localhost:5432/wms_test \
  npx vitest run --config vitest.config.ts ../tests/integration/08_edge_cases.test.ts

# 6. E2E full scenario
DATABASE_URL_TEST=postgresql://wms_user:wms_secret@localhost:5432/wms_test \
  npx vitest run --config vitest.config.ts ../tests/e2e/full_scenario.test.ts
```

Hoặc chạy tất cả 1 lần:

```bash
DATABASE_URL_TEST=postgresql://wms_user:wms_secret@localhost:5432/wms_test \
  bash tests/scripts/run-tests.sh all
```

---

## Bước 5 — Báo cáo kết quả

Sau khi chạy xong, tổng hợp theo format:

```
=== KẾT QUẢ TEST ===

01_auth.test.ts          ✅ 8/8 passed
04_receipt_flow.test.ts  ✅ 14/14 passed
05_issue_flow.test.ts    ✅ 12/12 passed
06_rbac.test.ts          ✅ 16/16 passed
08_edge_cases.test.ts    ✅ 11/11 passed
full_scenario.test.ts    ✅ 12/12 passed

TOTAL: 73/73 passed ✅

=== NẾU CÓ FAIL ===
[Tên test]  ❌
  - Expected: ...
  - Received: ...
  - Nguyên nhân có thể: ...
```

---

## Hướng dẫn debug khi test fail

| Test fail tại | Nguyên nhân thường gặp | Fix |
|---|---|---|
| `01_auth` — login thất bại | DB chưa seed hoặc sai DATABASE_URL_TEST | Chạy lại `prisma migrate deploy` với đúng DB |
| `04_receipt` — "tồn kho CHƯA thay đổi" sau CREATE | `receipts.service.ts` đang cập nhật tồn kho khi CREATE thay vì APPROVE | Chuyển logic cập nhật inventory vào hàm `approveReceipt()` |
| `05_issue` — "tồn kho giảm theo actual_qty" fail | Service dùng `requestedQty` thay vì `actualQty` khi CONFIRM | Trong `confirmIssue()`, dùng `confirm.actualQty` để decrement |
| `06_rbac` — role bị sai quyền | `ROLE_PERMISSIONS` trong `types/roles.ts` sai | So sánh với bảng trong `docs/AGENTS.md §5` |
| `08_edge_cases` — INSUFFICIENT_STOCK không trả về | Service không validate stock trước khi tạo issue | Thêm check trong `createIssue()` trước khi `prisma.issue.create` |
| Bất kỳ test nào — `Cannot find module` | Chưa build hoặc path sai | Kiểm tra `tsconfig.json` và `vitest.config.ts` |
| Bất kỳ test nào — connection refused | PostgreSQL không chạy hoặc sai host | `pg_isready -h localhost -p 5432` |
