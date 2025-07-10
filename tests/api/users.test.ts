/**
 * @vitest-environment node
 * @file 针对用户相关 API 的测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import { createUser } from '$lib/server/db/userCollection';

// 模拟邮件发送功能
vi.mock('$lib/server/utils/sendMail', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined)
}));

const TEST_USER = {
  name: '测试用户',
  email: 'test@example.com',
  password: 'testpassword123'
};

let testUserId: string;

beforeEach(async () => {
  // 清空相关集合
  const users = await getCollection('users');
  await users.deleteMany({});

  // 创建测试用户
  const userResult = await createUser(TEST_USER);
  testUserId = userResult.data!.insertedId.toString();
});

afterEach(async () => {
  const users = await getCollection('users');
  await users.deleteMany({});
});

describe('用户 API 测试', () => {
  describe('GET /api/users/[id]/exists', () => {
    it('应能检查用户是否存在', async () => {
      const { GET } = await import('../../src/routes/api/users/[id]/exists/+server');
      
      const event = { params: { id: testUserId } };
      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.exists).toBe(true);
    });

    it('应正确识别不存在的用户', async () => {
      const { GET } = await import('../../src/routes/api/users/[id]/exists/+server');
      
      const fakeId = '507f1f77bcf86cd799439011';
      const event = { params: { id: fakeId } };
      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.exists).toBe(false);
    });

    it('应处理无效的用户ID', async () => {
      const { GET } = await import('../../src/routes/api/users/[id]/exists/+server');
      
      const event = { params: { id: 'invalid-id' } };
      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.exists).toBe(false);
    });
  });
});
