/**
 * @vitest-environment node
 * @file 针对搜索功能相关 API 的测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import { createUser } from '$lib/server/db/userCollection';
import { createArticle } from '$lib/server/db/articleCollection';

// 模拟邮件发送功能
vi.mock('$lib/server/utils/sendMail', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined)
}));

const createMockRequestEvent = (url?: string) => ({
  url: new URL(url || 'http://localhost:3000/api/search')
});

const TEST_USER = {
  name: '测试用户',
  email: 'test@example.com',
  password: 'testpassword123'
};

const TEST_ARTICLES = [
  {
    title: 'JavaScript 基础教程',
    summary: '学习 JavaScript 编程语言的基础知识',
    tags: ['javascript', '编程', '教程'], // 修改为小写
    body: '这是一篇关于 JavaScript 基础的文章...',
    status: 'published' as const
  },
  {
    title: 'React 组件开发',
    summary: '深入了解 React 组件的开发方法',
    tags: ['react', '前端', '组件'], // 修改为小写
    body: '本文介绍 React 组件的各种开发技巧...',
    status: 'published' as const
  }
];

let testUserId: string;

beforeEach(async () => {
  // 清空相关集合
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});

  // 创建测试用户
  const userResult = await createUser(TEST_USER);
  testUserId = userResult.data!.insertedId.toString();

  // 创建测试文章
  for (const articleData of TEST_ARTICLES) {
    await createArticle({
      ...articleData,
      authorId: testUserId,
      authorName: TEST_USER.name
    });
  }
});

afterEach(async () => {
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});
});

describe('搜索 API 测试', () => {
  describe('GET /api/search', () => {
    it('应能搜索文章标题', async () => {
      const { GET } = await import('../../src/routes/api/search/+server');
      
      const url = 'http://localhost:3000/api/search?q=JavaScript&type=title';
      const event = createMockRequestEvent(url);

      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.articles)).toBe(true);
      expect(result.articles.length).toBeGreaterThan(0);
      expect(result.articles[0].title).toContain('JavaScript');
    });

    it('应能搜索文章标签', async () => {
      const { GET } = await import('../../src/routes/api/search/+server');
      
      const url = 'http://localhost:3000/api/search?q=react&type=tags'; // 使用小写搜索
      const event = createMockRequestEvent(url);

      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.articles)).toBe(true);
      expect(result.articles.length).toBeGreaterThan(0);
      expect(result.articles[0].tags).toContain('react'); // 期望小写的react
    });

    it('应能搜索文章内容', async () => {
      const { GET } = await import('../../src/routes/api/search/+server');
      
      const url = 'http://localhost:3000/api/search?q=组件&type=content';
      const event = createMockRequestEvent(url);

      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.articles)).toBe(true);
    });

    it('应能进行全文搜索', async () => {
      const { GET } = await import('../../src/routes/api/search/+server');
      
      const url = 'http://localhost:3000/api/search?q=JavaScript&type=all';
      const event = createMockRequestEvent(url);

      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.articles)).toBe(true);
    });

    it('应能按作者搜索', async () => {
      const { GET } = await import('../../src/routes/api/search/+server');
      
      const url = `http://localhost:3000/api/search?q=${TEST_USER.name}&type=author`;
      const event = createMockRequestEvent(url);

      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.articles)).toBe(true);
      expect(result.articles.length).toBe(2);
    });

    it('应验证搜索关键词', async () => {
      const { GET } = await import('../../src/routes/api/search/+server');
      
      const url = 'http://localhost:3000/api/search';
      const event = createMockRequestEvent(url);

      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('搜索关键词不能为空');
    });

    it('应处理空搜索结果', async () => {
      const { GET } = await import('../../src/routes/api/search/+server');
      
      const url = 'http://localhost:3000/api/search?q=不存在的内容&type=title';
      const event = createMockRequestEvent(url);

      const response = await GET(event as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.articles)).toBe(true);
      expect(result.articles.length).toBe(0);
    });
  });
});
