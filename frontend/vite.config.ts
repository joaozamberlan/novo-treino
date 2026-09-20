import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// O Safari do iPhone lê o <link rel="manifest"> do HTML inicial ao adicionar à tela de
// início; o manifest global tem start_url "/" (área do treinador, exige login). Para as
// rotas /v/:token geramos aluno.html: o mesmo index.html, só que sem o manifest.
const alunoHtmlPlugin = (): Plugin => ({
  name: 'aluno-html-without-manifest',
  apply: 'build',
  enforce: 'post',
  closeBundle() {
    const indexPath = resolve(__dirname, 'dist/index.html')
    if (!existsSync(indexPath)) return
    const html = readFileSync(indexPath, 'utf-8').replace(/<link rel="manifest"[^>]*>/g, '')
    writeFileSync(resolve(__dirname, 'dist/aluno.html'), html)
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    alunoHtmlPlugin(),
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
        // /v/:token é servido como aluno.html (sem manifest) pelo Vercel; o fallback
        // do SW devolveria o index.html, com o manifest global.
        navigateFallbackDenylist: [/^\/v\//],
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
