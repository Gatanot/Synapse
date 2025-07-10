import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    env: {
      MONGODB_URL: 'mongodb://localhost:27017',
      MONGODB_DB_NAME: 'synapse-test-db',
    },
    globals: true,
    // 禁止并行运行测试文件，确保测试按顺序执行
    fileParallelism: false,
    // 禁止在单个文件内并行运行测试
    sequence: {
      concurrent: false,
    },
    deps: {
      inline: [/\$lib/],
    },
    setupFiles: ['tests/api/setup.ts'],
  },
  optimizeDeps: {
    include: ['$lib/server/articleCollection', '$lib/server/userCollection', '$lib/server/sessionCollection'],
  },
  ssr: {
    noExternal: [/\$lib/],
  },
  resolve: {
    alias: {
      '$lib': path.resolve(__dirname, './src/lib'),
      '$routes': path.resolve(__dirname, './src/routes')
    },
  },
});