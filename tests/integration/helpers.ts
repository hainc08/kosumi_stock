// tests/integration/helpers.ts
// Utility functions dùng chung cho tất cả test files

import request from 'supertest';
import app from '../../src/app';
import usersFixture from '../fixtures/users.json';

type RoleAlias = 'admin' | 'manager' | 'accountant' | 'staff' | 'viewer';

// Cache tokens để không login lại nhiều lần trong 1 suite
const tokenCache: Partial<Record<RoleAlias, string>> = {};

/**
 * Đăng nhập và lấy accessToken thực từ API
 * @example const token = await loginAs('accountant')
 */
export async function loginAs(role: RoleAlias): Promise<string> {
  if (tokenCache[role]) return tokenCache[role]!;

  const user = usersFixture.users.find((u) => u.id_alias === role)!;
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: user.username, password: user.password });

  if (res.status !== 200) {
    throw new Error(`loginAs('${role}') failed: ${JSON.stringify(res.body)}`);
  }

  tokenCache[role] = res.body.data.accessToken;
  return tokenCache[role]!;
}

/** Reset token cache — gọi trong beforeEach nếu cần fresh token */
export function clearTokenCache() {
  Object.keys(tokenCache).forEach((k) => delete tokenCache[k as RoleAlias]);
}

/**
 * Tạo authenticated supertest request
 * @example await authed('manager').post('/api/receipts/:id/approve').send({})
 */
export function authed(role: RoleAlias) {
  return {
    get:    async (url: string) => {
      const token = await loginAs(role);
      return request(app).get(url).set('Authorization', `Bearer ${token}`);
    },
    post:   async (url: string) => {
      const token = await loginAs(role);
      return request(app).post(url).set('Authorization', `Bearer ${token}`);
    },
    put:    async (url: string) => {
      const token = await loginAs(role);
      return request(app).put(url).set('Authorization', `Bearer ${token}`);
    },
    delete: async (url: string) => {
      const token = await loginAs(role);
      return request(app).delete(url).set('Authorization', `Bearer ${token}`);
    },
  };
}

/**
 * Assert response thành công chuẩn API format
 */
export function expectSuccess(res: request.Response, statusCode = 200) {
  expect(res.status).toBe(statusCode);
  expect(res.body.success).toBe(true);
  expect(res.body.data).toBeDefined();
  return res.body.data;
}

/**
 * Assert response lỗi chuẩn API format
 */
export function expectError(res: request.Response, code: string, statusCode: number) {
  expect(res.status).toBe(statusCode);
  expect(res.body.success).toBe(false);
  expect(res.body.error.code).toBe(code);
}

/**
 * Helper: tạo phiếu nhập đầy đủ và approve trong 1 bước
 * Trả về receipt đã APPROVED
 */
export async function createAndApproveReceipt(items: { productId: string; quantity: number }[]) {
  // 1. Accountant tạo
  const createRes = await (await authed('accountant').post('/api/receipts'))
    .send({
      receiptDate: '2026-05-18',
      supplier: 'Test Supplier',
      items: items.map((i) => ({ ...i, unitPrice: 0 })),
    });
  const receipt = expectSuccess(createRes, 201);

  // 2. Submit
  const submitRes = await (await authed('accountant').post(`/api/receipts/${receipt.id}/submit`)).send();
  expectSuccess(submitRes);

  // 3. Manager approve
  const approveRes = await (await authed('manager').post(`/api/receipts/${receipt.id}/approve`)).send();
  return expectSuccess(approveRes);
}

/**
 * Helper: tạo phiếu xuất đầy đủ và confirm trong 1 bước
 */
export async function createAndConfirmIssue(
  items: { productId: string; requestedQty: number }[],
  confirmItems?: { itemId: string; actualQty: number }[],
) {
  // 1. Accountant tạo
  const createRes = await (await authed('accountant').post('/api/issues'))
    .send({ issueDate: '2026-05-18', recipient: 'Test User', items });
  const issue = expectSuccess(createRes, 201);

  // 2. Submit
  await (await authed('accountant').post(`/api/issues/${issue.id}/submit`)).send();

  // 3. Manager approve
  await (await authed('manager').post(`/api/issues/${issue.id}/approve`)).send();

  // 4. Staff confirm
  const confirmPayload = confirmItems ?? issue.items.map((item: any) => ({
    itemId:    item.id,
    actualQty: item.requestedQty, // mặc định actual = requested
  }));
  const confirmRes = await (await authed('staff').post(`/api/issues/${issue.id}/confirm`))
    .send({ items: confirmPayload });

  return expectSuccess(confirmRes);
}
