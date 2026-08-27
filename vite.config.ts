import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'images/bm.svg'],
      manifest: {
        name: 'Beauty Manager - Gestão & PDV',
        short_name: 'BeautyManager',
        description: 'Sistema de gestão, estoque e frente de caixa para cosméticos e variedades',
        theme_color: '#ec4899',
        background_color: '#fff1f2',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'images/pwa/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'images/pwa/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'images/pwa/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'images/pwa/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,woff2}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    dedupe: ['vue']
  },
  server: {
    port: 8841,
    host: true
  }
})
