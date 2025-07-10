/**
 * @vitest-environment node
 * @file 针对草稿相关 API 的测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import { createUser } from '$lib/server/db/userCollection';
import { createArticle } from '$lib/server/db/articleCollection';

// 模拟邮件发送功能
vi.mock('$lib/server/utils/sendMail', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined)
}));

const createMockRequestEvent = (body: any = {}, user: any = null, params: any = {}) => ({
  request: {
    json: async () => body,
    url: new URL('http://localhost:3000/api/test')
  },
  locals: { user },
  params
});

const TEST_USER = {
  name: '测试用户',
  email: 'test@example.com',
  password: 'testpassword123'
};

const TEST_DRAFT = {
  title: '测试草稿标题',
  summary: '这是一篇测试草稿的摘要',
  tags: ['测试', '草稿'],
  body: '这是测试草稿的正文内容...',
  status: 'draft' as const
};

let testUserId: string;
let testDraftId: string;

beforeEach(async () => {
  // 清空相关集合
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});

  // 创建测试用户
  const userResult = await createUser(TEST_USER);
  testUserId = userResult.data!.insertedId.toString();

  // 创建测试草稿
  const draftResult = await createArticle({
    ...TEST_DRAFT,
    authorId: testUserId,
    authorName: TEST_USER.name
  });
  testDraftId = draftResult.data!.insertedId.toString();
});

afterEach(async () => {
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});
});

describe('草稿 API 测试', () => {
  describe('GET /api/drafts', () => {
    it('应能获取用户草稿列表', async () => {
      const { GET } = await import('../../src/routes/api/drafts/+server');
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

      const event = { locals: { user: mockUser } };
      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.drafts)).toBe(true);
    });

    it('应拒绝未登录用户访问', async () => {
      const { GET } = await import('../../src/routes/api/drafts/+server');
      const event = { locals: { user: null } };

      await expect(GET(event as any)).rejects.toThrow();
    });
  });

  describe('PUT /api/drafts/[_id]', () => {
    it('应能更新草稿', async () => {
      const { PUT } = await import('../../src/routes/api/drafts/[_id]/+server');
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

      const updateData = {
        title: '更新的草稿标题',
        summary: '更新的摘要',
        tags: ['更新', '草稿'],
        body: '更新的内容'
      };

      const event = {
        request: { json: async () => updateData },
        locals: { user: mockUser },
        params: { _id: testDraftId }
      };
      const response = await PUT(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Draft updated successfully');
    });

    it('应验证草稿作者权限', async () => {
      // 创建另一个用户
      const otherUserResult = await createUser({
        name: '其他用户',
        email: 'other@example.com',
        password: 'password123'
      });
      const otherUserId = otherUserResult.data!.insertedId.toString();

      const { PUT } = await import('../../src/routes/api/drafts/[_id]/+server');
      const mockUser = {
        _id: otherUserId,
        name: '其他用户',
        email: 'other@example.com',
        articles: [],
        likes: [],
        signature: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updateData = {
        title: '更新的草稿标题'
      };

      const event = {
        request: { json: async () => updateData },
        locals: { user: mockUser },
        params: { _id: testDraftId }
      };

      await expect(PUT(event as any)).rejects.toThrow();
    });
  });

  describe('POST /api/drafts/[_id]/publish', () => {
    it('应能发布草稿', async () => {
      const { POST } = await import('../../src/routes/api/drafts/[_id]/publish/+server');
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

      const event = {
        locals: { user: mockUser },
        params: { _id: testDraftId }
      };
      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Draft published successfully');
      expect(result.articleId).toBe(testDraftId);
    });

    it('应拒绝发布不完整的草稿', async () => {
      // 创建一个不完整的草稿
      const incompleteDraft = await createArticle({
        title: '',
        summary: '',
        tags: ['测试'],
        body: '',
        status: 'draft' as const,
        authorId: testUserId,
        authorName: TEST_USER.name
      });
      const incompleteDraftId = incompleteDraft.data!.insertedId.toString();

      const { POST } = await import('../../src/routes/api/drafts/[_id]/publish/+server');
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

      const event = {
        locals: { user: mockUser },
        params: { _id: incompleteDraftId }
      };
      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Draft is incomplete');
    });
  });

  describe('DELETE /api/drafts/[_id]', () => {
    it('应能删除草稿', async () => {
      const { DELETE } = await import('../../src/routes/api/drafts/[_id]/+server');
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

      const event = {
        locals: { user: mockUser },
        params: { _id: testDraftId }
      };
      const response = await DELETE(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Draft deleted successfully');
    });
  });
});
