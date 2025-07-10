/**
 * @vitest-environment node
 * @file 针对文章相关 API 的测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import { createUser } from '$lib/server/db/userCollection';
import { createArticle } from '$lib/server/db/articleCollection';

// 模拟邮件发送功能
vi.mock('$lib/server/utils/sendMail', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined)
}));

const createMockRequestEvent = (body: any, user: any = null, params: any = {}) => ({
  request: {
    json: async () => body,
    url: new URL('http://localhost:3000/api/test')
  },
  locals: { user },
  params,
  url: new URL('http://localhost:3000/api/test')
});

const TEST_USER = {
  name: '测试用户',
  email: 'test@example.com',
  password: 'testpassword123'
};

const TEST_ARTICLE = {
  title: '测试文章标题',
  summary: '这是一篇测试文章的摘要',
  tags: ['测试', 'API'],
  body: '这是测试文章的正文内容...',
  status: 'published' as const
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

describe('文章 API 测试', () => {
  describe('POST /api/articles', () => {
    it('应能创建新文章', async () => {
      const { POST } = await import('../../src/routes/api/articles/+server');
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

      const event = createMockRequestEvent(TEST_ARTICLE, mockUser);
      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Article created successfully'); // 修改期望的消息
      expect(result.article_id).toBeDefined();
    });

    it('应拒绝未登录用户创建文章', async () => {
      const { POST } = await import('../../src/routes/api/articles/+server');
      const event = createMockRequestEvent(TEST_ARTICLE);

      await expect(POST(event as any)).rejects.toThrow();
    });

    it('应验证文章标题长度', async () => {
      const { POST } = await import('../../src/routes/api/articles/+server');
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

      const invalidArticle = {
        ...TEST_ARTICLE,
        title: 'a'.repeat(201) // 超过200字符限制
      };

      const event = createMockRequestEvent(invalidArticle, mockUser);
      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.field).toBe('title');
    });
  });

  describe('GET /api/articles/[_id]', () => {
    it('应能获取文章详情', async () => {
      // 先创建一篇文章
      const articleResult = await createArticle({
        ...TEST_ARTICLE,
        authorId: testUserId,
        authorName: TEST_USER.name
      });
      const articleId = articleResult.data!.insertedId.toString();

      const { GET } = await import('../../src/routes/api/articles/[_id]/+server');
      const event = createMockRequestEvent({}, null, { _id: articleId });

      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result._id).toBe(articleId);
      expect(result.title).toBe(TEST_ARTICLE.title);
      expect(result.authorId).toBe(testUserId);
    });

    it('应处理不存在的文章ID', async () => {
      const { GET } = await import('../../src/routes/api/articles/[_id]/+server');
      const fakeId = '507f1f77bcf86cd799439011';
      const event = createMockRequestEvent({}, null, { _id: fakeId });

      await expect(GET(event as any)).rejects.toThrow();
    });
  });
});
