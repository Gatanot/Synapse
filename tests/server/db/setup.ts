import { vi } from 'vitest';
vi.mock('$env/static/private', () => ({
  MONGODB_URL: process.env.MONGODB_URL,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
})); 