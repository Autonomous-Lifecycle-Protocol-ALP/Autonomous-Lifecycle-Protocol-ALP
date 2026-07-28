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
      'tests/compliance/**/*.test.ts',
      'sham/tests/**/*.test.ts',
    ],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@autonomous-lifecycle-protocol-alp/parser': resolve('./parser/src/index.ts'),
    },
  },
});

