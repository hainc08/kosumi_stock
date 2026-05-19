# FEATURE PROMPT — Xin phép xuất kho (Issue Request)
# Gửi nguyên file này cho Codex

---

## Đọc trước khi làm

```
Read file: docs/AGENTS.md          ← Hiểu toàn bộ hệ thống
Read file: backend/src/types/roles.ts
Read file: backend/prisma/schema.prisma
Read file: backend/src/modules/issues/issues.service.ts
Read file: backend/src/modules/issues/issues.routes.ts
Read file: frontend/src/components/issue/IssueForm.tsx
Read file: frontend/src/pages/IssuesPage.tsx
```

---

## Tổng quan tính năng

Hiện tại **WAREHOUSE_STAFF không tạo được phiếu xuất** — chỉ ACCOUNTANT mới tạo được.

Tính năng mới: Nhân viên kho (WAREHOUSE_STAFF) được phép **xin phép xuất kho**
thông qua một form đơn giản. Yêu cầu này tạo ra một **IssueRequest** riêng (không
phải Issue), hiển thị trong **notification bell** và **danh sách chờ duyệt** của
ADMIN / WAREHOUSE_MANAGER. Người có quyền duyệt → tạo Issue thật → luồng cũ tiếp tục bình thường.

---

## Luồng nghiệp vụ mới

```
WAREHOUSE_STAFF điền form xin xuất
        ↓
IssueRequest tạo ra (status: PENDING_APPROVAL)
        ↓
Notification gửi đến ADMIN + WAREHOUSE_MANAGER
        ↓
        ├─ [Duyệt] → tự động tạo Issue (DRAFT) → submit → vào luồng cũ
        └─ [Từ chối] → IssueRequest (status: REJECTED) + notify lại STAFF
```

**Luồng Issue cũ KHÔNG thay đổi** — ACCOUNTANT vẫn tạo Issue bình thường như trước.

---

## Phần 1 — DATABASE (Prisma)

### 1.1 Thêm model `IssueRequest` vào `backend/prisma/schema.prisma`

```prisma
enum IssueRequestStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
}

model IssueRequest {
  id          String             @id @default(uuid())
  requestNo   String             @unique @map("request_no") @db.VarChar(20)
  periodId    String?            @map("period_id")
  requestDate DateTime           @map("request_date") @db.Date
  reason      String?            @db.Text          // Lý do xin xuất
  note        String?            @db.Text
  status      IssueRequestStatus @default(PENDING_APPROVAL)

  requestedById String  @map("requested_by")       // WAREHOUSE_STAFF
  reviewedById  String? @map("reviewed_by")        // ADMIN hoặc WAREHOUSE_MANAGER
  reviewedAt    DateTime? @map("reviewed_at") @db.Timestamptz
  rejectReason  String?  @map("reject_reason") @db.Text

  // Khi APPROVED → tạo Issue, lưu lại liên kết
  issueId     String? @unique @map("issue_id")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt      @map("updated_at") @db.Timestamptz

  period      InventoryPeriod? @relation(fields: [periodId], references: [id])
  requestedBy User             @relation("IssueRequestedBy", fields: [requestedById], references: [id])
  reviewedBy  User?            @relation("IssueReviewedBy", fields: [reviewedById], references: [id])
  issue       Issue?           @relation(fields: [issueId], references: [id])
  items       IssueRequestItem[]

  @@map("issue_requests")
}

model IssueRequestItem {
  id               String  @id @default(uuid())
  issueRequestId   String  @map("issue_request_id")
  productId        String  @map("product_id")
  requestedQty     Decimal @map("requested_qty") @db.Decimal(12, 2)
  note             String? @db.VarChar(200)       // ghi chú từng dòng hàng

  issueRequest IssueRequest @relation(fields: [issueRequestId], references: [id], onDelete: Cascade)
  product      Product      @relation(fields: [productId], references: [id])

  @@map("issue_request_items")
}
```

### 1.2 Thêm relation ngược vào các model có sẵn

Trong model `User`, thêm:
```prisma
requestedIssues  IssueRequest[] @relation("IssueRequestedBy")
reviewedIssues   IssueRequest[] @relation("IssueReviewedBy")
```

Trong model `Issue`, thêm:
```prisma
issueRequest IssueRequest?
```

Trong model `Product`, thêm:
```prisma
issueRequestItems IssueRequestItem[]
```

### 1.3 Thêm model `Notification`

```prisma
enum NotificationType {
  ISSUE_REQUEST_NEW       // Có yêu cầu xin xuất mới
  ISSUE_REQUEST_APPROVED  // Yêu cầu được duyệt
  ISSUE_REQUEST_REJECTED  // Yêu cầu bị từ chối
}

model Notification {
  id         String           @id @default(uuid())
  userId     String           @map("user_id")       // người nhận
  type       NotificationType
  title      String           @db.VarChar(200)
  message    String           @db.Text
  isRead     Boolean          @default(false) @map("is_read")
  entityId   String?          @map("entity_id")     // IssueRequest.id
  entityType String?          @map("entity_type")   // "issue_request"
  createdAt  DateTime         @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id])

  @@map("notifications")
}
```

Trong model `User`, thêm:
```prisma
notifications Notification[]
```

### 1.4 Chạy migration

```bash
cd backend
npx prisma migrate dev --name add_issue_request_and_notifications
```

---

## Phần 2 — BACKEND

### 2.1 Cập nhật Permission (thêm vào `backend/src/types/roles.ts`)

```typescript
// Thêm vào enum Permission:
ISSUE_REQUEST_CREATE = 'issue_request:create',  // WAREHOUSE_STAFF tạo yêu cầu
ISSUE_REQUEST_REVIEW = 'issue_request:review',  // ADMIN + MANAGER duyệt/từ chối
NOTIFICATION_READ    = 'notification:read',      // Tất cả roles

// Cập nhật ROLE_PERMISSIONS:
[Role.WAREHOUSE_STAFF]: [
  Permission.INVENTORY_READ,
  Permission.ISSUE_CONFIRM,
  Permission.ISSUE_REQUEST_CREATE,  // ← THÊM MỚI
  Permission.NOTIFICATION_READ,     // ← THÊM MỚI
],

[Role.ADMIN]: Object.values(Permission),  // tự động có tất cả

[Role.WAREHOUSE_MANAGER]: [
  // ... giữ nguyên các permission cũ, thêm:
  Permission.ISSUE_REQUEST_REVIEW,
  Permission.NOTIFICATION_READ,
],
```

Đồng bộ y hệt sang `frontend/src/types/roles.ts`.

### 2.2 Tạo module `backend/src/modules/issue-requests/`

Tạo 4 files: `schema.ts`, `service.ts`, `controller.ts`, `routes.ts`

#### `issue-requests/schema.ts`

```typescript
import { z } from 'zod';

const itemSchema = z.object({
  productId:   z.string().uuid(),
  requestedQty: z.number().positive('Số lượng phải > 0'),
  note:        z.string().max(200).optional(),
});

export const createIssueRequestSchema = z.object({
  requestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason:      z.string().min(1, 'Vui lòng nhập lý do xin xuất').max(500),
  note:        z.string().optional(),
  items:       z.array(itemSchema).min(1, 'Cần ít nhất 1 mặt hàng'),
});

export const rejectRequestSchema = z.object({
  rejectReason: z.string().min(1, 'Vui lòng nhập lý do từ chối'),
});

export type CreateIssueRequestDto = z.infer<typeof createIssueRequestSchema>;
```

#### `issue-requests/service.ts`

Implement các hàm:

**`createIssueRequest(dto, userId)`**
- Sinh `requestNo` theo format `XK-2026-001` (XK = Xin Kho)
- Validate: kiểm tra sơ bộ tồn kho (cảnh báo nếu thiếu, không chặn)
- Tạo `IssueRequest` + `IssueRequestItem[]`
- Gọi `notifyReviewers()` để tạo Notification cho tất cả ADMIN và WAREHOUSE_MANAGER
- Ghi `audit_log` action: `CREATE_ISSUE_REQUEST`

**`listIssueRequests(query, callerRole, callerId)`**
- Nếu `callerRole === WAREHOUSE_STAFF`: chỉ trả về request của chính họ
- Nếu ADMIN hoặc WAREHOUSE_MANAGER: trả về tất cả, filter theo `status`
- Include: `requestedBy`, `reviewedBy`, `items.product`, `issue`

**`approveIssueRequest(id, reviewerId)`**
- Kiểm tra `status === PENDING_APPROVAL`
- Transaction:
  1. Cập nhật `IssueRequest` → `APPROVED`, lưu `reviewedById`, `reviewedAt`
  2. Tự động tạo `Issue` (status: `DRAFT`) từ dữ liệu request
  3. Lưu `issueId` vào `IssueRequest`
  4. Tạo Notification cho WAREHOUSE_STAFF người đã xin: "Yêu cầu xuất kho của bạn đã được duyệt"
- Ghi audit log: `APPROVE_ISSUE_REQUEST`
- **Trả về cả `issue` mới tạo** để frontend redirect

**`rejectIssueRequest(id, reviewerId, rejectReason)`**
- Cập nhật `status → REJECTED`, lưu `rejectReason`
- Tạo Notification cho STAFF: "Yêu cầu xuất kho bị từ chối: [lý do]"
- Ghi audit log: `REJECT_ISSUE_REQUEST`

**`notifyReviewers(issueRequestId, requestedByName)`** (private helper)
- Query tất cả users có role `ADMIN` hoặc `WAREHOUSE_MANAGER` và `isActive: true`
- Batch create Notification cho từng người:
  ```
  type:    ISSUE_REQUEST_NEW
  title:   "Yêu cầu xuất kho mới"
  message: "[Tên nhân viên] xin xuất kho — [số dòng hàng] mặt hàng"
  entityId: issueRequestId
  entityType: "issue_request"
  ```

#### `issue-requests/controller.ts`

Wrap các hàm service, dùng pattern handle() giống các module khác.

#### `issue-requests/routes.ts`

```typescript
// GET    /api/issue-requests        — list (STAFF thấy của mình, MANAGER/ADMIN thấy tất cả)
// POST   /api/issue-requests        — tạo yêu cầu (WAREHOUSE_STAFF)
// GET    /api/issue-requests/:id    — chi tiết
// POST   /api/issue-requests/:id/approve — duyệt (WAREHOUSE_MANAGER, ADMIN)
// POST   /api/issue-requests/:id/reject  — từ chối (WAREHOUSE_MANAGER, ADMIN)
```

### 2.3 Tạo module `backend/src/modules/notifications/`

#### `notifications/routes.ts`

```typescript
// GET  /api/notifications           — lấy notifications của user hiện tại (tất cả roles)
// GET  /api/notifications/unread-count — số notification chưa đọc (dùng cho bell badge)
// PUT  /api/notifications/:id/read  — đánh dấu 1 notification đã đọc
// PUT  /api/notifications/read-all  — đánh dấu tất cả đã đọc
```

Logic trong service:
- `getMyNotifications(userId)`: lấy 20 notification gần nhất của user, order by `createdAt desc`
- `getUnreadCount(userId)`: `count where userId = ? AND isRead = false`
- `markRead(id, userId)`: update `isRead = true`, validate `userId` khớp (không đọc của người khác)
- `markAllRead(userId)`: `updateMany where userId = ? AND isRead = false`

### 2.4 Đăng ký routes mới vào `backend/src/app.ts`

```typescript
import issueRequestRoutes from './modules/issue-requests/issue-requests.routes';
import notificationRoutes from './modules/notifications/notifications.routes';

app.use('/api/issue-requests', issueRequestRoutes);
app.use('/api/notifications',  notificationRoutes);
```

### 2.5 Sinh số thứ tự request (`backend/src/utils/generateCode.ts`)

Thêm hàm:
```typescript
export async function generateRequestNo(): Promise<string> {
  const year  = new Date().getFullYear();
  const count = await prisma.issueRequest.count({
    where: { requestNo: { startsWith: `XK-${year}-` } },
  });
  return `XK-${year}-${String(count + 1).padStart(3, '0')}`;
}
```

---

## Phần 3 — FRONTEND

### 3.1 Thêm types vào `frontend/src/types/models.ts`

```typescript
export type IssueRequestStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface IssueRequestItem {
  id:           string;
  productId:    string;
  requestedQty: number;
  note?:        string;
  product:      Product;
}

export interface IssueRequest {
  id:           string;
  requestNo:    string;
  requestDate:  string;
  reason:       string;
  note?:        string;
  status:       IssueRequestStatus;
  requestedBy:  { fullName: string; role: Role };
  reviewedBy?:  { fullName: string };
  reviewedAt?:  string;
  rejectReason?: string;
  issue?:       { id: string; issueNo: string };
  items:        IssueRequestItem[];
  createdAt:    string;
}

export interface Notification {
  id:         string;
  type:       'ISSUE_REQUEST_NEW' | 'ISSUE_REQUEST_APPROVED' | 'ISSUE_REQUEST_REJECTED';
  title:      string;
  message:    string;
  isRead:     boolean;
  entityId?:  string;
  entityType?: string;
  createdAt:  string;
}
```

### 3.2 Cập nhật `frontend/src/types/roles.ts`

Thêm vào enum Permission (đồng bộ với backend):
```typescript
ISSUE_REQUEST_CREATE = 'issue_request:create',
ISSUE_REQUEST_REVIEW = 'issue_request:review',
NOTIFICATION_READ    = 'notification:read',
```

Cập nhật ROLE_PERMISSIONS tương ứng.

### 3.3 Tạo hooks

**`frontend/src/hooks/useIssueRequests.ts`**

```typescript
// useIssueRequests(params)   — list
// useIssueRequest(id)        — chi tiết
// useCreateIssueRequest()    — mutation tạo
// useApproveRequest()        — mutation duyệt
// useRejectRequest()         — mutation từ chối
```

**`frontend/src/hooks/useNotifications.ts`**

```typescript
// useNotifications()         — list 20 gần nhất
// useUnreadCount()           — số chưa đọc, refetchInterval: 30_000
// useMarkRead()              — mutation đọc 1
// useMarkAllRead()           — mutation đọc tất cả
```

### 3.4 Component NotificationBell

Tạo `frontend/src/components/layout/NotificationBell.tsx`

- Hiển thị icon chuông ở góc phải Topbar
- Badge đỏ hiển thị số chưa đọc (`useUnreadCount()`, poll mỗi 30s)
- Click mở dropdown danh sách 20 notification gần nhất
- Mỗi item: title, message, thời gian (format "5 phút trước"), chấm xanh nếu chưa đọc
- Click vào item: `markRead(id)` → navigate đến trang liên quan nếu là ISSUE_REQUEST
- Nút "Đánh dấu tất cả đã đọc" ở cuối dropdown

Tích hợp vào `frontend/src/components/layout/Topbar.tsx`:
```tsx
// Thêm <NotificationBell /> vào phần topbar-actions, trước các nút Nhập/Xuất kho
```

### 3.5 Component IssueRequestForm

Tạo `frontend/src/components/issue-request/IssueRequestForm.tsx`

Form dành cho WAREHOUSE_STAFF:
- **Ngày xin xuất** (date picker)
- **Lý do xuất kho** (textarea, bắt buộc, max 500 ký tự) — ví dụ: "Vật tư cho công trình đường Nguyễn Huệ"
- **Ghi chú thêm** (optional)
- **Bảng hàng hóa** (multi-row giống IssueForm):
  - Cột: Mã hàng (dropdown), Tên (auto), ĐVT (auto), Tồn hiện tại (auto, màu xanh/đỏ), Số lượng xin, Ghi chú dòng
  - Tồn kho hiển thị real-time khi chọn mã hàng (dùng `useInventory()`)
  - Cảnh báo vàng nếu số lượng > tồn (không chặn submit — chỉ cảnh báo vì có thể sẽ nhập thêm)
- Submit button: "Gửi yêu cầu xuất kho"
- Sau submit thành công: hiển thị toast "Đã gửi yêu cầu, chờ phê duyệt" và redirect về danh sách

### 3.6 Trang IssueRequestsPage (cho STAFF — xem yêu cầu của mình)

Tạo `frontend/src/pages/IssueRequestsPage.tsx`

Hiển thị danh sách yêu cầu xuất kho mà STAFF đã tạo:
- Bảng: Số yêu cầu, Ngày, Lý do, Số mặt hàng, Trạng thái (badge), Phiếu xuất liên kết (nếu đã duyệt)
- Status badge màu:
  - `PENDING_APPROVAL` → vàng "Chờ duyệt"
  - `APPROVED` → xanh "Đã duyệt" + link đến Issue
  - `REJECTED` → đỏ "Bị từ chối" + tooltip lý do
- Nút "+ Gửi yêu cầu mới" → navigate đến form

### 3.7 Trang ApprovalPage (cho MANAGER/ADMIN — danh sách chờ duyệt)

Tạo `frontend/src/pages/ApprovalPage.tsx`

- Tabs: "Chờ duyệt" | "Đã duyệt" | "Từ chối"
- Bảng: Số yêu cầu, Ngày, Người xin, Lý do, Số dòng hàng, Tồn kho (warning nếu thiếu), Thao tác
- Mỗi row: nút "Xem chi tiết" mở modal + nút "Duyệt" / "Từ chối" nhanh
- Modal chi tiết:
  - Thông tin người xin (tên, vai trò)
  - Lý do + ghi chú
  - Bảng hàng hóa với tồn kho hiện tại (màu đỏ nếu không đủ)
  - Nút "Duyệt → Tạo phiếu xuất" (xanh) | nút "Từ chối" (đỏ, yêu cầu nhập lý do)
- Sau khi duyệt: hiển thị toast "Đã duyệt — Phiếu xuất [PX-2026-XXX] đã được tạo tự động"

### 3.8 Cập nhật Sidebar và Router

**Sidebar** (`frontend/src/components/layout/Sidebar.tsx`):

Thêm vào group "Nghiệp vụ":
```typescript
// Hiển thị với WAREHOUSE_STAFF
{ to: '/my-requests', label: 'Yêu cầu xuất kho', icon: <ClipboardList size={15} />, permission: Permission.ISSUE_REQUEST_CREATE },

// Hiển thị với MANAGER + ADMIN
{ to: '/approvals', label: 'Duyệt yêu cầu', icon: <CheckSquare size={15} />,
  permission: Permission.ISSUE_REQUEST_REVIEW,
  badge: 'unread_count'  // hiển thị số đang chờ duyệt
},
```

**Router** (`frontend/src/App.tsx`):
```tsx
<Route path="/my-requests"     element={<IssueRequestsPage />} />
<Route path="/my-requests/new" element={<IssueRequestNewPage />} />
<Route path="/approvals"       element={<ApprovalPage />} />
```

### 3.9 Cập nhật Dashboard

Trong `frontend/src/pages/DashboardPage.tsx`, thêm stat card thứ 5 (hoặc thay card hiện có):

- Với WAREHOUSE_STAFF: hiển thị "Yêu cầu của tôi đang chờ: X"
- Với MANAGER/ADMIN: hiển thị "Chờ phê duyệt: X yêu cầu" (badge đỏ nếu > 0)

---

## Phần 4 — KHÔNG thay đổi

- Luồng Issue cũ (DRAFT → PENDING → APPROVED → CONFIRMED) giữ nguyên 100%
- ACCOUNTANT vẫn tạo Issue trực tiếp như cũ
- Các API `/api/issues` giữ nguyên
- Tất cả test hiện có phải vẫn pass sau khi implement xong feature này

---

## Phần 5 — Kiểm tra sau khi implement

Chạy thủ công các kịch bản sau để xác nhận:

```
Kịch bản 1 — Happy path:
  1. Đăng nhập với WAREHOUSE_STAFF (staff / Staff@123)
  2. Vào "Yêu cầu xuất kho" → "Gửi yêu cầu mới"
  3. Điền form: lý do "Vật tư công trình A", chọn TEST_ON1 × 5
  4. Submit → toast "Đã gửi yêu cầu"
  5. Đăng xuất → đăng nhập WAREHOUSE_MANAGER
  6. Thấy notification bell có badge đỏ số 1
  7. Vào "Duyệt yêu cầu" → thấy request vừa tạo
  8. Click "Duyệt" → toast "Phiếu xuất PX-2026-XXX đã được tạo"
  9. Vào "Phiếu Xuất Kho" → thấy phiếu PX-2026-XXX ở trạng thái DRAFT
  10. Đăng nhập lại STAFF → thấy yêu cầu chuyển sang "Đã duyệt" + link phiếu

Kịch bản 2 — Từ chối:
  1. STAFF tạo yêu cầu mới
  2. MANAGER từ chối, nhập lý do "Tồn kho không đủ, chờ nhập hàng"
  3. STAFF thấy notification "Yêu cầu bị từ chối" + lý do

Kịch bản 3 — RBAC:
  - VIEWER không thấy menu "Yêu cầu xuất kho"
  - ACCOUNTANT không thấy menu "Yêu cầu xuất kho" (họ tạo Issue thẳng)
  - STAFF không thấy menu "Duyệt yêu cầu"
  - STAFF không gọi được POST /api/issue-requests/:id/approve → 403
```

---

## Ghi chú triển khai

- Notification trong bài này là **in-app polling** (không cần WebSocket) — frontend gọi `GET /api/notifications/unread-count` mỗi 30 giây
- Không cần email notification trong phiên bản này
- Không cần push notification
- Nếu muốn real-time sau này: thay polling bằng Server-Sent Events hoặc WebSocket, giữ nguyên API và chỉ thay transport layer
