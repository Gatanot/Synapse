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
});

afterEach(async () => {
  // 再次清空，防止残留
  const users = await getCollection('users');
  await users.deleteMany({});
  const articles = await getCollection('articles');
  await articles.deleteMany({});
  const sessions = await getCollection('sessions');
  await sessions.deleteMany({});
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

  it('initializeDatabase 应能成功初始化数据库并创建索引', async () => {
    await expect(initializeDatabase()).resolves.not.toThrow();
  });
}); 