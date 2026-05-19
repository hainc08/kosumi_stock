// tests/integration/setup.ts
// Reset DB + seed test fixtures trước mỗi suite

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import usersFixture   from '../fixtures/users.json';
import productsFixture from '../fixtures/products.json';

export const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL } },
});

/** Map alias → DB id, được populate sau seedTestData() */
export const ids: Record<string, string> = {};

export async function resetDatabase() {
  // Xóa theo thứ tự FK
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.issueItem.deleteMany(),
    prisma.issue.deleteMany(),
    prisma.receiptItem.deleteMany(),
    prisma.receipt.deleteMany(),
    prisma.inventoryBalance.deleteMany(),
    prisma.inventoryPeriod.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function seedTestData() {
  // ── Users ──────────────────────────────────────────────────────────────────
  for (const u of usersFixture.users) {
    const user = await prisma.user.create({
      data: {
        username:     u.username,
        email:        u.email,
        fullName:     u.fullName,
        role:         u.role as any,
        passwordHash: await bcrypt.hash(u.password, 4), // rounds=4 để test nhanh hơn
      },
    });
    ids[`user_${u.id_alias}`] = user.id;
  }

  // ── Products ───────────────────────────────────────────────────────────────
  for (const p of productsFixture.products) {
    const product = await prisma.product.create({
      data: {
        code:     p.code,
        name:     p.name,
        unit:     p.unit,
        category: p.category,
        minStock: p.minStock,
      },
    });
    ids[`product_${p.code}`] = product.id;
  }

  // ── Inventory Period T5/2026 ───────────────────────────────────────────────
  const period = await prisma.inventoryPeriod.create({
    data: { year: 2026, month: 5 },
  });
  ids['period_current'] = period.id;

  // ── Inventory Balance (opening_qty từ fixtures) ───────────────────────────
  for (const p of productsFixture.products) {
    await prisma.inventoryBalance.create({
      data: {
        periodId:   period.id,
        productId:  ids[`product_${p.code}`],
        openingQty: p.opening_qty,
        closingQty: p.opening_qty, // bắt đầu bằng opening (chưa có giao dịch)
      },
    });
  }
}

export async function getClosingQty(productCode: string): Promise<number> {
  const balance = await prisma.inventoryBalance.findFirst({
    where: {
      periodId:  ids['period_current'],
      productId: ids[`product_${productCode}`],
    },
  });
  return Number(balance?.closingQty ?? 0);
}
