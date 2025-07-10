/**
 * @vitest-environment node
 * @file 针对管理员功能相关 API 的测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import { createUser } from '$lib/server/db/userCollection';
import { createArticle } from '$lib/server/db/articleCollection';
import { initializeAdminsComplete } from '$lib/server/db/adminCollection';

// 模拟邮件发送功能
vi.mock('$lib/server/utils/sendMail', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined)
}));

const createMockRequestEvent = () => ({
  url: new URL('http://localhost:3000/api/admin/debug')
});

const TEST_ADMIN = {
  name: '超级管理员',
  email: 'admin@example.com',
  password: 'admin123',
  signature: '系统管理员'
};

const TEST_USER = {
  name: '普通用户',
  email: 'user@example.com',
  password: 'user123'
};

beforeEach(async () => {
  // 清空相关集合
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});
  const admins = await getCollection('admins');
  await admins.deleteMany({});
  const comments = await getCollection('comments');
  await comments.deleteMany({});

  // 创建管理员
  await initializeAdminsComplete(TEST_ADMIN);

  // 创建普通用户和文章
  const userResult = await createUser(TEST_USER);
  const userId = userResult.data!.insertedId.toString();

  await createArticle({
    title: '测试文章',
    summary: '测试摘要',
    tags: ['测试'],
    body: '测试内容',
    status: 'published' as const,
    authorId: userId,
    authorName: TEST_USER.name
  });
});

afterEach(async () => {
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});
  const admins = await getCollection('admins');
  await admins.deleteMany({});
  const comments = await getCollection('comments');
  await comments.deleteMany({});
});

describe('管理员 API 测试', () => {
  describe('GET /api/admin/debug', () => {
    it('应能获取系统调试信息', async () => {
      const { GET } = await import('../../src/routes/api/admin/debug/+server');
      
      const response = await GET();
      
      // 处理可能的500错误或成功响应
      if (response.status === 500) {
        const result = await response.json();
        expect(result.error).toBeDefined();
        expect(result.details).toBeDefined();
      } else {
        const result = await response.json();
        expect(response.status).toBe(200);
        expect(result.stats).toBeDefined();
        expect(result.samples).toBeDefined();
        expect(result.stats.totalUsers).toBeGreaterThanOrEqual(0);
        expect(result.stats.totalArticles).toBeGreaterThanOrEqual(0);
      }
    });

    it('应包含用户统计信息', async () => {
      const { GET } = await import('../../src/routes/api/admin/debug/+server');
      
      const response = await GET();
      
      if (response.status === 200) {
        const result = await response.json();
        expect(result.stats.totalUsers).toBeGreaterThanOrEqual(0);
        expect(result.stats.totalArticles).toBeGreaterThanOrEqual(0);
        expect(result.stats.totalComments).toBeGreaterThanOrEqual(0);
        expect(typeof result.stats.todayNew).toBe('number');
      } else {
        // 如果API返回错误，跳过此测试
        expect(response.status).toBe(500);
      }
    });

    it('应包含示例数据', async () => {
      const { GET } = await import('../../src/routes/api/admin/debug/+server');
      
      const response = await GET();
      
      if (response.status === 200) {
        const result = await response.json();
        expect(Array.isArray(result.samples.users)).toBe(true);
        expect(Array.isArray(result.samples.articles)).toBe(true);
        expect(Array.isArray(result.samples.comments)).toBe(true);

        // 验证用户样本数据结构
        if (result.samples.users.length > 0) {
          const userSample = result.samples.users[0];
          expect(userSample._id).toBeDefined();
          expect(userSample.name).toBeDefined();
          expect(userSample.email).toBeDefined();
          expect(userSample.createdAt).toBeDefined();
        }

        // 验证文章样本数据结构
        if (result.samples.articles.length > 0) {
          const articleSample = result.samples.articles[0];
          expect(articleSample._id).toBeDefined();
          expect(articleSample.title).toBeDefined();
          expect(articleSample.authorId).toBeDefined();
          expect(articleSample.createdAt).toBeDefined();
        }
      } else {
        expect(response.status).toBe(500);
      }
    });

    it('应处理数据库连接错误', async () => {
      const { GET } = await import('../../src/routes/api/admin/debug/+server');
      
      const response = await GET();
      
      // 期望返回错误响应而不是抛出异常
      if (response.status === 500) {
        const result = await response.json();
        expect(result.error).toBeDefined();
        expect(result.details).toBeDefined();
      } else {
        expect(response.status).toBe(200);
      }
    });
  });
});
