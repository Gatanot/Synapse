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

  it('不应创建重复邮箱的用户', async () => {
    // 创建第一个用户
    const result1 = await userDb.createUser({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(result1.error).toBeNull();

    // 尝试创建相同邮箱的用户
    const result2 = await userDb.createUser({
      name: '另一个用户',
      email: TEST_EMAIL,
      password: 'anotherpassword',
    });
    expect(result2.error).toBeDefined();
    expect(result2.error?.code).toBe('EMAIL_EXISTS');

    // 清理
    if (result1.data?.insertedId) {
      await userDb.deleteUser(result1.data.insertedId.toString());
    }
  });

  it('应能更新用户资料', async () => {
    const createRes = await userDb.createUser({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const userId = createRes.data!.insertedId.toString();

    const updateResult = await userDb.updateUserProfile(userId, {
      name: '更新后的用户名',
      signature: '新的个人签名'
    });

    expect(updateResult.error).toBeNull();
    expect(updateResult.data?.modifiedCount).toBe(1);

    // 验证更新
    const user = await userDb.findUserById(userId);
    expect(user.data?.name).toBe('更新后的用户名');
    expect(user.data?.signature).toBe('新的个人签名');

    await userDb.deleteUser(userId);
  });

  it('应能更新用户邮箱', async () => {
    const createRes = await userDb.createUser({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const userId = createRes.data!.insertedId.toString();

    const newEmail = 'newemail@example.com';
    const updateResult = await userDb.updateUserProfile(userId, {
      email: newEmail
    });

    expect(updateResult.error).toBeNull();

    // 验证更新
    const user = await userDb.findUserById(userId);
    expect(user.data?.email).toBe(newEmail);

    await userDb.deleteUser(userId);
  });

  it('不应更新为已存在的邮箱', async () => {
    // 创建两个用户
    const user1Res = await userDb.createUser({
      name: '用户1',
      email: 'user1@example.com',
      password: TEST_PASSWORD,
    });
    const user2Res = await userDb.createUser({
      name: '用户2',
      email: 'user2@example.com',
      password: TEST_PASSWORD,
    });

    const user1Id = user1Res.data!.insertedId.toString();
    const user2Id = user2Res.data!.insertedId.toString();

    // 尝试将用户2的邮箱更新为用户1的邮箱
    const updateResult = await userDb.updateUserProfile(user2Id, {
      email: 'user1@example.com'
    });

    expect(updateResult.error).toBeDefined();
    expect(updateResult.error?.code).toBe('EMAIL_EXISTS');

    // 清理
    await userDb.deleteUser(user1Id);
    await userDb.deleteUser(user2Id);
  });

  it('应能获取所有用户（分页）', async () => {
    // 创建多个用户
    const users = [];
    for (let i = 0; i < 5; i++) {
      const userRes = await userDb.createUser({
        name: `用户${i}`,
        email: `user${i}@example.com`,
        password: TEST_PASSWORD,
      });
      users.push(userRes.data!.insertedId.toString());
    }

    // 获取第一页（3个用户）
    const result = await userDb.getAllUsers({ page: 1, limit: 3 });
    
    expect(result.error).toBeNull();
    expect(result.data?.users).toHaveLength(3);
    expect(result.data?.total).toBe(5);

    // 清理
    for (const userId of users) {
      await userDb.deleteUser(userId);
    }
  });

  it('应能搜索用户', async () => {
    // 创建测试用户
    const users = [
      { name: 'John Doe', email: 'john@example.com', password: TEST_PASSWORD },
      { name: 'Jane Smith', email: 'jane@example.com', password: TEST_PASSWORD },
      { name: 'Bob Johnson', email: 'bob@test.com', password: TEST_PASSWORD }
    ];

    const userIds = [];
    for (const user of users) {
      const userRes = await userDb.createUser(user);
      userIds.push(userRes.data!.insertedId.toString());
    }

    // 按名字搜索
    const nameResult = await userDb.getAllUsers({ search: 'John' });
    expect(nameResult.data?.users).toHaveLength(2); // John Doe 和 Bob Johnson

    // 按邮箱搜索
    const emailResult = await userDb.getAllUsers({ search: 'example.com' });
    expect(emailResult.data?.users).toHaveLength(2); // john 和 jane

    // 清理
    for (const userId of userIds) {
      await userDb.deleteUser(userId);
    }
  });

  it('应能获取最近更新的用户', async () => {
    // 创建一个用户
    const userRes = await userDb.createUser({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const userId = userRes.data!.insertedId.toString();

    // 更新用户
    await userDb.updateUserProfile(userId, { name: '更新的名字' });

    // 获取最近更新的用户
    const result = await userDb.getRecentlyUpdatedUsers({ limit: 10, hours: 1 });
    
    expect(result.error).toBeNull();
    expect(result.data?.length).toBeGreaterThan(0);
    
    const updatedUser = result.data?.find(u => u._id.toString() === userId);
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.name).toBe('更新的名字');

    await userDb.deleteUser(userId);
  });

  it('应处理无效的用户ID', async () => {
    const result = await userDb.findUserById('invalid-id');
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('INVALID_ID');
  });

  it('应处理无效的邮箱格式', async () => {
    const result = await userDb.findUserByEmail('invalid-email');
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });

  it('删除不存在的用户应返回错误', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const result = await userDb.deleteUser(fakeId);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('NOT_FOUND');
  });

  it('创建的用户应有正确的默认值', async () => {
    const createRes = await userDb.createUser({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const userId = createRes.data!.insertedId.toString();

    const user = await userDb.findUserById(userId);
    expect(user.data?.articles).toEqual([]);
    expect(user.data?.likes).toEqual([]);
    expect(user.data?.signature).toBe('');
    expect(user.data?.createdAt).toBeInstanceOf(Date);
    expect(user.data?.updatedAt).toBeInstanceOf(Date);

    await userDb.deleteUser(userId);
  });
});