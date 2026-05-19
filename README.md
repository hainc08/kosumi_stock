# WMS — Warehouse Management System

> **Dành cho AI Agent / Codex**: Đọc file này trước, sau đó đọc `docs/AGENTS.md` để nắm thứ tự implement.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS v3 |
| State | Zustand + TanStack Query v5 |
| Backend | Node.js 20 + Express 5 + TypeScript |
| Database | MariaDB 11 (MySQL protocol) |
| ORM | Prisma 5 |
| Auth | JWT (access 15m + refresh 7d) + bcrypt |
| Export | ExcelJS |
| Container | Docker Compose |

## Quick Start

```bash
cp .env.example .env
docker-compose up -d mariadb
cd backend && npm install && npx prisma migrate dev && npx ts-node prisma/seed.ts
npm run dev
cd ../frontend && npm install && npm run dev
```

## Cổng mặc định
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MariaDB: localhost:3306

## Tài khoản seed mặc định
| Username | Password | Role |
|----------|----------|------|
| admin | Admin@123 | ADMIN |
| manager | Manager@123 | WAREHOUSE_MANAGER |
| accountant | Acc@123 | ACCOUNTANT |
| staff | Staff@123 | WAREHOUSE_STAFF |
| viewer | Viewer@123 | VIEWER |

