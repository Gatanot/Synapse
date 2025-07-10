import { vi } from 'vitest';

// 模拟环境变量
vi.mock('$env/static/private', () => ({
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb://localhost:27017',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'synapse_test',
}));

// 模拟邮件发送
vi.mock('$lib/server/utils/sendMail', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined)
}));

// 模拟 SvelteKit 错误处理
vi.mock('@sveltejs/kit', async () => {
  const actual = await vi.importActual('@sveltejs/kit');
  return {
    ...actual,
    error: (status: number, message: string) => {
      const err = new Error(message);
      (err as any).status = status;
      throw err;
    }
  };
});
