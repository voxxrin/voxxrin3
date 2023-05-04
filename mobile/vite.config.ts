import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  root: '.',
  build: {
    outDir: './dist',
    minify: false,
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0'
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
