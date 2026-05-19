// src/modules/receipts/receipts.schema.ts
import { z } from 'zod';

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity:  z.number().positive('Số lượng phải > 0'),
  unitPrice: z.number().min(0).default(0),
});

export const createReceiptSchema = z.object({
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày: YYYY-MM-DD'),
  supplier:    z.string().optional(),
  note:        z.string().optional(),
  items:       z.array(itemSchema).min(1, 'Cần ít nhất 1 dòng hàng'),
});

export const updateReceiptSchema = createReceiptSchema.partial();
export const rejectSchema = z.object({ reason: z.string().optional() });

export type CreateReceiptDto = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptDto = z.infer<typeof updateReceiptSchema>;
