import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'tests/**/*.spec.ts'],
    exclude: ['tests/e2e/**'],
    root: '.',
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
  },
});
