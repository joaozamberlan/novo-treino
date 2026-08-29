import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon-192.png', 'pwa-icon-512.png'],
      manifest: {
        name: 'TreinosApp',
        short_name: 'TreinosApp',
        description: 'Prescrição e acompanhamento de treinos com seu personal',
        theme_color: '#0d0d0d',
        background_color: '#0d0d0d',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache estáticos (JS, CSS, fontes) — cache-first
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Rotas públicas do aluno — network-first (progresso sempre atualizado)
            urlPattern: /\/publico\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-publico',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // API autenticada — network-only (sem cache)
            urlPattern: ({ url }) =>
              url.hostname.includes('railway.app'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
