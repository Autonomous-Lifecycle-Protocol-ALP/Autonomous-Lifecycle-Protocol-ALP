import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: 'src/renderer',
  plugins: [react()],
  base: './',
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      fs: path.resolve(__dirname, 'src/renderer/shims/fs.ts'),
      path: path.resolve(__dirname, 'src/renderer/shims/path.ts'),
      crypto: path.resolve(__dirname, 'src/renderer/shims/crypto.ts'),
      'node:child_process': path.resolve(__dirname, 'src/renderer/shims/child_process.ts'),
      child_process: path.resolve(__dirname, 'src/renderer/shims/child_process.ts'),
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