// src/modules/products/products.controller.ts
import { Request, Response } from 'express';
import {
  createCategorySchema,
  createProductSchema,
  createUnitSchema,
  updateCategorySchema,
  updateProductSchema,
  updateUnitSchema,
} from './products.schema';
import * as productService from './products.service';
import { success, error, parsePagination, paginate } from '../../utils/response';

export async function listProducts(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query as any);
    const search = req.query.search as string | undefined;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

    const { data, total } = await productService.listProducts(page, limit, skip, search, isActive);
    return success(res, data, 'OK', 200, paginate(page, limit, total));
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const dto = createProductSchema.parse(req.body);
    const product = await productService.createProduct(dto, req.user?.id!);
    return success(res, product, 'Tạo hàng hóa thành công', 201);
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const product = await productService.getProduct(String(req.params.id));
    return success(res, product, 'OK');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const dto = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(String(req.params.id), dto, req.user?.id!);
    return success(res, product, 'Cập nhật hàng hóa thành công');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    await productService.deleteProduct(String(req.params.id), req.user?.id!);
    return success(res, null, 'Đã xóa hàng hóa');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function downloadImportTemplate(_req: Request, res: Response) {
  try {
    const buffer = await productService.getProductImportTemplateBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.xlsx"');
    return res.send(buffer);
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function importProducts(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return error(res, 'VALIDATION_ERROR', 'Vui long tai len file Excel', 422);
    }
    const result = await productService.importProductsFromExcel(file.buffer as Buffer, req.user?.id!);
    return success(res, result, 'Import vat tu thanh cong');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function listUnits(req: Request, res: Response) {
  try {
    const search = req.query.search as string | undefined;
    const data = await productService.listUnits(search);
    return success(res, data, 'OK');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function createUnit(req: Request, res: Response) {
  try {
    const dto = createUnitSchema.parse(req.body);
    const data = await productService.createUnit(dto, req.user?.id!);
    return success(res, data, 'Tao don vi thanh cong', 201);
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function updateUnit(req: Request, res: Response) {
  try {
    const dto = updateUnitSchema.parse(req.body);
    const data = await productService.updateUnit(String(req.params.id), dto, req.user?.id!);
    return success(res, data, 'Cap nhat don vi thanh cong');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function deleteUnit(req: Request, res: Response) {
  try {
    await productService.deleteUnit(String(req.params.id), req.user?.id!);
    return success(res, null, 'Da xoa don vi');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function listCategories(req: Request, res: Response) {
  try {
    const search = req.query.search as string | undefined;
    const data = await productService.listCategories(search);
    return success(res, data, 'OK');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const dto = createCategorySchema.parse(req.body);
    const data = await productService.createCategory(dto, req.user?.id!);
    return success(res, data, 'Tao nhom vat tu thanh cong', 201);
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const dto = updateCategorySchema.parse(req.body);
    const data = await productService.updateCategory(String(req.params.id), dto, req.user?.id!);
    return success(res, data, 'Cap nhat nhom vat tu thanh cong');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    await productService.deleteCategory(String(req.params.id), req.user?.id!);
    return success(res, null, 'Da xoa nhom vat tu');
  } catch (err: any) {
    if (err.code) return error(res, err.code, err.message, err.status ?? 400);
    throw err;
  }
}

