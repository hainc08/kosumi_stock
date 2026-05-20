// src/config/env.ts
import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function buildDatabaseUrl(): string {
  const directUrl = process.env.DATABASE_URL;
  if (directUrl) return directUrl;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const pass = process.env.DB_PASS;
  const name = process.env.DB_NAME;
  const port = process.env.DB_PORT ?? '3306';

  if (!host || !user || !pass || !name) {
    throw new Error(
      'Missing required env vars: set DATABASE_URL or DB_HOST/DB_USER/DB_PASS/DB_NAME',
    );
  }

  const encodedPass = encodeURIComponent(pass);
  return `mysql://${user}:${encodedPass}@${host}:${port}/${name}`;
}

const databaseUrl = buildDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

export const env = {
  DATABASE_URL:    databaseUrl,
  JWT_SECRET:      required('JWT_SECRET'),
  JWT_ACCESS_TTL:  process.env.JWT_ACCESS_TTL  ?? '15m',
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL ?? '7d',
  PORT:            parseInt(process.env.PORT ?? '3001', 10),
  NODE_ENV:        process.env.NODE_ENV ?? 'development',
  CORS_ORIGIN:     process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? 'http://localhost:3000',
  BCRYPT_ROUNDS:   parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
  IS_PROD:         process.env.NODE_ENV === 'production',
} as const;
