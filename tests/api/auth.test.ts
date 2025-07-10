/**
 * @vitest-environment node
 * @file 针对用户认证相关 API 的测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCollection } from '$lib/server/db/db';
import { createUser, findUserByEmail } from '$lib/server/db/userCollection';
import { createSession, deleteSessionById } from '$lib/server/db/sessionCollection';
import { saveRegisterCode, checkRegisterCode } from '$lib/server/db/verifyCode';

// 模拟邮件发送功能
vi.mock('$lib/server/utils/sendMail', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined)
}));

// 模拟 SvelteKit 的 RequestEvent
const createMockRequestEvent = (body: any, cookies: Record<string, any> = {}) => ({
  request: {
    json: async () => body,
    formData: async () => {
      const formData = new FormData();
      Object.keys(body).forEach(key => {
        formData.append(key, body[key]);
      });
      return formData;
    }
  },
  cookies: {
    get: (name: string) => cookies[name],
    set: (name: string, value: string, options: any) => {
      cookies[name] = value;
    },
    delete: (name: string, options: any) => {
      delete cookies[name];
    }
  },
  locals: { user: null }
});

const TEST_USER = {
  name: '测试用户',
  email: 'test@example.com',
  password: 'testpassword123'
};

beforeEach(async () => {
  // 清空相关集合
  const users = await getCollection('users');
  await users.deleteMany({});
  const sessions = await getCollection('sessions');
  await sessions.deleteMany({});
  const codes = await getCollection('register_codes');
  await codes.deleteMany({});
});

afterEach(async () => {
  // 清理测试数据
  const users = await getCollection('users');
  await users.deleteMany({});
  const sessions = await getCollection('sessions');
  await sessions.deleteMany({});
  const codes = await getCollection('register_codes');
  await codes.deleteMany({});
});

describe('认证 API 测试', () => {
  describe('POST /register', () => {
    it('应拒绝重复的邮箱', async () => {
      // 先创建一个用户
      await createUser(TEST_USER);

      const { POST } = await import('../../src/routes/register/+server');
      const event = createMockRequestEvent(TEST_USER);

      const response = await POST(event as any);
      const result = await response.json();

      expect(response.status).toBe(409);
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists'); // 修改期望的消息
    });
  });
});
