import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically update the service worker
      includeAssets: ['companira_logo_light_mode.png', 'icons/*.png'], // Include favicon and icons
      manifest: {
        name: 'Companira',
        short_name: 'Companira',
        description: 'AI Companion for Mental Wellbeing & Support',
        theme_color: '#ffffff', // Match the light theme background
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png', // Maskable icon
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
      },
      // Temporarily disable dev options
      /*
      devOptions: {
        enabled: true, // Enable PWA features in development
        type: 'module', // Use module type for service worker in dev
      },
      */
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/companira-chat': {
        target: 'http://your-n8n-server-url', // Replace with your actual n8n URL if needed
        changeOrigin: true,
      },
      '/companira-save-profile': {
        target: 'http://your-n8n-server-url', // Replace if needed
        changeOrigin: true,
      },
      '/companira-get-profile': {
        target: 'http://your-n8n-server-url', // Replace if needed
        changeOrigin: true,
      },
    },
  },
})
