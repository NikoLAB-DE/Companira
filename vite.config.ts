import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/companira-chat': {
        target: 'http://your-n8n-server-url',
        changeOrigin: true,
      },
      '/companira-save-profile': {
        target: 'http://your-n8n-server-url',
        changeOrigin: true,
      },
      '/companira-get-profile': {
        target: 'http://your-n8n-server-url',
        changeOrigin: true,
      },
    },
  },
})
