/**
 * @vitest-environment node
 * @file 针对 src/lib/server/db/adminCollection.ts 的单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import * as userDb from '$lib/server/db/userCollection';
import * as adminDb from '$lib/server/db/adminCollection';

const TEST_USER = {
  name: '测试管理员',
  email: 'admin@example.com',
  password: 'adminpassword'
};

const TEST_SUPER_ADMIN = {
  name: '超级管理员',
  email: 'superadmin@example.com',
  password: 'superpassword',
  signature: '系统超级管理员'
};

let testUserId: string;

beforeEach(async () => {
  // 清空相关集合
  await (await getCollection('admins')).deleteMany({});
  await (await getCollection('users')).deleteMany({});
  
  // 确保索引
  await userDb.ensureUserIndexes();
  await adminDb.ensureAdminIndexes();
  
  // 创建测试用户
  const userRes = await userDb.createUser(TEST_USER);
  if (!userRes.data || !userRes.data.insertedId) {
    throw new Error('测试用户创建失败');
  }
  testUserId = userRes.data.insertedId.toString();
});

afterEach(async () => {
  await (await getCollection('admins')).deleteMany({});
  await (await getCollection('users')).deleteMany({});
});

describe('adminCollection 管理员数据库操作', () => {
  it('应能成功初始化管理员（使用现有用户）', async () => {
    const result = await adminDb.initializeAdmins(testUserId);
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?.insertedId).toBeDefined();
  });

  it('初始化管理员时应清空现有管理员数据', async () => {
    // 先创建一个管理员
    await adminDb.createAdmin(testUserId, 1);
    
    // 确认管理员已存在
    const beforeInit = await adminDb.getAllAdmins();
    expect(beforeInit.data).toHaveLength(1);
    
    // 重新初始化
    await adminDb.initializeAdmins(testUserId);
    
    // 确认只有一个超级管理员
    const afterInit = await adminDb.getAllAdmins();
    expect(afterInit.data).toHaveLength(1);
    expect(afterInit.data?.[0].priority).toBe(0); // 超级管理员
  });

  it('应能完整初始化管理员（创建新用户+管理员）', async () => {
    const result = await adminDb.initializeAdminsComplete(TEST_SUPER_ADMIN);
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?.userId).toBeDefined();
    expect(result.data?.adminResult.insertedId).toBeDefined();
    
    // 验证用户已创建
    const user = await userDb.findUserById(result.data!.userId);
    expect(user.data).toBeDefined();
    expect(user.data?.email).toBe(TEST_SUPER_ADMIN.email.toLowerCase());
    expect(user.data?.signature).toBe(TEST_SUPER_ADMIN.signature);
    
    // 验证管理员已创建
    const admin = await adminDb.getAdminByUserId(result.data!.userId);
    expect(admin.data).toBeDefined();
    expect(admin.data?.priority).toBe(0); // 超级管理员
  });

  it('应能使用现有用户完整初始化管理员', async () => {
    const result = await adminDb.initializeAdminsComplete({
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: 'newpassword' // 密码会被忽略，因为用户已存在
    });
    
    expect(result.error).toBeNull();
    expect(result.data?.userId).toBe(testUserId);
  });

  it('应能创建普通管理员', async () => {
    const result = await adminDb.createAdmin(testUserId, 1);
    
    expect(result.error).toBeNull();
    expect(result.data?.insertedId).toBeDefined();
    
    // 验证管理员信息
    const admin = await adminDb.getAdminByUserId(testUserId);
    expect(admin.data?.priority).toBe(1);
  });

  it('应能创建超级管理员', async () => {
    const result = await adminDb.createAdmin(testUserId, 0);
    
    expect(result.error).toBeNull();
    
    const admin = await adminDb.getAdminByUserId(testUserId);
    expect(admin.data?.priority).toBe(0);
  });

  it('不应重复创建管理员', async () => {
    // 第一次创建成功
    const firstResult = await adminDb.createAdmin(testUserId, 1);
    expect(firstResult.error).toBeNull();
    
    // 第二次创建应该失败
    const secondResult = await adminDb.createAdmin(testUserId, 1);
    expect(secondResult.error).toBeDefined();
    expect(secondResult.error?.code).toBe('ADMIN_EXISTS');
  });

  it('创建管理员时应验证用户存在', async () => {
    const fakeUserId = '507f1f77bcf86cd799439011';
    
    const result = await adminDb.createAdmin(fakeUserId, 1);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('USER_NOT_FOUND');
  });

  it('应能获取所有管理员', async () => {
    // 创建多个管理员
    await adminDb.createAdmin(testUserId, 0); // 超级管理员
    
    // 创建另一个用户和普通管理员
    const user2Res = await userDb.createUser({
      name: '普通管理员',
      email: 'admin2@example.com',
      password: 'password'
    });
    const user2Id = user2Res.data!.insertedId.toString();
    await adminDb.createAdmin(user2Id, 1);
    
    const result = await adminDb.getAllAdmins();
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    
    // 应该按优先级排序，超级管理员在前
    expect(result.data?.[0].priority).toBe(0);
    expect(result.data?.[1].priority).toBe(1);
  });

  it('应能根据用户ID获取管理员信息', async () => {
    await adminDb.createAdmin(testUserId, 1);
    
    const result = await adminDb.getAdminByUserId(testUserId);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?.userId.toString()).toBe(testUserId);
  });

  it('获取不存在的管理员应返回null', async () => {
    const result = await adminDb.getAdminByUserId(testUserId);
    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it('应能删除管理员', async () => {
    await adminDb.createAdmin(testUserId, 1);
    
    const deleteResult = await adminDb.deleteAdminByUserId(testUserId);
    expect(deleteResult.error).toBeNull();
    expect(deleteResult.data?.deletedCount).toBe(1);
    
    // 验证管理员已删除
    const admin = await adminDb.getAdminByUserId(testUserId);
    expect(admin.data).toBeNull();
  });

  it('应能正确检查用户是否为管理员', async () => {
    // 普通用户
    let isAdmin = await adminDb.isAdmin(testUserId);
    expect(isAdmin.data).toBe(false);
    
    // 创建管理员后
    await adminDb.createAdmin(testUserId, 1);
    isAdmin = await adminDb.isAdmin(testUserId);
    expect(isAdmin.data).toBe(true);
  });

  it('应能正确检查用户是否为超级管理员', async () => {
    // 创建普通管理员
    await adminDb.createAdmin(testUserId, 1);
    let isSuperAdmin = await adminDb.isSuperAdmin(testUserId);
    expect(isSuperAdmin.data).toBe(false);
    
    // 删除后重新创建为超级管理员
    await adminDb.deleteAdminByUserId(testUserId);
    await adminDb.createAdmin(testUserId, 0);
    isSuperAdmin = await adminDb.isSuperAdmin(testUserId);
    expect(isSuperAdmin.data).toBe(true);
  });

  it('检查不存在用户的管理员状态应返回false', async () => {
    const fakeUserId = '507f1f77bcf86cd799439011';
    
    const isAdmin = await adminDb.isAdmin(fakeUserId);
    expect(isAdmin.data).toBe(false);
    
    const isSuperAdmin = await adminDb.isSuperAdmin(fakeUserId);
    expect(isSuperAdmin.data).toBe(false);
  });
});
