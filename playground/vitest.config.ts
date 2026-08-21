import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const __dirname = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      fs: resolve(__dirname, 'src/shims/fs.ts'),
      path: resolve(__dirname, 'src/shims/path.ts'),
      crypto: resolve(__dirname, 'src/shims/crypto.ts'),
      buffer: resolve(__dirname, 'src/shims/buffer.ts'),
      'node:buffer': resolve(__dirname, 'src/shims/buffer.ts'),
      'node:child_process': resolve(__dirname, 'src/shims/child_process.ts'),
      child_process: resolve(__dirname, 'src/shims/child_process.ts'),
      '@autonomous-lifecycle-protocol-alp/parser': resolve(__dirname, '../parser/src/index.ts'),
    },
  },
});
