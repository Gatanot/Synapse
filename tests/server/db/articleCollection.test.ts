/**
 * @vitest-environment node
 * @file 针对 src/lib/server/db/articleCollection.ts 的单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCollection, ObjectId } from '$lib/server/db/db';
import * as userDb from '$lib/server/db/userCollection';
import * as articleDb from '$lib/server/db/articleCollection';

const TEST_USER = {
  name: '文章作者',
  email: 'article_author@example.com',
  password: 'authorpassword',
};
let authorId: string;
let authorName = TEST_USER.name;

beforeEach(async () => {
  await (await getCollection('articles')).deleteMany({});
  await (await getCollection('users')).deleteMany({});
  await userDb.ensureUserIndexes();
  await articleDb.ensureArticleIndexes();
  const userRes = await userDb.createUser(TEST_USER);
  if (!userRes.data || !userRes.data.insertedId) {
    throw new Error('用户创建失败，无法获取 insertedId');
  }
  authorId = userRes.data.insertedId.toString();
});
afterEach(async () => {
  await (await getCollection('articles')).deleteMany({});
  await (await getCollection('users')).deleteMany({});
});

describe('articleCollection 文章数据库操作', () => {
  it('应能成功创建新文章', async () => {
    const result = await articleDb.createArticle({
      title: '测试文章',
      summary: '这是一篇测试文章',
      tags: ['测试', 'vitest'],
      authorId,
      authorName,
      body: '文章内容',
      status: 'published',
    });
    if (result.error) {
      console.error('创建文章出错:', result.error);
    }
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });

  it('应能根据ID获取文章', async () => {
    const createRes = await articleDb.createArticle({
      title: '测试文章',
      summary: '这是一篇测试文章',
      tags: ['测试', 'vitest'],
      authorId,
      authorName,
      body: '文章内容',
      status: 'published',
    });
    if (!createRes.data || !createRes.data.insertedId) {
      throw new Error('文章创建失败，无法获取 insertedId: ' + (createRes.error ? JSON.stringify(createRes.error) : '未知错误'));
    }
    const articleId = createRes.data.insertedId.toString();
    const result = await articleDb.getArticleById(articleId);
    if (result.error) {
      console.error('获取文章出错:', result.error);
    }
    expect(result.error).toBeNull();
    expect(result.data?._id?.toString()).toBe(articleId);
  });

  it('应能获取最新文章列表', async () => {
    const createRes = await articleDb.createArticle({
      title: '测试文章',
      summary: '这是一篇测试文章',
      tags: ['测试', 'vitest'],
      authorId,
      authorName,
      body: '文章内容',
      status: 'published',
    });
    if (createRes.error) {
      console.error('创建文章出错:', createRes.error);
    }
    expect(createRes.error).toBeNull();
    const result = await articleDb.getLatestArticles({ limit: 5 });
    if (result.error) {
      console.error('获取最新文章列表出错:', result.error);
    }
    expect(result.error).toBeNull();
    expect(Array.isArray(result.data)).toBe(true);
  });
});