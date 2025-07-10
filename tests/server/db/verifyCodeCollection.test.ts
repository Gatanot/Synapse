/**
 * @vitest-environment node
 * @file 针对 src/lib/server/db/verifyCode.ts 的单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import * as verifyCodeDb from '$lib/server/db/verifyCode';

const TEST_EMAIL = 'test@example.com';
const TEST_CODE = '123456';
const EXPIRE_SECONDS = 300; // 5分钟

beforeEach(async () => {
  const col = await getCollection('register_codes');
  await col.deleteMany({});
  await verifyCodeDb.ensureRegisterCodeIndexes();
});

afterEach(async () => {
  const col = await getCollection('register_codes');
  await col.deleteMany({});
});

describe('verifyCodeCollection 验证码数据库操作', () => {
  it('应能成功保存验证码', async () => {
    await expect(verifyCodeDb.saveRegisterCode(TEST_EMAIL, TEST_CODE, EXPIRE_SECONDS))
      .resolves.not.toThrow();
    
    // 验证验证码已保存
    const collection = await getCollection('register_codes');
    const savedCode = await collection.findOne({ email: TEST_EMAIL });
    expect(savedCode).toBeDefined();
    expect(savedCode?.code).toBe(TEST_CODE);
    expect(savedCode?.email).toBe(TEST_EMAIL);
  });

  it('应能更新同一邮箱的验证码', async () => {
    // 保存第一个验证码
    await verifyCodeDb.saveRegisterCode(TEST_EMAIL, '111111', EXPIRE_SECONDS);
    
    // 保存第二个验证码（应该覆盖第一个）
    await verifyCodeDb.saveRegisterCode(TEST_EMAIL, TEST_CODE, EXPIRE_SECONDS);
    
    const collection = await getCollection('register_codes');
    const codes = await collection.find({ email: TEST_EMAIL }).toArray();
    
    // 应该只有一条记录
    expect(codes).toHaveLength(1);
    expect(codes[0].code).toBe(TEST_CODE);
  });

  it('应能成功校验正确的验证码', async () => {
    await verifyCodeDb.saveRegisterCode(TEST_EMAIL, TEST_CODE, EXPIRE_SECONDS);
    
    const isValid = await verifyCodeDb.checkRegisterCode(TEST_EMAIL, TEST_CODE);
    expect(isValid).toBe(true);
    
    // 验证码应该在校验后被删除
    const collection = await getCollection('register_codes');
    const savedCode = await collection.findOne({ email: TEST_EMAIL });
    expect(savedCode).toBeNull();
  });

  it('应能拒绝错误的验证码', async () => {
    await verifyCodeDb.saveRegisterCode(TEST_EMAIL, TEST_CODE, EXPIRE_SECONDS);
    
    const isValid = await verifyCodeDb.checkRegisterCode(TEST_EMAIL, '999999');
    expect(isValid).toBe(false);
    
    // 原验证码应该仍然存在
    const collection = await getCollection('register_codes');
    const savedCode = await collection.findOne({ email: TEST_EMAIL });
    expect(savedCode).toBeDefined();
  });

  it('应能拒绝过期的验证码', async () => {
    // 保存一个1秒过期的验证码
    await verifyCodeDb.saveRegisterCode(TEST_EMAIL, TEST_CODE, 0);
    
    // 等待一小段时间确保过期
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const isValid = await verifyCodeDb.checkRegisterCode(TEST_EMAIL, TEST_CODE);
    expect(isValid).toBe(false);
  });

  it('应能拒绝不存在的邮箱验证码', async () => {
    const isValid = await verifyCodeDb.checkRegisterCode('nonexistent@example.com', TEST_CODE);
    expect(isValid).toBe(false);
  });

  it('验证码过期时间应该正确设置', async () => {
    const startTime = Date.now();
    await verifyCodeDb.saveRegisterCode(TEST_EMAIL, TEST_CODE, EXPIRE_SECONDS);
    
    const collection = await getCollection('register_codes');
    const savedCode = await collection.findOne({ email: TEST_EMAIL });
    
    expect(savedCode).toBeDefined();
    if (savedCode) {
      const expiresAt = savedCode.expiresAt.getTime();
      const expectedExpiry = startTime + EXPIRE_SECONDS * 1000;
      
      // 允许5秒的误差
      expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(5000);
    }
  });
});
