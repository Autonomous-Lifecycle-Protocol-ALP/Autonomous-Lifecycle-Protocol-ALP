import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const __dirname = import.meta.dirname;

export default defineConfig({
  root: 'src/renderer',
  plugins: [react()],
  base: './',
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      fs: resolve(__dirname, 'src/renderer/shims/fs.ts'),
      path: resolve(__dirname, 'src/renderer/shims/path.ts'),
      crypto: resolve(__dirname, 'src/renderer/shims/crypto.ts'),
      'node:child_process': resolve(__dirname, 'src/renderer/shims/child_process.ts'),
      child_process: resolve(__dirname, 'src/renderer/shims/child_process.ts'),
    },
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/renderer/index.html',
    },
  },
});