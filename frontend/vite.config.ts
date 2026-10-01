import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const escaparRegex = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Mesma origem que services/api.ts usa; o service worker precisa dela para
  // saber quais requisições são da área do aluno.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiOrigin = new URL(env.VITE_API_URL || 'http://localhost:3000').origin

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-icon-192.png', 'pwa-icon-512.png'],
        // Um manifest só, para treinador e aluno. O app instalado abre sempre na
        // raiz; quem decide a tela é o RequireAuth (App.tsx), pela sessão.
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
              // Leituras da área do aluno — network-first: sempre o dado novo
              // quando há rede, e a última ficha vista quando a academia não
              // tem sinal. O login (/aluno/auth) nunca é guardado. O cache é
              // apagado quando o aluno sai ou troca de conta (AlunoAuthContext).
              urlPattern: new RegExp(`^${escaparRegex(apiOrigin)}/aluno/(?!auth/)`),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-aluno',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              // Logo do treinador (tela de login do aluno e PDF)
              urlPattern: new RegExp(`^${escaparRegex(apiOrigin)}/publico/`),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-publico',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              // Resto da API (área do treinador) — network-only (sem cache)
              urlPattern: new RegExp(`^${escaparRegex(apiOrigin)}/`),
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
  }
})
