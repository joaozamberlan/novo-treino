# Regras do projeto — TreinosApp

Regras para quem (pessoa ou IA) mexe neste código. Quando uma regra conflitar com um
hábito, a regra vence.

## 1. Escopo e produto

1. **Implemente só o que foi pedido.** Nada de tabelas, migrations, estados, botões ou
   lógica extra que não estavam no pedido. Na dúvida, pergunte em uma frase curta em vez
   de propor um design grande.
2. **Reproduzir é reproduzir.** Quando o pedido for trazer algo de um documento (ex.: a
   tabela de progressão do PDF do plano de treino), copie o conteúdo como está.
3. **Nunca assuma nomes nem calendário.** Fichas não se chamam sempre "Treino A/B",
   não estão presas a dias da semana e o aluno não começa necessariamente na semana 1.
4. **Sem alertas de estagnação.** Ficar semanas com a mesma carga é normal. Os únicos
   sinais de progresso permitidos são reps **acima** da faixa (subir carga) e **abaixo**
   (carga alta).
5. **O histórico do aluno é sagrado.** Nunca apague em cascata sessões ou séries
   registradas. Use exclusão lógica (`excluido`, `ativo`) para periodizações e prescrições.

## 2. Código

- **Idioma:** domínio, rotas, modelos, mensagens de UI e comentários em **português**.
  Identificadores técnicos genéricos podem ficar em inglês.
- **Siga o estilo do arquivo:** mesma densidade de comentários, nomes e idioma do código ao redor.
- **Comentários explicam o porquê**, não o quê (ex.: por que a raiz do site roteia pela sessão).
- TypeScript estrito; evitar `any` em código novo.
- Backend formatado com Prettier (`backend/.prettierrc`); lint nos dois pacotes antes de commitar.

## 3. Backend

- **Todo** acesso a dado de treinador filtra por `idProfissional` vindo do JWT
  (`@GetProfissional`), nunca do body/query.
- DTOs com class-validator; o `ValidationPipe` usa `whitelist`. Campos de posse enviados
  pelo cliente devem ser rejeitados.
- Rotas `/aluno/*` usam sempre o aluno do JWT (nunca um id da URL ou do body) e validam
  a cadeia inteira `aluno → treino → sessão → exercício`.
- O link do treinador (`/v/:token`) nunca devolve dados do treino sem login.
- Erros via exceções do Nest (`NotFoundException`, etc.) com mensagem em pt-BR; nunca vazar
  stack, SQL ou caminhos.
- Não logar headers, body, tokens nem senhas (`common/utils/redact.ts`).
- Mudança de schema = **migration nova** em `backend/prisma/migrations`. Nunca editar
  migration já aplicada.
- Nada de arquivo em disco no Railway: o container é apagado a cada deploy (a logo vai no banco).
- Rotas sensíveis ganham `@Throttle` próprio.
- Mudança de contrato da API deve ser **retrocompatível** (links antigos e, no futuro,
  apps em versões antigas continuam funcionando).

## 4. Frontend

- Cores, raios, fontes e curvas **sempre** por tokens de `index.css` (`var(--accent)`,
  `var(--radius-m)`…). Nada de hex solto. Ver [DESIGN.md](DESIGN.md).
- Todo layout funciona em celular (≥ 360px) com o teclado aberto; modais via `ModalPortal`.
- Hover só dentro de `@media (hover: hover) and (pointer: fine)`.
- Animações respeitam `prefers-reduced-motion` (`MotionConfig reducedMotion="user"`).
- Feedback ao usuário por `toast` (sonner), não `alert()`.
- Confirmação por `useConfirmar()`, não `confirm()`. Modal sempre dentro de `ModalPortal`.
- Após mutação, invalide o `memoryCache` do prefixo afetado.
- Não quebrar o app instalado do aluno: ele abre na raiz (`/`) e tem armazenamento
  próprio no iPhone. A raiz precisa continuar levando ao login do aluno, e o login precisa
  funcionar sem o link.
- Resposta de `/aluno/*` guardada pelo service worker é de uma conta: apagar o cache
  `api-aluno` ao sair ou trocar de conta.
- Novo domínio externo (API, imagens, fontes) exige atualizar a CSP em `frontend/vercel.json`.

## 5. Segurança

- Nunca commitar `.env`. Segredos só em variáveis do Railway/Vercel.
- `SEED_ADMIN` nunca em produção.
- Páginas do aluno com `noindex` e `Referrer-Policy: no-referrer`.

## 6. Git

- Conventional Commits em inglês com escopo: `feat(treinos): ...`, `fix(publico): ...`,
  `style(ui): ...`, `chore(...)`, `test(...)`.
- Um assunto por commit. Commitar só quando pedido.
- Não usar `--no-verify`.

## 7. Antes de dizer "pronto"

- Backend: `npm run lint` e `npm test`.
- Frontend: `npm run build` (inclui `tsc -b`) e `npm run lint`.
- Mudança visual: conferir em largura de celular e nos temas claro e escuro.
