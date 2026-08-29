import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(() => {
  return {
    plugins: [
      vue(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'favicon.svg',
          'images/bm.svg',
          'images/pwa/apple-touch-icon-180x180.png',
          'images/pwa/maskable-icon-512x512.png'
        ],
        manifest: {
          name: 'Beauty Manager',
          short_name: 'Beauty Manager',
          description: 'Sistema de gestão de estoque, markup dinâmico e frente de caixa para cosméticos e variedades.',
          start_url: '/',
          display: 'standalone',
          orientation: 'any',
          lang: 'pt-BR',
          theme_color: '#fd0054',
          background_color: '#ffebf0',
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
              type: 'image/png'
            },
            {
              src: 'images/pwa/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          navigateFallbackDenylist: [
            /^\/sitemap\.xml$/,
            /^\/robots\.xml$/,
            /^\/llms\.xml$/
          ],
          skipWaiting: true,
          clientsClaim: true,
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
          globIgnores: ['**/remixicon-*.svg', '**/primeicons-*.svg'],
          runtimeCaching: [
            {
              urlPattern:
                /^https:\/\/.*\/v1\/storage\/buckets\/.*\/files\/.*\/view/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'appwrite-storage-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/.*\/v1\/databases\/.*/,
              handler: 'NetworkOnly'
            },
            {
              urlPattern: /^https:\/\/.*\/v1\/account\/.*/,
              handler: 'NetworkOnly'
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html'
        }
      })
    ],
    define: {
      'process.env': {},
      global: 'globalThis'
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
      dedupe: ['vue']
    },
    build: {
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('exceljs') || id.includes('xlsx')) {
                return 'excel-vendor'
              }
              if (id.includes('appwrite') || id.includes('node-appwrite')) {
                return 'appwrite-vendor'
              }
              if (
                id.includes('zod') ||
                id.includes('dayjs') ||
                id.includes('jsbarcode') ||
                id.includes('qrcode') ||
                id.includes('@brazilian-utils')
              ) {
                return 'utils-vendor'
              }
              if (
                id.includes('primevue') ||
                id.includes('@primeuix') ||
                id.includes('@primevue') ||
                id.includes('vue') ||
                id.includes('pinia')
              ) {
                return 'ui-vendor'
              }
              return 'vendor'
            }
          }
        }
      }
    },
    server: {
      // port: 8841,
      host: true,
      allowedHosts: [
        '.ajotanc.com.br',
        '.ngrok-free.app',
        '.ngrok.io',
        '.ngrok-free.dev',
        '.trycloudflare.com',
        'localhost'
      ]
    }
  }
})
