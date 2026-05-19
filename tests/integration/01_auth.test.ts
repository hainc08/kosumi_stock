// tests/integration/01_auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma, resetDatabase, seedTestData, clearTokenCache } from './setup';
import { expectSuccess, expectError, loginAs } from './helpers';

beforeAll(async () => {
  await resetDatabase();
  await seedTestData();
});

afterAll(async () => {
  clearTokenCache();
  await prisma.$disconnect();
});

describe('Auth — Đăng nhập', () => {

  it('✅ Đăng nhập thành công với credentials đúng', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test_admin', password: 'Admin@123' });

    const data = expectSuccess(res);
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
    expect(data.user.role).toBe('ADMIN');
    expect(data.user).not.toHaveProperty('passwordHash'); // không lộ hash
  });

  it('❌ Đăng nhập sai mật khẩu → 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test_admin', password: 'WrongPassword' });

    expectError(res, 'INVALID_CREDENTIALS', 401);
  });

  it('❌ Đăng nhập username không tồn tại → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent_user', password: 'Any@123' });

    expectError(res, 'INVALID_CREDENTIALS', 401);
  });

  it('❌ Thiếu fields → 422 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test_admin' }); // thiếu password

    expectError(res, 'VALIDATION_ERROR', 422);
  });
});

describe('Auth — Token & Me', () => {

  it('✅ GET /api/auth/me trả về thông tin user hiện tại', async () => {
    const token = await loginAs('accountant');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    const data = expectSuccess(res);
    expect(data.username).toBe('test_accountant');
    expect(data.role).toBe('ACCOUNTANT');
  });

  it('❌ Không có token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expectError(res, 'UNAUTHORIZED', 401);
  });

  it('❌ Token giả mạo → 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer fake.token.here');
    expectError(res, 'UNAUTHORIZED', 401);
  });

  it('✅ POST /api/auth/refresh cấp token mới', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test_manager', password: 'Manager@123' });
    const { refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const data = expectSuccess(res);
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
  });
});
