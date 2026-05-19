// src/modules/inventory/inventory.schema.ts
import { z } from 'zod';

export const closePeriodSchema = z.object({
  periodId: z.string().min(1, 'Period ID là bắt buộc'),
});

export const rolloverPeriodSchema = z.object({
  fromYear: z.number().int().min(2000),
  fromMonth: z.number().int().min(1).max(12),
  toYear: z.number().int().min(2000),
  toMonth: z.number().int().min(1).max(12),
});

export type ClosePeriodDto = z.infer<typeof closePeriodSchema>;
export type RolloverPeriodDto = z.infer<typeof rolloverPeriodSchema>;
