import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
  test: {
    env: {
      MONGODB_URL: 'mongodb://localhost:27017',
      MONGODB_DB_NAME: 'synapse-test-db',
    },
    globals: true,
    deps: {
      inline: [/\$lib/],
    },
  },
  optimizeDeps: {
    include: ['$lib/server/articleCollection', '$lib/server/userCollection', '$lib/server/sessionCollection'],
  },
  ssr: {
    noExternal: [/\$lib/],
  },
  resolve: {
    alias: {
      '$lib': path.resolve(__dirname, './src/lib')
    },
  },
});