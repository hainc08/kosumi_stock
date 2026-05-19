// src/modules/products/products.service.ts
import { prisma } from '../../config/database';
import { CreateCategoryDto, CreateProductDto, CreateUnitDto, UpdateCategoryDto, UpdateProductDto, UpdateUnitDto } from './products.schema';
import { writeAuditLog } from '../../middleware/audit.middleware';
import ExcelJS from 'exceljs';

export async function createProduct(dto: CreateProductDto, userId: string) {
  const existing = await prisma.product.findUnique({ where: { code: dto.code } });
  if (existing) {
    throw { code: 'DUPLICATE_CODE', message: 'Mã hàng đã tồn tại', status: 409 };
  }

  const product = await prisma.product.create({
    data: dto,
    select: { id: true, code: true, name: true, unit: true, category: true, minStock: true, isActive: true, createdAt: true },
  });

  await writeAuditLog({
    userId,
    action: 'CREATE_PRODUCT',
    entityType: 'Product',
    entityId: product.id,
    newData: product,
  });

  return product;
}

export async function updateProduct(id: string, dto: UpdateProductDto, userId: string) {
  const old = await prisma.product.findUnique({ where: { id } });
  if (!old) {
    throw { code: 'NOT_FOUND', message: 'Hàng hóa không tồn tại', status: 404 };
  }

  // Check if changing code to an existing one
  if (dto.code && dto.code !== old.code) {
    const existing = await prisma.product.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw { code: 'DUPLICATE_CODE', message: 'Mã hàng đã tồn tại', status: 409 };
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: dto,
    select: { id: true, code: true, name: true, unit: true, category: true, minStock: true, isActive: true },
  });

  await writeAuditLog({
    userId,
    action: 'UPDATE_PRODUCT',
    entityType: 'Product',
    entityId: id,
    oldData: old,
    newData: dto,
  });

  return product;
}

export async function deleteProduct(id: string, userId: string) {
  const old = await prisma.product.findUnique({ where: { id } });
  if (!old) {
    throw { code: 'NOT_FOUND', message: 'Hàng hóa không tồn tại', status: 404 };
  }

  await prisma.product.update({ where: { id }, data: { isActive: false } });

  await writeAuditLog({
    userId,
    action: 'DELETE_PRODUCT',
    entityType: 'Product',
    entityId: id,
    oldData: { isActive: old.isActive },
    newData: { isActive: false },
  });
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, code: true, name: true, unit: true, category: true, minStock: true, isActive: true, createdAt: true },
  });
  if (!product) {
    throw { code: 'NOT_FOUND', message: 'Hàng hóa không tồn tại', status: 404 };
  }
  return product;
}

export async function listProducts(page: number, limit: number, skip: number, search?: string, isActive?: boolean) {
  const where: any = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search } },
            { name: { contains: search } },
            { category: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      select: { id: true, code: true, name: true, unit: true, category: true, minStock: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { data, total };
}

export async function listUnits(search?: string) {
  const where: any = {
    isActive: true,
    ...(search
      ? { OR: [{ code: { contains: search } }, { name: { contains: search } }] }
      : {}),
  };
  return prisma.unit.findMany({ where, orderBy: { name: 'asc' } });
}

export async function createUnit(dto: CreateUnitDto, userId: string) {
  const existing = await prisma.unit.findFirst({ where: { OR: [{ code: dto.code }, { name: dto.name }] } });
  if (existing) throw { code: 'DUPLICATE_CODE', message: 'Don vi da ton tai', status: 409 };
  const unit = await prisma.unit.create({ data: dto });
  await writeAuditLog({ userId, action: 'CREATE_UNIT', entityType: 'Unit', entityId: unit.id, newData: unit });
  return unit;
}

export async function updateUnit(id: string, dto: UpdateUnitDto, userId: string) {
  const old = await prisma.unit.findUnique({ where: { id } });
  if (!old) throw { code: 'NOT_FOUND', message: 'Don vi khong ton tai', status: 404 };
  const unit = await prisma.unit.update({ where: { id }, data: dto });
  await writeAuditLog({ userId, action: 'UPDATE_UNIT', entityType: 'Unit', entityId: id, oldData: old, newData: unit });
  return unit;
}

export async function deleteUnit(id: string, userId: string) {
  const old = await prisma.unit.findUnique({ where: { id } });
  if (!old) throw { code: 'NOT_FOUND', message: 'Don vi khong ton tai', status: 404 };
  await prisma.unit.update({ where: { id }, data: { isActive: false } });
  await writeAuditLog({ userId, action: 'DELETE_UNIT', entityType: 'Unit', entityId: id, oldData: old, newData: { isActive: false } });
}

export async function listCategories(search?: string) {
  const where: any = {
    isActive: true,
    ...(search
      ? { OR: [{ code: { contains: search } }, { name: { contains: search } }] }
      : {}),
  };
  return prisma.productCategory.findMany({ where, orderBy: { name: 'asc' } });
}

export async function createCategory(dto: CreateCategoryDto, userId: string) {
  const existing = await prisma.productCategory.findFirst({ where: { OR: [{ code: dto.code }, { name: dto.name }] } });
  if (existing) throw { code: 'DUPLICATE_CODE', message: 'Nhom vat tu da ton tai', status: 409 };
  const category = await prisma.productCategory.create({ data: dto });
  await writeAuditLog({ userId, action: 'CREATE_PRODUCT_CATEGORY', entityType: 'ProductCategory', entityId: category.id, newData: category });
  return category;
}

export async function updateCategory(id: string, dto: UpdateCategoryDto, userId: string) {
  const old = await prisma.productCategory.findUnique({ where: { id } });
  if (!old) throw { code: 'NOT_FOUND', message: 'Nhom vat tu khong ton tai', status: 404 };
  const category = await prisma.productCategory.update({ where: { id }, data: dto });
  await writeAuditLog({ userId, action: 'UPDATE_PRODUCT_CATEGORY', entityType: 'ProductCategory', entityId: id, oldData: old, newData: category });
  return category;
}

export async function deleteCategory(id: string, userId: string) {
  const old = await prisma.productCategory.findUnique({ where: { id } });
  if (!old) throw { code: 'NOT_FOUND', message: 'Nhom vat tu khong ton tai', status: 404 };
  await prisma.productCategory.update({ where: { id }, data: { isActive: false } });
  await writeAuditLog({
    userId,
    action: 'DELETE_PRODUCT_CATEGORY',
    entityType: 'ProductCategory',
    entityId: id,
    oldData: old,
    newData: { isActive: false },
  });
}

type ImportRow = {
  code: string;
  name: string;
  unit: string;
  category?: string | null;
  minStock: number;
};

const TEMPLATE_HEADERS = ['MaHang', 'TenHang', 'DonViTinh', 'Loai', 'TonToiThieu'];
const TEMPLATE_SAMPLE_ROWS: ImportRow[] = [
  { code: 'ON1', name: 'Ong 139.8x6x6000mm', unit: 'ong', category: 'Ong', minStock: 0 },
  { code: 'T1', name: 'Tam 12x2m x6m', unit: 'Tam', category: 'Tam', minStock: 0 },
  { code: 'D01', name: 'Ong thep den 34.2x2.3x6000', unit: 'ong', category: 'Den', minStock: 0 },
];

export async function getProductImportTemplateBuffer() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ProductsTemplate');
  sheet.addRow(TEMPLATE_HEADERS);
  TEMPLATE_SAMPLE_ROWS.forEach((item) => {
    sheet.addRow([item.code, item.name, item.unit, item.category ?? '', item.minStock]);
  });

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  sheet.columns = [
    { width: 16 },
    { width: 42 },
    { width: 16 },
    { width: 18 },
    { width: 14 },
  ];

  const note = workbook.addWorksheet('HuongDan');
  note.addRow(['Huong dan nhap du lieu']);
  note.addRow(['- Khong sua dong tieu de trong sheet ProductsTemplate']);
  note.addRow(['- MaHang, TenHang, DonViTinh la bat buoc']);
  note.addRow(['- TonToiThieu de trong se mac dinh = 0']);
  note.getRow(1).font = { bold: true };
  note.columns = [{ width: 80 }];

  const data = await workbook.xlsx.writeBuffer();
  return Buffer.from(data);
}

export async function importProductsFromExcel(buffer: Buffer, userId: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];

  if (!sheet) {
    throw { code: 'VALIDATION_ERROR', message: 'File Excel khong hop le', status: 422 };
  }

  const result = { created: 0, updated: 0, failed: 0, errors: [] as string[] };

  for (let rowIdx = 2; rowIdx <= sheet.rowCount; rowIdx += 1) {
    const row = sheet.getRow(rowIdx);
    const code = String(row.getCell(1).value ?? '').trim();
    const name = String(row.getCell(2).value ?? '').trim();
    const unit = String(row.getCell(3).value ?? '').trim();
    const categoryRaw = String(row.getCell(4).value ?? '').trim();
    const minStockRaw = String(row.getCell(5).value ?? '').trim();

    if (!code && !name && !unit && !categoryRaw && !minStockRaw) continue;
    if (!code || !name || !unit) {
      result.failed += 1;
      result.errors.push(`Dong ${rowIdx}: thieu truong bat buoc (MaHang/TenHang/DonViTinh)`);
      continue;
    }

    const minStock = minStockRaw === '' ? 0 : Number(minStockRaw);
    if (!Number.isFinite(minStock) || minStock < 0) {
      result.failed += 1;
      result.errors.push(`Dong ${rowIdx}: TonToiThieu khong hop le`);
      continue;
    }

    const payload: CreateProductDto = {
      code,
      name,
      unit,
      category: categoryRaw || null,
      minStock: Math.floor(minStock),
    };

    try {
      const existing = await prisma.product.findUnique({ where: { code: payload.code } });
      if (!existing) {
        await prisma.product.create({ data: payload });
        result.created += 1;
      } else {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: payload.name,
            unit: payload.unit,
            category: payload.category ?? null,
            minStock: payload.minStock,
            isActive: true,
          },
        });
        result.updated += 1;
      }
    } catch (err: any) {
      result.failed += 1;
      result.errors.push(`Dong ${rowIdx}: ${err?.message ?? 'Loi khong xac dinh'}`);
    }
  }

  await writeAuditLog({
    userId,
    action: 'IMPORT_PRODUCT',
    entityType: 'Product',
    newData: {
      created: result.created,
      updated: result.updated,
      failed: result.failed,
    },
  });

  return result;
}
