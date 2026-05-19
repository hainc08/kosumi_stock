import { z } from 'zod';

const itemSchema = z.object({
  productId: z.string().uuid(),
  requestedQty: z.number().positive('So luong phai > 0'),
  note: z.string().max(200).optional(),
});

export const createIssueRequestSchema = z.object({
  requestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1, 'Vui long nhap ly do xin xuat').max(500),
  note: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Can it nhat 1 mat hang'),
});

export const rejectRequestSchema = z.object({
  rejectReason: z.string().min(1, 'Vui long nhap ly do tu choi'),
});

export type CreateIssueRequestDto = z.infer<typeof createIssueRequestSchema>;
export type RejectIssueRequestDto = z.infer<typeof rejectRequestSchema>;
