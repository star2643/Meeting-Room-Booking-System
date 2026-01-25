import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: '/2fconference/',
  server: {
    proxy: {
      '/2fconference/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
