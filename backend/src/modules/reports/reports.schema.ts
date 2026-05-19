// src/modules/reports/reports.schema.ts
import { z } from 'zod';

export const exportInventorySchema = z.object({
  periodId: z.string().optional(),
  format: z.enum(['json', 'csv', 'xlsx']).default('xlsx'),
});

export const exportReceiptSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  format: z.enum(['json', 'csv', 'xlsx']).default('xlsx'),
});

export const exportIssueSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  format: z.enum(['json', 'csv', 'xlsx']).default('xlsx'),
});

export type ExportInventoryDto = z.infer<typeof exportInventorySchema>;
export type ExportReceiptDto = z.infer<typeof exportReceiptSchema>;
export type ExportIssueDto = z.infer<typeof exportIssueSchema>;
