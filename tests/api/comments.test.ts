/**
 * @vitest-environment node
 * @file 针对评论相关 API 的测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import { createUser } from '$lib/server/db/userCollection';
import { createArticle } from '$lib/server/db/articleCollection';

// 模拟邮件发送功能
vi.mock('$lib/server/utils/sendMail', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined)
}));

const createMockRequestEvent = (body: any = {}, user: any = null, url?: string) => ({
  request: {
    json: async () => body
  },
  locals: { user },
  url: new URL(url || 'http://localhost:3000/api/comments')
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
  const comments = await getCollection('comments');
  await comments.deleteMany({});
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
  const comments = await getCollection('comments');
  await comments.deleteMany({});
  const messages = await getCollection('messages');
  await messages.deleteMany({});
});

describe('评论 API 测试', () => {
  describe('POST /api/comments', () => {
    it('应能创建新评论', async () => {
      const { POST } = await import('../../src/routes/api/comments/+server');
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

      const commentData = {
        content: '这是一条测试评论',
        articleId: testArticleId
      };

      const event = createMockRequestEvent(commentData, mockUser);
      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Comment created successfully'); // 修改期望的消息
      expect(result.comment_id).toBeDefined();
    });

    it('应拒绝未登录用户创建评论', async () => {
      const { POST } = await import('../../src/routes/api/comments/+server');
      const commentData = {
        content: '这是一条测试评论',
        articleId: testArticleId
      };

      const event = createMockRequestEvent(commentData);
      
      await expect(POST(event as any)).rejects.toThrow();
    });

    it('应验证评论内容不为空', async () => {
      const { POST } = await import('../../src/routes/api/comments/+server');
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

      const commentData = {
        content: '',
        articleId: testArticleId
      };

      const event = createMockRequestEvent(commentData, mockUser);
      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.field).toBe('content');
    });

    it('应验证评论内容长度限制', async () => {
      const { POST } = await import('../../src/routes/api/comments/+server');
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

      const commentData = {
        content: 'a'.repeat(1001), // 超过1000字符限制
        articleId: testArticleId
      };

      const event = createMockRequestEvent(commentData, mockUser);
      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.field).toBe('content');
    });
  });

  describe('GET /api/comments', () => {
    it('应能获取文章评论列表', async () => {
      const { GET } = await import('../../src/routes/api/comments/+server');
      
      const url = `http://localhost:3000/api/comments?articleId=${testArticleId}`;
      const event = createMockRequestEvent({}, null, url);

      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.comments)).toBe(true);
    });

    it('应验证必需的 articleId 参数', async () => {
      const { GET } = await import('../../src/routes/api/comments/+server');
      
      const event = createMockRequestEvent({}, null, 'http://localhost:3000/api/comments');
      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Article ID is required');
    });
  });
});
