// backend/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Chạy test file tuần tự (quan trọng — các test phụ thuộc nhau)
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },

    // Timeout dài hơn vì có DB operations
    testTimeout: 30_000,
    hookTimeout: 30_000,

    // Chạy theo thứ tự file (01_, 02_, ...)
    sequence: { sort: 'alphabetical' },

    // Mỗi file chạy trong isolation
    isolate: true,

    // Chỉ chạy integration tests (không e2e trong CI mặc định)
    include: ['tests/integration/**/*.test.ts'],

    // Dùng DATABASE_URL_TEST
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? '',
    },

    // Report
    reporter: ['verbose'],
  },
});
