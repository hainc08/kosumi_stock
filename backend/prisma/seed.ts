// prisma/seed.ts
// Reset + Demo seed cho WMS — Kho thép T5/2026

import { PrismaClient, Role, ReceiptStatus, IssueStatus, IssueRequestStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding WMS database...\n');

  // ── 1. USERS (upsert — giữ nguyên) ──────────────────────────────────────────
  const ROUNDS = 12;
  const [admin, manager, accountant, staff, viewer] = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@wms.local',
        passwordHash: await bcrypt.hash('Admin@123', ROUNDS),
        fullName: 'Quản Trị Viên',
        role: Role.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { username: 'manager' },
      update: {},
      create: {
        username: 'manager',
        email: 'manager@wms.local',
        passwordHash: await bcrypt.hash('Manager@123', ROUNDS),
        fullName: 'Nguyễn Văn Quản',
        role: Role.WAREHOUSE_MANAGER,
      },
    }),
    prisma.user.upsert({
      where: { username: 'accountant' },
      update: {},
      create: {
        username: 'accountant',
        email: 'accountant@wms.local',
        passwordHash: await bcrypt.hash('Acc@123', ROUNDS),
        fullName: 'Trần Thị Kế',
        role: Role.ACCOUNTANT,
      },
    }),
    prisma.user.upsert({
      where: { username: 'staff' },
      update: {},
      create: {
        username: 'staff',
        email: 'staff@wms.local',
        passwordHash: await bcrypt.hash('Staff@123', ROUNDS),
        fullName: 'Lê Văn Nhân',
        role: Role.WAREHOUSE_STAFF,
      },
    }),
    prisma.user.upsert({
      where: { username: 'viewer' },
      update: {},
      create: {
        username: 'viewer',
        email: 'viewer@wms.local',
        passwordHash: await bcrypt.hash('Viewer@123', ROUNDS),
        fullName: 'Phạm Thị Xem',
        role: Role.VIEWER,
      },
    }),
  ]);
  console.log('✅ Users ready (5 tài khoản)');

  // ── 2. PRODUCTS (upsert — giữ nguyên) ────────────────────────────────────────
  const productData = [
    { code: 'ON1',  name: 'Ống 139.8x6x6000mm',            unit: 'ống', category: 'Ống',  minStock: 5  },
    { code: 'ON2',  name: 'Ống 114.3x6x6000mm',            unit: 'ống', category: 'Ống',  minStock: 5  },
    { code: 'ON3',  name: 'Ống 101x4.2x6000mm',            unit: 'ống', category: 'Ống',  minStock: 5  },
    { code: 'ON4',  name: 'Ống 89.1x4.2x6000mm',           unit: 'ống', category: 'Ống',  minStock: 5  },
    { code: 'ON5',  name: 'Ống 60.3x6000mm',               unit: 'ống', category: 'Ống',  minStock: 10 },
    { code: 'ON6',  name: 'Ống 60.3x4100mm',               unit: 'ống', category: 'Ống',  minStock: 5  },
    { code: 'T1',   name: 'Tấm 12x2000x6000mm',            unit: 'Tấm', category: 'Tấm',  minStock: 5  },
    { code: 'T2',   name: 'Tấm 10x2000x6000mm',            unit: 'Tấm', category: 'Tấm',  minStock: 5  },
    { code: 'T3',   name: 'Tấm 6x2000x6000mm',             unit: 'Tấm', category: 'Tấm',  minStock: 3  },
    { code: 'T4',   name: 'Tấm 5x2000x6000mm',             unit: 'Tấm', category: 'Tấm',  minStock: 3  },
    { code: 'T5',   name: 'Tấm 3.5x1500x6000mm',           unit: 'Tấm', category: 'Tấm',  minStock: 3  },
    { code: 'T6',   name: 'Tấm 2.5x1250x2500mm',           unit: 'Tấm', category: 'Tấm',  minStock: 3  },
    { code: 'T7',   name: 'Tấm 1.5x1250x3000mm',           unit: 'Tấm', category: 'Tấm',  minStock: 3  },
    { code: 'T8',   name: 'Tấm 8x2000x6000mm',             unit: 'Tấm', category: 'Tấm',  minStock: 3  },
    { code: 'T9',   name: 'Thép tấm 14x1500x2900mm',       unit: 'Tấm', category: 'Tấm',  minStock: 2  },
    { code: 'T10',  name: 'Thép tấm 16x1100x6000mm',       unit: 'Tấm', category: 'Tấm',  minStock: 2  },
    { code: 'T11',  name: 'Tấm 1.0x1250x2500mm',           unit: 'Tấm', category: 'Tấm',  minStock: 3  },
    { code: 'T12',  name: 'Tấm 3x1500x3000mm',             unit: 'Tấm', category: 'Tấm',  minStock: 3  },
    { code: 'Đ01',  name: 'Ống thép đen 34.2x2.3x6000mm',  unit: 'ống', category: 'Đen',  minStock: 5  },
    { code: 'Đ02',  name: 'Ống thép đen 27x2.3x6000mm',    unit: 'ống', category: 'Đen',  minStock: 5  },
  ];
  for (const p of productData) {
    await prisma.product.upsert({ where: { code: p.code }, update: {}, create: p });
  }
  const allProducts = await prisma.product.findMany();
  const byCode = Object.fromEntries(allProducts.map(p => [p.code, p]));
  console.log(`✅ Products ready (${productData.length} sản phẩm)`);

  // ── 3. XÓA DATA CŨ (giữ users + products) ───────────────────────────────────
  console.log('\n🗑️  Xóa data cũ...');
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  // Xóa issueId trước để tránh FK conflict khi xóa issues
  await prisma.issueRequest.updateMany({ data: { issueId: null } });
  await prisma.issueRequestItem.deleteMany();
  await prisma.issueRequest.deleteMany();
  await prisma.issueItem.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.inventoryBalance.deleteMany();
  await prisma.inventoryPeriod.deleteMany();
  console.log('✅ Đã xóa toàn bộ data giao dịch');

  // ── 4. KỲ TỒN KHO ───────────────────────────────────────────────────────────
  // T4/2026 — đã đóng kỳ
  const periodApr = await prisma.inventoryPeriod.create({
    data: {
      year: 2026, month: 4,
      isClosed: true,
      closedAt: new Date('2026-05-02T08:00:00'),
      closedBy: manager.id,
    },
  });
  // T5/2026 — kỳ hiện tại, đang mở
  const periodMay = await prisma.inventoryPeriod.create({
    data: { year: 2026, month: 5 },
  });
  console.log('\n✅ Tạo 2 kỳ tồn kho: T4/2026 (đóng), T5/2026 (đang mở)');

  // ── 5. TỒN KHO ĐẦU KỲ ───────────────────────────────────────────────────────
  // Đơn giá tham khảo (VND)
  const unitPrices: Record<string, number> = {
    ON1: 4_800_000, ON2: 3_500_000, ON3: 2_900_000,
    ON4: 2_200_000, ON5: 1_100_000, ON6: 900_000,
    T1: 11_500_000, T2: 9_500_000,  T3: 5_200_000,
    T4: 4_300_000,  T5: 3_100_000,  T6: 1_800_000,
    T7: 1_100_000,  T8: 7_800_000,  T9: 12_500_000,
    T10: 14_200_000, T11: 850_000,  T12: 2_400_000,
    'Đ01': 680_000, 'Đ02': 520_000,
  };

  // Tồn kho tháng 4 (đóng kỳ)
  const balanceApr: Record<string, { opening: number; closing: number }> = {
    ON1: { opening: 30, closing: 27 }, ON2: { opening: 8,  closing: 6  },
    ON3: { opening: 35, closing: 28 }, ON4: { opening: 32, closing: 29 },
    ON5: { opening: 80, closing: 76 }, ON6: { opening: 18, closing: 15 },
    T1:  { opening: 8,  closing: 5  }, T2:  { opening: 12, closing: 10 },
    T3:  { opening: 4,  closing: 2  }, T4:  { opening: 2,  closing: 0  },
    T5:  { opening: 5,  closing: 3  }, T6:  { opening: 8,  closing: 6  },
    T11: { opening: 3,  closing: 2  },
    'Đ01': { opening: 5, closing: 0 }, 'Đ02': { opening: 4, closing: 0 },
  };
  for (const [code, bal] of Object.entries(balanceApr)) {
    const product = byCode[code];
    if (!product) continue;
    const price = unitPrices[code] ?? 0;
    await prisma.inventoryBalance.create({
      data: {
        periodId: periodApr.id,
        productId: product.id,
        openingQty: bal.opening,
        openingValue: bal.opening * price,
        closingQty: bal.closing,
        closingValue: bal.closing * price,
      },
    });
  }

  // Tồn kho tháng 5 — mở đầu kỳ = đóng kỳ T4
  // closing sẽ phản ánh sau khi nhập/xuất demo bên dưới
  const openingMay: Record<string, number> = {
    ON1: 27, ON2: 6,  ON3: 28, ON4: 29, ON5: 76, ON6: 15,
    T1: 5,   T2: 10,  T3: 2,   T4: 0,   T5: 3,   T6: 6,
    T7: 0,   T8: 0,   T9: 0,   T10: 0,  T11: 2,  T12: 0,
    'Đ01': 0, 'Đ02': 0,
  };
  // closing = opening + nhập (PN-001 + PN-002) - xuất (PX-001)
  // PN-001: ON1+10, ON2+5, T1+3   | PN-002: T2+5, T3+2
  // PX-001 (CONFIRMED): ON1-5, T1-2
  const closingMay: Record<string, number> = {
    ON1: 27+10-5, // 32
    ON2: 6+5,     // 11
    ON3: 28,
    ON4: 29,
    ON5: 76,
    ON6: 15,
    T1: 5+3-2,    // 6
    T2: 10+5,     // 15
    T3: 2+2,      // 4
    T4: 0,
    T5: 3,
    T6: 6,
    T7: 0, T8: 0, T9: 0, T10: 0, T11: 2, T12: 0,
    'Đ01': 0, 'Đ02': 0,
  };
  for (const [code, openQty] of Object.entries(openingMay)) {
    const product = byCode[code];
    if (!product) continue;
    const price = unitPrices[code] ?? 0;
    const closeQty = closingMay[code] ?? openQty;
    await prisma.inventoryBalance.create({
      data: {
        periodId: periodMay.id,
        productId: product.id,
        openingQty: openQty,
        openingValue: openQty * price,
        closingQty: closeQty,
        closingValue: closeQty * price,
      },
    });
  }
  console.log('✅ Tạo tồn kho T4/2026 và T5/2026');

  // ── 6. PHIẾU NHẬP KHO ────────────────────────────────────────────────────────
  console.log('\n📥 Tạo phiếu nhập kho...');

  // PN-2026-001: APPROVED — nhập ống thép, ngày 02/05
  const pn001 = await prisma.receipt.create({
    data: {
      receiptNo: 'PN-2026-001',
      periodId: periodMay.id,
      receiptDate: new Date('2026-05-02'),
      supplier: 'Công ty TNHH Thép Việt Nam',
      note: 'Nhập hàng theo hợp đồng HĐ-2026-12',
      status: ReceiptStatus.APPROVED,
      createdById: staff.id,
      approvedById: manager.id,
      approvedAt: new Date('2026-05-03T09:30:00'),
      items: {
        create: [
          { productId: byCode['ON1'].id, quantity: 10, unitPrice: 4_800_000, totalValue: 48_000_000 },
          { productId: byCode['ON2'].id, quantity: 5,  unitPrice: 3_500_000, totalValue: 17_500_000 },
          { productId: byCode['T1'].id,  quantity: 3,  unitPrice: 11_500_000, totalValue: 34_500_000 },
        ],
      },
    },
  });

  // PN-2026-002: APPROVED — nhập tấm thép, ngày 08/05
  const pn002 = await prisma.receipt.create({
    data: {
      receiptNo: 'PN-2026-002',
      periodId: periodMay.id,
      receiptDate: new Date('2026-05-08'),
      supplier: 'Công ty CP Kim Loại Đông Nam',
      note: 'Nhập bổ sung tấm thép theo yêu cầu sản xuất',
      status: ReceiptStatus.APPROVED,
      createdById: accountant.id,
      approvedById: manager.id,
      approvedAt: new Date('2026-05-09T14:15:00'),
      items: {
        create: [
          { productId: byCode['T2'].id, quantity: 5, unitPrice: 9_500_000, totalValue: 47_500_000 },
          { productId: byCode['T3'].id, quantity: 2, unitPrice: 5_200_000, totalValue: 10_400_000 },
        ],
      },
    },
  });

  // PN-2026-003: PENDING — chờ duyệt, ngày 15/05
  const pn003 = await prisma.receipt.create({
    data: {
      receiptNo: 'PN-2026-003',
      periodId: periodMay.id,
      receiptDate: new Date('2026-05-15'),
      supplier: 'Thép Hòa Phát',
      note: 'Nhập ống thép lần 2',
      status: ReceiptStatus.PENDING,
      createdById: staff.id,
      items: {
        create: [
          { productId: byCode['ON3'].id, quantity: 10, unitPrice: 2_900_000, totalValue: 29_000_000 },
          { productId: byCode['ON4'].id, quantity: 8,  unitPrice: 2_200_000, totalValue: 17_600_000 },
        ],
      },
    },
  });

  // PN-2026-004: DRAFT — nháp, ngày 18/05
  const pn004 = await prisma.receipt.create({
    data: {
      receiptNo: 'PN-2026-004',
      periodId: periodMay.id,
      receiptDate: new Date('2026-05-18'),
      supplier: 'Công ty Thép Miền Nam',
      status: ReceiptStatus.DRAFT,
      createdById: accountant.id,
      items: {
        create: [
          { productId: byCode['T5'].id, quantity: 5, unitPrice: 3_100_000, totalValue: 15_500_000 },
          { productId: byCode['T6'].id, quantity: 4, unitPrice: 1_800_000, totalValue:  7_200_000 },
        ],
      },
    },
  });
  console.log('  ✅ PN-2026-001 (APPROVED)  — Thép Việt Nam');
  console.log('  ✅ PN-2026-002 (APPROVED)  — Kim Loại Đông Nam');
  console.log('  ✅ PN-2026-003 (PENDING)   — Hòa Phát');
  console.log('  ✅ PN-2026-004 (DRAFT)     — Thép Miền Nam');

  // ── 7. YÊU CẦU XUẤT KHO ──────────────────────────────────────────────────────
  console.log('\n📋 Tạo yêu cầu xuất kho...');

  // XK-2026-001: APPROVED — ngày 05/05, xưởng cơ khí
  const xk001 = await prisma.issueRequest.create({
    data: {
      requestNo: 'XK-2026-001',
      periodId: periodMay.id,
      requestDate: new Date('2026-05-05'),
      reason: 'Thi công dự án nhà máy A3 — hạng mục kết cấu thép',
      status: IssueRequestStatus.APPROVED,
      requestedById: staff.id,
      reviewedById: manager.id,
      reviewedAt: new Date('2026-05-06T08:00:00'),
      items: {
        create: [
          { productId: byCode['ON1'].id, requestedQty: 5, note: 'Làm giàn giáo tầng 3' },
          { productId: byCode['T1'].id,  requestedQty: 2, note: 'Cắt tấm lót sàn' },
        ],
      },
    },
  });

  // XK-2026-002: PENDING_APPROVAL — ngày 12/05, xưởng điện
  const xk002 = await prisma.issueRequest.create({
    data: {
      requestNo: 'XK-2026-002',
      periodId: periodMay.id,
      requestDate: new Date('2026-05-12'),
      reason: 'Lắp đặt hệ thống ống dẫn điện xưởng B',
      status: IssueRequestStatus.PENDING_APPROVAL,
      requestedById: staff.id,
      items: {
        create: [
          { productId: byCode['Đ01'].id, requestedQty: 3, note: 'Ống dẫn cáp điện' },
          { productId: byCode['Đ02'].id, requestedQty: 2, note: 'Ống nhỏ nhánh phụ' },
        ],
      },
    },
  });

  // XK-2026-003: REJECTED — ngày 10/05, yêu cầu quá số lượng
  const xk003 = await prisma.issueRequest.create({
    data: {
      requestNo: 'XK-2026-003',
      periodId: periodMay.id,
      requestDate: new Date('2026-05-10'),
      reason: 'Sửa chữa mái nhà xưởng C',
      status: IssueRequestStatus.REJECTED,
      requestedById: staff.id,
      reviewedById: manager.id,
      reviewedAt: new Date('2026-05-11T10:20:00'),
      rejectReason: 'Số lượng yêu cầu vượt định mức cho phép. Đề nghị tách nhỏ theo từng đợt thi công.',
      items: {
        create: [
          { productId: byCode['T2'].id, requestedQty: 10, note: 'Lợp mái tôn' },
          { productId: byCode['T3'].id, requestedQty: 5,  note: 'Ốp tường' },
        ],
      },
    },
  });
  console.log('  ✅ XK-2026-001 (APPROVED)          — Xưởng cơ khí');
  console.log('  ✅ XK-2026-002 (PENDING_APPROVAL)  — Xưởng điện');
  console.log('  ✅ XK-2026-003 (REJECTED)          — Sửa mái C');

  // ── 8. PHIẾU XUẤT KHO ────────────────────────────────────────────────────────
  console.log('\n📤 Tạo phiếu xuất kho...');

  // PX-2026-001: CONFIRMED — ngày 06/05, xuất theo XK-001
  const px001 = await prisma.issue.create({
    data: {
      issueNo: 'PX-2026-001',
      periodId: periodMay.id,
      issueDate: new Date('2026-05-06'),
      recipient: 'Trưởng xưởng Nguyễn Thành Tài',
      department: 'Xưởng Cơ Khí',
      note: 'Xuất theo yêu cầu XK-2026-001',
      status: IssueStatus.CONFIRMED,
      createdById: staff.id,
      approvedById: manager.id,
      approvedAt: new Date('2026-05-06T09:00:00'),
      confirmedById: staff.id,
      confirmedAt: new Date('2026-05-06T14:30:00'),
      items: {
        create: [
          { productId: byCode['ON1'].id, requestedQty: 5, actualQty: 5, unitPrice: 4_800_000 },
          { productId: byCode['T1'].id,  requestedQty: 2, actualQty: 2, unitPrice: 11_500_000 },
        ],
      },
    },
  });
  // Liên kết PX-001 ↔ XK-001
  await prisma.issueRequest.update({
    where: { id: xk001.id },
    data: { issueId: px001.id },
  });

  // PX-2026-002: APPROVED — ngày 13/05, xuất tự do cho bộ phận sửa chữa
  const px002 = await prisma.issue.create({
    data: {
      issueNo: 'PX-2026-002',
      periodId: periodMay.id,
      issueDate: new Date('2026-05-13'),
      recipient: 'Tổ sửa chữa – Phòng Kỹ Thuật',
      department: 'Phòng Kỹ Thuật',
      note: 'Sửa chữa định kỳ máy ép thuỷ lực',
      status: IssueStatus.APPROVED,
      createdById: accountant.id,
      approvedById: manager.id,
      approvedAt: new Date('2026-05-14T10:00:00'),
      items: {
        create: [
          { productId: byCode['T2'].id, requestedQty: 3, unitPrice: 9_500_000 },
          { productId: byCode['ON4'].id, requestedQty: 2, unitPrice: 2_200_000 },
        ],
      },
    },
  });

  // PX-2026-003: PENDING — ngày 16/05, chờ duyệt
  const px003 = await prisma.issue.create({
    data: {
      issueNo: 'PX-2026-003',
      periodId: periodMay.id,
      issueDate: new Date('2026-05-16'),
      recipient: 'Trưởng xưởng Lê Minh Đức',
      department: 'Xưởng Sơn',
      note: 'Làm khung treo sản phẩm sơn tĩnh điện',
      status: IssueStatus.PENDING,
      createdById: staff.id,
      items: {
        create: [
          { productId: byCode['ON4'].id, requestedQty: 5, unitPrice: 2_200_000 },
          { productId: byCode['T5'].id,  requestedQty: 2, unitPrice: 3_100_000 },
        ],
      },
    },
  });

  // PX-2026-004: DRAFT — ngày 18/05, đang soạn thảo
  const px004 = await prisma.issue.create({
    data: {
      issueNo: 'PX-2026-004',
      periodId: periodMay.id,
      issueDate: new Date('2026-05-18'),
      department: 'Xưởng Hàn',
      status: IssueStatus.DRAFT,
      createdById: accountant.id,
      items: {
        create: [
          { productId: byCode['T3'].id, requestedQty: 1, unitPrice: 5_200_000 },
        ],
      },
    },
  });
  console.log('  ✅ PX-2026-001 (CONFIRMED) — Xưởng Cơ Khí  ← XK-2026-001');
  console.log('  ✅ PX-2026-002 (APPROVED)  — Phòng Kỹ Thuật');
  console.log('  ✅ PX-2026-003 (PENDING)   — Xưởng Sơn');
  console.log('  ✅ PX-2026-004 (DRAFT)     — Xưởng Hàn');

  // ── 9. THÔNG BÁO ─────────────────────────────────────────────────────────────
  console.log('\n🔔 Tạo thông báo...');
  await prisma.notification.createMany({
    data: [
      {
        userId: manager.id,
        type: NotificationType.ISSUE_REQUEST_NEW,
        title: 'Yêu cầu xuất kho mới',
        message: 'Lê Văn Nhân vừa tạo yêu cầu xuất kho XK-2026-002 (Xưởng điện — 3 ống Đ01, 2 ống Đ02). Vui lòng xem xét và phê duyệt.',
        entityId: xk002.id,
        entityType: 'IssueRequest',
        isRead: false,
      },
      {
        userId: staff.id,
        type: NotificationType.ISSUE_REQUEST_APPROVED,
        title: 'Yêu cầu xuất kho đã được duyệt',
        message: 'Yêu cầu xuất kho XK-2026-001 của bạn đã được Nguyễn Văn Quản phê duyệt. Phiếu xuất PX-2026-001 đã được tạo.',
        entityId: xk001.id,
        entityType: 'IssueRequest',
        isRead: true,
      },
      {
        userId: staff.id,
        type: NotificationType.ISSUE_REQUEST_REJECTED,
        title: 'Yêu cầu xuất kho bị từ chối',
        message: 'Yêu cầu xuất kho XK-2026-003 của bạn đã bị từ chối. Lý do: Số lượng yêu cầu vượt định mức cho phép.',
        entityId: xk003.id,
        entityType: 'IssueRequest',
        isRead: false,
      },
    ],
  });
  console.log('  ✅ 3 thông báo (1 cho manager, 2 cho staff)');

  // ── TỔNG KẾT ─────────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════╗
║           🎉  SEED HOÀN TẤT — DỮ LIỆU DEMO          ║
╠══════════════════════════════════════════════════════╣
║  Kỳ tồn kho:  T4/2026 (đóng) · T5/2026 (đang mở)   ║
║  Phiếu nhập:  2 APPROVED · 1 PENDING · 1 DRAFT      ║
║  Yêu cầu XK:  1 APPROVED · 1 PENDING · 1 REJECTED   ║
║  Phiếu xuất:  1 CONFIRMED · 1 APPROVED · 1 PENDING  ║
║               1 DRAFT                                ║
╠══════════════════════════════════════════════════════╣
║  TÀI KHOẢN ĐĂNG NHẬP                                 ║
║  admin       / Admin@123    → ADMIN                  ║
║  manager     / Manager@123  → WAREHOUSE_MANAGER      ║
║  accountant  / Acc@123      → ACCOUNTANT             ║
║  staff       / Staff@123    → WAREHOUSE_STAFF        ║
║  viewer      / Viewer@123   → VIEWER                 ║
╚══════════════════════════════════════════════════════╝
`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
