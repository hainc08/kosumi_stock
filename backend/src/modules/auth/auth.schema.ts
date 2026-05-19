// src/modules/auth/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username là bắt buộc'),
  password: z.string().min(1, 'Password là bắt buộc'),
});

export type LoginDto = z.infer<typeof loginSchema>;
