// src/modules/issues/issues.schema.ts
import { z } from 'zod';

const itemSchema = z.object({
  productId:    z.string().uuid(),
  requestedQty: z.number().positive('Số lượng phải > 0'),
  unitPrice:    z.number().min(0).default(0),
});

const confirmItemSchema = z.object({
  itemId:    z.string().uuid(),
  actualQty: z.number().min(0),
});

export const createIssueSchema = z.object({
  issueDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recipient:  z.string().optional(),
  department: z.string().optional(),
  note:       z.string().optional(),
  items:      z.array(itemSchema).min(1),
});

export const confirmIssueSchema = z.object({
  items: z.array(confirmItemSchema).min(1),
});

export const updateIssueSchema = createIssueSchema.partial();
export type CreateIssueDto  = z.infer<typeof createIssueSchema>;
export type ConfirmIssueDto = z.infer<typeof confirmIssueSchema>;
