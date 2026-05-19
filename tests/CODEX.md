# CODEX.md
# File này Codex đọc tự động khi mở project

## Dự án: WMS — Hệ thống Quản lý Kho

**Cấu trúc thư mục:**
```
wms/
├── backend/          Node.js + Express + Prisma + PostgreSQL
├── frontend/         React + TypeScript + Vite + Tailwind
├── tests/            Integration & E2E tests (Vitest + Supertest)
└── docs/AGENTS.md    Spec đầy đủ — đọc trước khi làm bất cứ thứ gì
```

## Khi Codex được yêu cầu CHẠY TEST

→ Đọc ngay: `tests/CODEX_PROMPT.md`

## Khi Codex được yêu cầu IMPLEMENT

→ Đọc ngay: `docs/AGENTS.md`

## Database

- Production: `DATABASE_URL` trong `backend/.env`
- Test: `DATABASE_URL_TEST` trong `backend/.env` (DB riêng, không dùng chung)

## Lệnh hay dùng

```bash
# Backend dev
cd backend && npm run dev

# Chạy tất cả tests
cd backend && bash ../tests/scripts/run-tests.sh all

# Chỉ integration tests
cd backend && npx vitest run ../tests/integration/

# Chỉ 1 file test
cd backend && npx vitest run ../tests/integration/04_receipt_flow.test.ts
```
