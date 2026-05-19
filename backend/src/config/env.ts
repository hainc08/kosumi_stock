// src/config/env.ts
import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  DATABASE_URL:    required('DATABASE_URL'),
  JWT_SECRET:      required('JWT_SECRET'),
  JWT_ACCESS_TTL:  process.env.JWT_ACCESS_TTL  ?? '15m',
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL ?? '7d',
  PORT:            parseInt(process.env.PORT ?? '3001', 10),
  NODE_ENV:        process.env.NODE_ENV ?? 'development',
  CORS_ORIGIN:     process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  BCRYPT_ROUNDS:   parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
  IS_PROD:         process.env.NODE_ENV === 'production',
} as const;
