/**
 * @vitest-environment node
 * @file 针对 src/lib/server/db/database.ts 的单元测试
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { getClient } from '$lib/server/db';
import { getCollection } from '$lib/server/db/db';
import { ensureAllIndexes, initializeDatabase } from '$lib/server/db/database';

beforeAll(async () => {
  // 确保数据库连接
  await initializeDatabase();
});

afterAll(async () => {
  // 关闭数据库连接
  await getClient().close();
});

beforeEach(async () => {
  // 清空所有相关集合，保证每个测试用例独立
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});
  const sessions = await getCollection('sessions');
  await sessions.deleteMany({});
  const comments = await getCollection('comments');
  await comments.deleteMany({});
  const admins = await getCollection('admins');
  await admins.deleteMany({});
  const messages = await getCollection('messages');
  await messages.deleteMany({});
  const codes = await getCollection('register_codes');
  await codes.deleteMany({});
});

afterEach(async () => {
  // 再次清空，防止残留
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});
  const sessions = await getCollection('sessions');
  await sessions.deleteMany({});
  const comments = await getCollection('comments');
  await comments.deleteMany({});
  const admins = await getCollection('admins');
  await admins.deleteMany({});
  const messages = await getCollection('messages');
  await messages.deleteMany({});
  const codes = await getCollection('register_codes');
  await codes.deleteMany({});
});

describe('database.ts 数据库初始化与索引', () => {
  it('ensureAllIndexes 应能成功执行且无异常', async () => {
    await expect(ensureAllIndexes()).resolves.not.toThrow();
  });

  it('ensureAllIndexes 应为 users 集合创建唯一索引', async () => {
    await ensureAllIndexes();
    const usersCollection = await getCollection('users');
    const indexes = await usersCollection.indexes();
    const emailIndex = indexes.find(idx => idx.name === 'email_1');
    expect(emailIndex).toBeDefined();
    if (emailIndex) expect(emailIndex.unique).toBe(true);
  });

  it('ensureAllIndexes 应为 sessions 集合创建 TTL 索引', async () => {
    await ensureAllIndexes();
    const sessionsCollection = await getCollection('sessions');
    const indexes = await sessionsCollection.indexes();
    const expiresAtIndex = indexes.find(idx => idx.key.expiresAt === 1);
    expect(expiresAtIndex).toBeDefined();
    if (expiresAtIndex) expect(expiresAtIndex.expireAfterSeconds).toBe(0);
  });

  it('ensureAllIndexes 应为 articles 集合创建必要索引', async () => {
    await ensureAllIndexes();
    const articlesCollection = await getCollection('articles');
    const indexes = await articlesCollection.indexes();
    
    const authorIdIndex = indexes.find(idx => idx.key.authorId === 1);
    expect(authorIdIndex).toBeDefined();
    
    const tagsIndex = indexes.find(idx => idx.key.tags === 1);
    expect(tagsIndex).toBeDefined();
    
    const statusIndex = indexes.find(idx => idx.key.status === 1);
    expect(statusIndex).toBeDefined();
  });

  it('ensureAllIndexes 应为 comments 集合创建必要索引', async () => {
    await ensureAllIndexes();
    const commentsCollection = await getCollection('comments');
    const indexes = await commentsCollection.indexes();
    
    const articleIdIndex = indexes.find(idx => idx.key.articleId === 1);
    expect(articleIdIndex).toBeDefined();
    
    const authorIdIndex = indexes.find(idx => idx.key.authorId === 1);
    expect(authorIdIndex).toBeDefined();
    
    const createdAtIndex = indexes.find(idx => idx.key.createdAt === -1);
    expect(createdAtIndex).toBeDefined();
  });

  it('ensureAllIndexes 应为 admins 集合创建必要索引', async () => {
    await ensureAllIndexes();
    const adminsCollection = await getCollection('admins');
    const indexes = await adminsCollection.indexes();
    
    const userIdIndex = indexes.find(idx => idx.key.userId === 1);
    expect(userIdIndex).toBeDefined();
    if (userIdIndex) expect(userIdIndex.unique).toBe(true);
    
    const priorityIndex = indexes.find(idx => idx.key.priority === 1);
    expect(priorityIndex).toBeDefined();
  });

  it('ensureAllIndexes 应为 register_codes 集合创建 TTL 索引', async () => {
    await ensureAllIndexes();
    const codesCollection = await getCollection('register_codes');
    const indexes = await codesCollection.indexes();
    const expiresAtIndex = indexes.find(idx => idx.key.expiresAt === 1);
    expect(expiresAtIndex).toBeDefined();
    if (expiresAtIndex) expect(expiresAtIndex.expireAfterSeconds).toBe(0);
  });

  it('initializeDatabase 应能成功初始化数据库并创建索引', async () => {
    await expect(initializeDatabase()).resolves.not.toThrow();
  });
});