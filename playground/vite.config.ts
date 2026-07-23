import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      fs: path.resolve(__dirname, 'src/shims/fs.ts'),
      path: path.resolve(__dirname, 'src/shims/path.ts'),
      crypto: path.resolve(__dirname, 'src/shims/crypto.ts'),
      buffer: path.resolve(__dirname, 'src/shims/buffer.ts'),
      'node:buffer': path.resolve(__dirname, 'src/shims/buffer.ts'),
      'node:child_process': path.resolve(__dirname, 'src/shims/child_process.ts'),
      child_process: path.resolve(__dirname, 'src/shims/child_process.ts'),
    },
  },
})
