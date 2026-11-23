import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'api/src/**/*.test.ts'],
    setupFiles: ['api/test-setup.ts'],
    environment: 'node',
  },
});
