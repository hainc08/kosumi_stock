# AGENTS.md — Hướng dẫn cho AI Agent / Codex

## ĐỌC FILE NÀY TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ

---

## 1. Thứ tự implement bắt buộc

```
Phase 1 — Database & Backend Core
  1.1  prisma/schema.prisma            ← DB schema đầy đủ
  1.2  prisma/seed.ts                  ← Seed data từ Excel
  1.3  src/config/                     ← env, db, constants
  1.4  src/types/                      ← roles, permissions, api types
  1.5  src/middleware/auth + rbac      ← JWT verify + permission check
  1.6  src/modules/auth/               ← login, refresh, logout
  1.7  src/modules/users/              ← CRUD users
  1.8  src/modules/products/           ← CRUD vật tư
  1.9  src/modules/inventory/          ← tồn kho, kỳ, low-stock
  1.10 src/modules/receipts/           ← phiếu nhập + approve flow
  1.11 src/modules/issues/             ← phiếu xuất + confirm flow
  1.12 src/modules/reports/            ← báo cáo + excel export

Phase 2 — Frontend
  2.1  src/lib/ + src/types/           ← api client, types
  2.2  src/stores/                     ← zustand stores
  2.3  src/hooks/                      ← react query hooks
  2.4  src/components/layout/          ← AppLayout, Sidebar, Topbar
  2.5  src/components/guards/          ← AuthGuard, RoleGuard
  2.6  src/components/shared/          ← DataTable, StatusBadge, ...
  2.7  src/pages/LoginPage             ← trang đăng nhập
  2.8  src/pages/DashboardPage         ← dashboard
  2.9  src/components/receipt/ + pages ← phiếu nhập
  2.10 src/components/issue/ + pages   ← phiếu xuất
  2.11 src/pages/InventoryPage         ← tồn kho
  2.12 src/pages/ReportsPage           ← báo cáo
  2.13 src/pages/UsersPage             ← quản lý user (ADMIN only)
```

---

## 2. Quy tắc nghiêm ngặt (KHÔNG được vi phạm)

### Backend
- **KHÔNG hardcode** role/permission trong controller body — luôn dùng `requirePermission(...)` middleware
- **KHÔNG thay đổi tồn kho** khi tạo phiếu — chỉ thay đổi khi `APPROVE` (nhập) hoặc `CONFIRM` (xuất)
- **LUÔN ghi audit_log** trong mọi mutation (POST/PUT/DELETE) — qua `auditMiddleware`
- **LUÔN wrap DB call** trong try/catch và trả về chuẩn response format
- **KHÔNG dùng raw SQL** — chỉ Prisma ORM
- **Validate input** bằng Zod trước khi vào service

### Frontend
- **KHÔNG gọi API trực tiếp** trong component — luôn qua hooks (`useReceipts`, v.v.)
- **KHÔNG store token** trong localStorage — dùng memory (Zustand) + httpOnly cookie cho refresh
- **KHÔNG render route** khi thiếu quyền — dùng `<RoleGuard permission="...">` wrapper
- **Validate xuất kho real-time**: hiển thị tồn kho hiện tại ngay khi chọn mã hàng, cảnh báo nếu qty > tồn

---

## 3. Business Logic quan trọng

### Vòng đời phiếu nhập (Receipt)
```
DRAFT → [submit] → PENDING → [approve] → APPROVED  ✅ cập nhật tồn kho +qty
                            → [reject]  → REJECTED
```

### Vòng đời phiếu xuất (Issue)
```
DRAFT → [submit] → PENDING → [approve] → APPROVED → [confirm_actual] → CONFIRMED  ✅ cập nhật tồn kho -actual_qty
                            → [reject]  → REJECTED
```

### Công thức tồn kho
```
closing_qty = opening_qty
            + SUM(approved receipt_items.quantity)
            - SUM(confirmed issue_items.actual_qty)
```

### Chuyển kỳ (Month rollover)
```
1. Lock kỳ hiện tại (is_closed = true)
2. Tạo inventory_periods mới
3. Copy closing_qty → opening_qty kỳ mới
4. Reset closing_qty = opening_qty (chưa có giao dịch)
```

---

## 4. Cấu trúc Response API chuẩn

```typescript
// Success
{ success: true, data: T, meta?: PaginationMeta, message: string }

// Error
{ success: false, error: { code: string, message: string }, data: null }

// Pagination meta
{ page: number, limit: number, total: number, totalPages: number }
```

### Error codes hay dùng
| Code | HTTP | Ý nghĩa |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Chưa đăng nhập |
| `FORBIDDEN` | 403 | Không đủ quyền |
| `NOT_FOUND` | 404 | Không tìm thấy |
| `VALIDATION_ERROR` | 422 | Dữ liệu đầu vào sai |
| `INSUFFICIENT_STOCK` | 409 | Không đủ hàng để xuất |
| `PERIOD_CLOSED` | 409 | Kỳ đã đóng, không thể sửa |
| `INVALID_STATUS_TRANSITION` | 409 | Phiếu không ở trạng thái phù hợp |
| `DUPLICATE_CODE` | 409 | Mã hàng đã tồn tại |

---

## 5. Phân quyền — Ma trận đầy đủ

| Permission | ADMIN | WH_MANAGER | ACCOUNTANT | WH_STAFF | VIEWER |
|------------|:-----:|:----------:|:----------:|:--------:|:------:|
| `inventory:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `receipt:create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `receipt:approve` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `issue:create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `issue:approve` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `issue:confirm_actual` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `report:export` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `product:manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `user:manage` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `system:config` | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 6. Môi trường & File cấu hình

- Backend env: `backend/.env` (copy từ `backend/.env.example`)
- Frontend env: `frontend/.env` (copy từ `frontend/.env.example`)
- Database: PostgreSQL, connection string trong `DATABASE_URL`
- Migrations: `cd backend && npx prisma migrate dev`
- Seed: `cd backend && npx ts-node prisma/seed.ts`
