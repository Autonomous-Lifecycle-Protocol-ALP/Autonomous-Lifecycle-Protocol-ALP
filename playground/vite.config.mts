import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const __dirname = import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/reactflow/')) {
            return 'reactflow-vendor';
          }
          if (id.includes('node_modules/@monaco-editor/')) {
            return 'monaco-vendor';
          }
          if (id.includes('node_modules/react-icons/')) {
            return 'icons-vendor';
          }
        },
      },
    },
  },
})

