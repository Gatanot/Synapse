/**
 * @vitest-environment node
 * @file 针对 src/lib/server/db/userCollection.ts 的单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import * as userDb from '$lib/server/db/userCollection';

const TEST_EMAIL = 'testuser@example.com';
const TEST_NAME = '测试用户';
const TEST_PASSWORD = 'testpassword123';

beforeEach(async () => {
  const col = await getCollection('users');
  await col.deleteMany({});
  await userDb.ensureUserIndexes();
});

afterEach(async () => {
  const col = await getCollection('users');
  await col.deleteMany({});
});

describe('userCollection 用户数据库操作', () => {
  it('应能成功创建新用户', async () => {
    const result = await userDb.createUser({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    // 清理
    const createdId = result.data?.insertedId?.toString();
    if (createdId) await userDb.deleteUser(createdId);
  });

  it('应能根据邮箱查找用户', async () => {
    await userDb.createUser({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const result = await userDb.findUserByEmail(TEST_EMAIL);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?.email).toBe(TEST_EMAIL);
    if (result.data?._id) await userDb.deleteUser(result.data._id.toString());
  });

  it('应能根据ID查找用户', async () => {
    const createRes = await userDb.createUser({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const createdId = createRes.data?.insertedId?.toString();
    expect(createdId).toBeDefined();
    const result = await userDb.findUserById(createdId!);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?._id?.toString()).toBe(createdId);
    if (createdId) await userDb.deleteUser(createdId);
  });

  it('应能删除用户', async () => {
    const createRes = await userDb.createUser({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const createdId = createRes.data?.insertedId?.toString();
    expect(createdId).toBeDefined();
    const result = await userDb.deleteUser(createdId!);
    expect(result.error).toBeNull();
    expect(result.data?.deletedCount).toBe(1);
    const findResult = await userDb.findUserById(createdId!);
    expect(findResult.data).toBeNull();
  });
}); 