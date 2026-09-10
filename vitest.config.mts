import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  test: {
    include: [
      'parser/tests/**/*.test.ts',
      'cli/tests/**/*.test.ts',
      'mcp-server/tests/**/*.test.ts',
      'sdk/typescript/test/**/*.test.ts',
      'tests/**/*.test.ts',
      'tests/compliance/**/*.test.ts',
      'sham/tests/**/*.test.{ts,tsx}',
      'commercial/alp-platform/tests/**/*.test.ts',
      'commercial/alp-server/tests/**/*.test.js',
      'vscode/**/*.test.ts',
    ],
    exclude: ['playground/src/__tests__/**/*.test.tsx', 'commercial/alp-server/tests/**/*.test.js'],
    environment: 'node',
    environmentMatchGlobs: [
      ['sham/tests/**/*.tsx', 'jsdom'],
    ],
    setupFiles: ['sham/tests/setup.ts'],
    testTimeout: 60000,
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    reportsDirectory: './coverage',
    include: [
      'sdk/typescript/src/**/*.ts',
      'mcp-server/src/**/*.ts',
      'vscode/server/src/**/*.ts',
      'cli/src/**/*.ts',
      'parser/src/**/*.ts',
      'sham/src/**/*.ts',
      'sham/src/**/*.tsx',
    ],
    exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
  },
  resolve: {
    alias: {
      '@autonomous-lifecycle-protocol-alp/parser': resolve('./parser/src/index.ts'),
      '@autonomous-lifecycle-protocol-alp/sdk': resolve('./sdk/typescript/src/index.ts'),
      '@autonomous-lifecycle-protocol-alp/platform': resolve('./commercial/alp-platform/src/index.ts'),
    },
  },
});

