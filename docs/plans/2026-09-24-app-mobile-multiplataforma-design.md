# App mobile nativo (iOS/Android) + desktop, com o mesmo backend

## Motivação

Hoje o TreinosApp é uma SPA React/Vite servida como PWA na Vercel, com API
NestJS + Prisma/Postgres no Railway. O objetivo é publicar o app na App Store
(e na Google Play) **sem abandonar a versão desktop**, com todas as
plataformas lendo e gravando os mesmos dados.

No iOS o PWA é limitado (sem vibração, notificações restritas, instalação
manual e pouco descoberta) — tanto que a instalação do PWA para alunos no
iPhone já foi removida (`825f6ed`). Um app nativo resolve isso.

## Decisão: Capacitor sobre o frontend atual

| Opção | Esforço | Comentário |
|---|---|---|
| **Capacitor** (escolhida) | Baixo–médio | Reaproveita ~100% do código (`dist/` do Vite); recursos nativos via plugins |
| React Native / Expo | Alto | Reescrever toda a UI (CSS e componentes são web) |
| Swift/Kotlin nativo | Muito alto | Duas bases novas; não se justifica |

Para o desktop, **o próprio site continua sendo a versão desktop** (navegador
ou PWA instalado via Chrome/Edge). Electron/Tauri só se surgir necessidade
real (acesso a arquivos locais, offline completo, distribuir `.exe`).

## Arquitetura

O banco nunca é acessado pelo frontend — tudo passa pela API. Portanto web,
iOS e Android são apenas clientes diferentes da mesma API:

```
 Desktop (navegador / PWA)  ─┐
 App iOS (Capacitor)        ─┼──►  API NestJS (Railway)  ──►  Postgres
 App Android (Capacitor)    ─┘
```

- Mesmo login (JWT), mesmos dados, alterações refletem em tempo real (online-first).
- Um único código de frontend; o build nativo empacota o mesmo `dist/`.
- Um app só, com duas entradas: **"Sou treinador"** (login) e **"Sou aluno"**
  (link/código/QR). A experiência do aluno (`PublicTreino.tsx`) é a que mais
  ganha com recursos nativos e deve ser a prioridade no mobile.

## Requisitos da App Store (bloqueantes)

1. **Guideline 4.2 — funcionalidade mínima.** Webview "pura" é rejeitada.
   Recursos nativos que agregam valor real:
   - notificação local ao fim do descanso (funciona com o app em segundo plano);
   - haptics nativos (`@capacitor/haptics`) — os `navigator.vibrate` de
     `PublicTreino.tsx` não funcionam no iOS;
   - push quando o treinador publicar/alterar treino;
   - compartilhamento nativo do PDF do treino.
2. **Guideline 5.1.1(v) — exclusão de conta no app.** O app permite criar
   conta (`/register`), então precisa permitir excluí-la. Não existe hoje:
   criar `DELETE /profissionais/me` (com confirmação de senha, apagando em
   cascata alunos, protocolos, sessões, catálogo e logo) e a ação em
   `Configuracoes.tsx`.
3. **Guideline 2.1 — acesso do revisor.** O cadastro exige aprovação de admin
   (`ativo @default(false)` em `backend/prisma/schema.prisma`). Fornecer à
   Apple uma conta de treinador já aprovada e um token de aluno válido.
4. **Privacidade.** URL de política de privacidade obrigatória + "nutrition
   labels" no App Store Connect. Criar páginas de Privacidade e Termos (também
   exigidas pela LGPD — há dados de treino/progresso de alunos).
5. **Pagamentos (futuro).** Se houver cobrança de assinatura dentro do app,
   avaliar a Guideline 3.1.1 (In-App Purchase) e as regras vigentes no Brasil
   antes de implementar.

## Ajustes técnicos no frontend

Criar uma camada fina de serviços por plataforma (ex.: `src/platform/`) com
`storage`, `share`, `haptics`, `notifications`, `openExternal`, decidindo a
implementação via `Capacitor.isNativePlatform()` — evita `if` espalhados pelas
páginas.

| Ponto | Web (mantém) | Nativo |
|---|---|---|
| Token JWT (`AuthContext.tsx`, `services/api.ts`) | `localStorage` | `@capacitor/preferences` ou Keychain/Keystore (o WKWebView pode limpar o `localStorage`) |
| PDF (`html2pdf` em `Treinos.tsx`, `PublicTreino.tsx`) | download | gerar blob → `@capacitor/filesystem` → `@capacitor/share` |
| Links externos (vídeos em `Catalog.tsx`) | `target="_blank"` | `@capacitor/browser` |
| Vibração | `navigator.vibrate` | `@capacitor/haptics` |
| Clipboard (`Admin.tsx`, `Periodizacoes.tsx`, `Treinos.tsx`) | `navigator.clipboard` | `@capacitor/clipboard` |
| PWA / service worker (`vite.config.ts`, `usePWAInstall.ts`) | ativo | desligado no build nativo |
| Detecção de iOS/standalone (`Layout.tsx`, `PublicTreino.tsx`) | user agent | `Capacitor.getPlatform()` |
| URL da API | pode usar rewrites da Vercel | sempre absoluta (rewrites do `vercel.json` não existem no app) |

Outros pontos:

- **Entrada do aluno.** Universal Links (iOS) / App Links (Android): publicar
  `/.well-known/apple-app-site-association` e `assetlinks.json` na Vercel para
  que `/v/:token` abra direto no app. Alternativa/complemento: tela para colar
  o código ou ler QR code; guardar o último token (já existe
  `LAST_PUBLIC_TOKEN_KEY`).
- **Safe area / notch.** Testar layout com `env(safe-area-inset-*)` e telas
  pequenas (já existe `useMobileViewportFix`).
- **Build nativo separado.** Um modo do Vite (ex.: `vite build --mode native`)
  que desliga o `VitePWA` e o `alunoHtmlPlugin` e define `VITE_API_URL`.

## Ajustes no backend

- **CORS** (`backend/src/main.ts`): incluir `capacitor://localhost` (iOS) e
  `https://localhost` (Android) nas origens permitidas.
- **Exclusão de conta**: endpoint `DELETE /profissionais/me` (ver acima).
- **Push**: tabela de dispositivos (token FCM/APNs por profissional/aluno) e
  envio via Firebase Cloud Messaging quando um treino for alterado.
- **Uploads**: a logo vai hoje para `/uploads` local no Railway (efêmero).
  Migrar para storage externo (Cloudflare R2, já previsto no schema).

## Compatibilidade entre versões (ponto novo do multiplataforma)

Na web todos recebem a versão nova no deploy; no celular, usuários ficam
semanas em versões antigas. Regras:

- **API retrocompatível**: adicionar campos, não renomear/remover sem período
  de transição.
- **Atualização obrigatória**: o app envia sua versão (header, ex.
  `X-App-Version`); um endpoint (ex. `GET /app/config`) devolve a versão
  mínima suportada; abaixo dela o app mostra tela "Atualize o app".
- **Live update (opcional)**: Capgo ou Ionic Appflow para atualizar JS/CSS
  sem passar pela loja — permitido pela Apple desde que não altere o propósito
  do app.

## Roteiro de implementação

1. Instalar Capacitor (`@capacitor/core`, `cli`, `ios`, `android`), criar
   `capacitor.config.ts` e o modo de build nativo.
2. Camada `src/platform/` e migração dos pontos da tabela acima.
3. CORS + URL absoluta da API; testar login e fluxo do aluno no simulador.
4. Exclusão de conta (backend + tela).
5. Páginas de Privacidade e Termos.
6. Recursos nativos: haptics, notificação local do descanso, share do PDF.
7. Deep links para `/v/:token` + tela "Sou aluno".
8. Controle de versão mínima.
9. Push notifications (pode ficar para uma segunda versão).
10. Ícones (1024 px), splash, screenshots, textos da loja; envio ao TestFlight
    e depois à revisão, com credenciais de teste.

## Custos e requisitos

- Apple Developer Program: US$ 99/ano. Google Play: US$ 25 (taxa única).
- Mac com Xcode para build iOS, ou build em nuvem (Codemagic, Ionic Appflow).
- Estimativa: **2 a 4 semanas** para uma pessoa até a primeira submissão.
