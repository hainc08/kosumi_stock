// src/modules/products/products.schema.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  code: z.string().min(1, 'Mã hàng là bắt buộc').max(20),
  name: z.string().min(1, 'Tên hàng là bắt buộc').max(200),
  unit: z.string().min(1, 'Đơn vị tính là bắt buộc').max(20),
  category: z.string().max(50).optional().nullable(),
  minStock: z.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const createUnitSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(50),
});

export const updateUnitSchema = createUnitSchema.partial();

export const createCategorySchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(50),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type CreateUnitDto = z.infer<typeof createUnitSchema>;
export type UpdateUnitDto = z.infer<typeof updateUnitSchema>;
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
