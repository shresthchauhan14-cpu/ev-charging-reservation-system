import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['../tests/**/*.test.ts'],
    globals: true,
    testTimeout: 20000,
    fileParallelism: false, // Ensures sequential execution to prevent lock contention on the persistent PostgreSQL database
  },
});
