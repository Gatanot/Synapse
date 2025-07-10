/**
 * @vitest-environment node
 * @file 针对消息功能相关 API 的测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import { createUser } from '$lib/server/db/userCollection';
import { createArticle } from '$lib/server/db/articleCollection';

// 模拟邮件发送功能
vi.mock('$lib/server/utils/sendMail', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined)
}));

const createMockRequestEvent = (user: any = null, url?: string) => ({
  locals: { user },
  url: new URL(url || 'http://localhost:3000/api/message')
});

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
  const articles = await getCollection('articles');
  await articles.deleteMany({});
  const messages = await getCollection('messages');
  await messages.deleteMany({});

  // 创建测试用户
  const userResult = await createUser(TEST_USER);
  testUserId = userResult.data!.insertedId.toString();
});

afterEach(async () => {
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});
  const messages = await getCollection('messages');
  await messages.deleteMany({});
});

describe('消息 API 测试', () => {
  describe('GET /api/message', () => {
    it('应能获取用户消息列表', async () => {
      const { GET } = await import('../../src/routes/api/message/+server');
      const mockUser = {
        _id: testUserId,
        name: TEST_USER.name,
        email: TEST_USER.email,
        articles: [],
        likes: [],
        signature: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const event = createMockRequestEvent(mockUser);
      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.code).toBe(0);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('应拒绝未登录用户访问', async () => {
      const { GET } = await import('../../src/routes/api/message/+server');
      const event = createMockRequestEvent(null);

      await expect(GET(event as any)).rejects.toThrow();
    });
  });

  describe('PUT /api/message', () => {
    it('应能标记所有消息为已读', async () => {
      const { PUT } = await import('../../src/routes/api/message/+server');
      const mockUser = {
        _id: testUserId,
        name: TEST_USER.name,
        email: TEST_USER.email,
        articles: [],
        likes: [],
        signature: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const event = createMockRequestEvent(mockUser);
      const response = await PUT(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.code).toBe(0);
      expect(result.msg).toBe('ok');
    });
  });

  describe('DELETE /api/message', () => {
    it('应能删除所有已读消息', async () => {
      const { DELETE } = await import('../../src/routes/api/message/+server');
      const mockUser = {
        _id: testUserId,
        name: TEST_USER.name,
        email: TEST_USER.email,
        articles: [],
        likes: [],
        signature: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const event = createMockRequestEvent(mockUser);
      const response = await DELETE(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.code).toBe(0);
      expect(result.msg).toContain('已读消息已全部删除');
    });
  });
});
