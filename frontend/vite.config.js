import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:5500',
      '/images': 'http://127.0.0.1:5500',
      '/uploads': 'http://127.0.0.1:5500',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
