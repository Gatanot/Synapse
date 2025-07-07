/**
 * @vitest-environment node
 * @file 针对 src/lib/server/db/sessionCollection.ts 的单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import * as userDb from '$lib/server/db/userCollection';
import * as sessionDb from '$lib/server/db/sessionCollection';

const TEST_USER = {
  name: '会话用户',
  email: 'session_user@example.com',
  password: 'sessionpassword',
};
let userId: string;

beforeEach(async () => {
  await (await getCollection('sessions')).deleteMany({});
  await (await getCollection('users')).deleteMany({});
  await userDb.ensureUserIndexes();
  await sessionDb.ensureSessionIndexes();
  const userRes = await userDb.createUser(TEST_USER);
  userId = userRes.data!.insertedId!.toString();
});
afterEach(async () => {
  await (await getCollection('sessions')).deleteMany({});
  await (await getCollection('users')).deleteMany({});
});

describe('sessionCollection 会话数据库操作', () => {
  it('应能成功创建新会话', async () => {
    const result = await sessionDb.createSession(userId, {
      name: TEST_USER.name,
      email: TEST_USER.email,
      articles: [],
    }, 1000 * 60 * 10);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });

  it('应能根据ID查找会话', async () => {
    const createRes = await sessionDb.createSession(userId, {
      name: TEST_USER.name,
      email: TEST_USER.email,
      articles: [],
    }, 1000 * 60 * 10);
    const sessionId = createRes.data!.sessionId;
    const result = await sessionDb.findSessionById(sessionId);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?._id).toBe(sessionId);
  });

  it('应能删除会话', async () => {
    const createRes = await sessionDb.createSession(userId, {
      name: TEST_USER.name,
      email: TEST_USER.email,
      articles: [],
    }, 1000 * 60 * 10);
    const sessionId = createRes.data!.sessionId;
    const result = await sessionDb.deleteSessionById(sessionId);
    expect(result.error).toBeNull();
    expect(result.data?.deletedCount).toBe(1);
    const findResult = await sessionDb.findSessionById(sessionId);
    expect(findResult.data).toBeNull();
  });
}); 