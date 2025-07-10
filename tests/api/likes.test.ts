/**
 * @vitest-environment node
 * @file 针对点赞功能相关 API 的测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import { createUser } from '$lib/server/db/userCollection';
import { createArticle } from '$lib/server/db/articleCollection';

// 模拟邮件发送功能
vi.mock('$lib/server/utils/sendMail', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined)
}));

const createMockRequestEvent = (user: any = null, params: any = {}) => ({
  locals: { user },
  params
});

const TEST_USER = {
  name: '测试用户',
  email: 'test@example.com',
  password: 'testpassword123'
};

const TEST_ARTICLE = {
  title: '测试文章',
  summary: '测试摘要',
  tags: ['测试'],
  body: '测试内容',
  status: 'published' as const
};

let testUserId: string;
let testArticleId: string;

beforeEach(async () => {
  // 清空相关集合
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});
  const messages = await getCollection('messages');
  await messages.deleteMany({});

  // 创建测试用户和文章
  const userResult = await createUser(TEST_USER);
  testUserId = userResult.data!.insertedId.toString();

  const articleResult = await createArticle({
    ...TEST_ARTICLE,
    authorId: testUserId,
    authorName: TEST_USER.name
  });
  testArticleId = articleResult.data!.insertedId.toString();
});

afterEach(async () => {
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});
  const messages = await getCollection('messages');
  await messages.deleteMany({});
});

describe('点赞 API 测试', () => {
  describe('POST /api/articles/[_id]/like', () => {
    it('应能点赞文章', async () => {
      const { POST } = await import('../../src/routes/api/articles/[_id]/like/+server');
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

      const event = createMockRequestEvent(mockUser, { _id: testArticleId });
      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.action).toBe('liked');
      expect(result.message).toContain('点赞成功');
      expect(result.newLikesCount).toBe(1);
    });

    it('应能取消点赞', async () => {
      const { POST } = await import('../../src/routes/api/articles/[_id]/like/+server');
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

      // 第一次点赞
      await POST(createMockRequestEvent(mockUser, { _id: testArticleId }) as any);

      // 第二次点击应该取消点赞
      const event = createMockRequestEvent(mockUser, { _id: testArticleId });
      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.action).toBe('unliked');
      expect(result.message).toContain('取消点赞成功');
      expect(result.newLikesCount).toBe(0);
    });

    it('应拒绝未登录用户点赞', async () => {
      const { POST } = await import('../../src/routes/api/articles/[_id]/like/+server');
      
      const event = createMockRequestEvent(null, { _id: testArticleId });
      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.message).toContain('请先登录');
    });

    it('应验证文章ID格式', async () => {
      const { POST } = await import('../../src/routes/api/articles/[_id]/like/+server');
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

      const event = createMockRequestEvent(mockUser, { _id: 'invalid-id' });
      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('无效的文章 ID');
    });
  });
});
