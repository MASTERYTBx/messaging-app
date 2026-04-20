import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app-icon.svg', 'vite.svg'],
      manifest: {
        name: 'Private Messaging',
        short_name: 'ChatApp',
        description: 'A private secure messaging app',
        theme_color: '#00a884',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'app-icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
