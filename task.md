# Tarefas — TreinosApp

Legenda: `[ ]` a fazer · `[~]` em andamento · `[x]` feito.
Ao terminar uma tarefa, marque `[x]` e registre decisões relevantes em [MEMORY.md](MEMORY.md).

## Em aberto

### Limpeza
- [ ] Decidir o destino de `frontend/src/pages/Dashboard.tsx` (não está roteado).
- [ ] `Profissional.logoUrl` e a pasta `/uploads`: a logo já vai para `LogoProfissional`;
      avaliar remover o campo e o `express.static` de `main.ts`.

### Login do aluno e PWA (plano: `docs/plans/2026-09-30-login-aluno-pwa-design.md`)
- [ ] 1. Backend: migration em `Aluno`, login por telefone + PIN, rotas `/aluno/*`, testes.
- [ ] 2. Área do aluno (`/aluno`) e telas de entrada (escolha de perfil, login, primeiro acesso).
- [ ] 3. Treinador: telefone obrigatório, estado do PIN na lista, Redefinir PIN.
- [ ] 4. PWA: manifest único em `/` e remoção do `aluno.html`, do manifest por link e do `lastPublicToken`.
- [ ] 5. Teste manual no iPhone e no Android.

### App nativo (plano: `docs/plans/2026-09-24-app-mobile-multiplataforma-design.md`)
- [ ] 1. Instalar Capacitor (`core`, `cli`, `ios`, `android`), `capacitor.config.ts` e modo `vite build --mode native`.
- [ ] 2. Camada `src/platform/` (storage, share, haptics, notifications, openExternal).
- [ ] 3. CORS com `capacitor://localhost` e `https://localhost`; URL absoluta da API.
- [ ] 4. Exclusão de conta: `DELETE /profissionais/me` com confirmação de senha + ação em Configurações.
- [ ] 5. Páginas de Privacidade e Termos (App Store + LGPD).
- [ ] 6. Recursos nativos: haptics, notificação local do descanso, share do PDF.
- [ ] 7. Deep links `/v/:token` (Universal Links / App Links) + tela "Sou aluno".
- [ ] 8. Controle de versão mínima (`X-App-Version` + `GET /app/config`).
- [ ] 9. Push notifications (pode ficar para a v2).
- [ ] 10. Ícones, splash, screenshots, textos da loja, TestFlight e revisão.

### Infra
- [ ] Storage externo (Cloudflare R2) se voltarem a existir uploads em disco.

## Feito recentemente
- [x] CREF opcional no cadastro (acadêmicos de Educação Física).
- [x] Sidebar recolhida com rótulos e paleta escura estilo YouTube.
- [x] Volume semanal alternando entre ficha atual e semana.
- [x] Passe de movimento/feedback de toque no estilo Apple e cronômetro de descanso.
- [x] Modais em portal acima da tab bar e acima do teclado no mobile.
- [x] Preservar histórico do aluno (exclusão lógica) e segurança de links/sessões.
- [x] Gráfico de volume semanal ranqueado.
- [x] PDF compartilhado da ficha e aviso de série não salva.
- [x] Logo do treinador guardada no banco.
- [x] Tabela de progressão semanal e rodapé por treinador.
- [x] Progresso de cargas para treinador e aluno.
