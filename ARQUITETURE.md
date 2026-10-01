# Arquitetura — TreinosApp

## 1. Visão geral

```
 Navegador / PWA (Vercel)  ──►  API NestJS (Railway)  ──►  PostgreSQL (Railway)
   React 19 + Vite               Prisma 7 + pg adapter
```

- O frontend **nunca** acessa o banco; tudo passa pela API.
- Dois tipos de acesso à API:
  - **Treinador/admin**: JWT no header `Authorization: Bearer`.
  - **Aluno**: rotas `/aluno/*`, com JWT próprio obtido por telefone + PIN. O link do
    treinador serve só para o primeiro acesso.

## 2. Estrutura do repositório

```
novo-workout/
├── backend/            API NestJS
│   ├── prisma/         schema.prisma + migrations
│   ├── src/
│   │   ├── common/     filtros, interceptors, DTO de paginação, utils
│   │   ├── constants/  default-catalog.ts (catálogo semeado no cadastro)
│   │   ├── modules/    auth, profissionais (+admin), alunos, exercicios, treinos, area-aluno, publico
│   │   └── prisma/     PrismaService
│   └── railway.toml
├── frontend/           SPA React
│   ├── src/
│   │   ├── pages/      uma página por rota
│   │   ├── components/ Layout, FichaPdf, Progresso, VolumeSemanal, ...
│   │   ├── contexts/   AuthContext
│   │   ├── hooks/      useMobileViewportFix, usePWAInstall, useFieldValidation
│   │   ├── services/   api.ts (axios), cache.ts (cache em memória SWR)
│   │   ├── utils/      descanso, pdf, periodo, progresso, rodape
│   │   └── index.css   design system inteiro (tokens + componentes)
│   ├── vite.config.ts  PWA + plugin que gera aluno.html
│   └── vercel.json     rewrites e headers de segurança
└── docs/               planos de design, identidade visual, logos
```

## 3. Backend

**Stack:** NestJS 11, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL, Passport JWT, bcrypt,
class-validator, helmet, `@nestjs/throttler`. Node ≥ 22.

### 3.1 Bootstrap (`backend/src/main.ts`)
- `trust proxy = 1` (atrás do proxy do Railway, para o throttler ver o IP real).
- Helmet com `crossOriginResourcePolicy: cross-origin`.
- CORS por allowlist (`CORS_ORIGIN`, padrão `localhost:5173` + domínio Vercel).
- `ValidationPipe({ whitelist: true, transform: true })` global.
- `AllExceptionsFilter`: resposta de erro padronizada, sem stack/SQL/paths.
- `LoggingInterceptor`: método, rota, status e duração, sem headers/body.

### 3.2 Módulos e rotas

| Módulo | Prefixo | Guard | Responsabilidade |
|---|---|---|---|
| auth | `/auth` | throttle 5/min | `register`, `login` |
| profissionais | `/profissionais` | JWT | `me` (GET/PATCH), `me/senha`, `me/logo` |
| profissionais (admin) | `/admin` | JWT + AdminGuard | listar, status, role, reset de senha |
| alunos | `/alunos` | JWT | CRUD + `token/regenerar`, `token/revogar` |
| exercicios | `/exercicios` | JWT | grupos, exercícios, técnicas, instruções, `seed` |
| treinos | `/treinos` | JWT | protocolos, fichas, prescrições, `duplicar`, `progresso`, `volume` |
| area-aluno (login) | `/aluno/auth` | throttle 5/min, sem JWT | `acesso/:token`, `primeiro-acesso`, `login` |
| area-aluno | `/aluno` | JWT do aluno | `me`, protocolos, progresso, sessão, séries |
| publico | `/publico` | throttle 30/min, **sem JWT** | só a logo do treinador |

Limite global: 60 req/min por IP.

### 3.3 Autenticação
- JWT payload: `{ sub, email, tipo: 'profissional', ver }`.
- `JwtStrategy.validate` recarrega o profissional a cada request e rejeita se inativo
  ou se `ver !== versaoToken` (troca de senha derruba sessões).
- Login compara contra um hash "dummy" quando o e-mail não existe (sem timing side-channel).
- E-mails normalizados (trim + lowercase).
- `JWT_SECRET` obrigatório: a app não sobe sem ele.
- **Aluno:** JWT `{ sub: idAluno, tipo: 'aluno', ver }` de 90 dias, renovado por
  `GET /aluno/me`. Estratégia `jwt-aluno` separada; cada lado só aceita o seu `tipo`.
  PIN de 4 dígitos com bcrypt; 5 erros bloqueiam o aluno por 15 minutos.

### 3.4 Posse de dados (multi-tenant)
- Todo recurso pertence a um `idProfissional`; os services sempre filtram por ele.
- DTOs **rejeitam** campos de posse (`idProfissional`, etc.) vindos do cliente
  (`ownership-fields-rejected.spec.ts`).
- Rotas do aluno seguem a cadeia `aluno (do JWT) → treino → sessão → exercício`,
  validando cada elo (`area-aluno.service.ts`). Escrita só no protocolo atual; os
  anteriores são somente leitura.
- A API `/alunos` nunca devolve `pinHash` nem os contadores de tentativa.

### 3.5 Link e login do aluno
- `ProtocoloTreino.tokenPublico`: link de **uma periodização** específica (formato atual).
- `Aluno.tokenAcesso`: link antigo (compatibilidade).
- O link não abre mais o treino: prova a posse no **primeiro acesso**, quando o aluno
  confirma o telefone e cria o PIN. Depois o login é telefone + PIN.
- `Aluno.telefoneLogin`: telefone só com dígitos e DDI (`common/utils/telefone.ts`).
- Revogar o acesso ou redefinir o PIN sobe `Aluno.versaoToken` e derruba as sessões.

### 3.6 Modelo de dados (resumo)

```
Profissional ─┬─< Aluno ─┬─< ProtocoloTreino ─< Treino ─< TreinoExercicio >─ Exercicio >─ GrupoMuscular
              │          └─< SessaoTreino ─┬─< SessaoExercicioSerie >─ TreinoExercicio
              │                            └─< ExercicioConcluido   >─ TreinoExercicio
              ├─< GrupoMuscular / Exercicio / TecnicaTreino / InstrucaoTreino   (catálogo por treinador)
              └── LogoProfissional (bytes da logo, tabela separada)
```

Detalhes relevantes:
- `ProtocoloTreino.excluido` e `TreinoExercicio.ativo` = **exclusão lógica** para não levar
  em cascata as sessões e cargas do aluno.
- `SessaoTreino.data` é string `YYYY-MM-DD` (data local do aluno, sem fuso).
- `Treino.rodape`: `null` herda o padrão do treinador; `""` = sem rodapé.
- `TreinoExercicio.repeticoes` é texto livre; `parseFaixa` extrai a faixa numérica.
- Descanso: `descansoSegundos` (mín.) + `descansoMaxSegundos` (máx., opcional).
- Limites em `treinos/dto/limites.ts`: `MAX_SERIES = 30`, `MAX_DESCANSO_SEGUNDOS = 3600`.

### 3.7 Progresso (`treinos/progresso.ts`)
Resposta única para `GET /treinos/progresso/:idProtocolo` e `GET /aluno/progresso/:idProtocolo`.
Agrupa por `idExercicio` (atravessa periodizações), últimas 12 sessões, melhor série por sessão.
O frontend espelha os tipos em `frontend/src/utils/progresso.ts`.

## 4. Frontend

**Stack:** React 19, Vite 8, TypeScript 6, React Router 7, axios, motion, recharts,
sonner (toasts), lucide-react (ícones), html2pdf.js, vite-plugin-pwa.

### 4.1 Rotas (`frontend/src/App.tsx`)

| Rota | Página | Acesso |
|---|---|---|
| `/login`, `/register` | Login, Register | público |
| `/v/:token` | PublicTreino | público (aluno) |
| `/` | Home | treinador |
| `/alunos` | Alunos | treinador |
| `/alunos/:idAluno/periodizacoes` | Periodizacoes | treinador |
| `/alunos/:idAluno/treinos?periodizacao=` | Treinos | treinador |
| `/exercicios` | Catalog | treinador |
| `/configuracoes` | Configuracoes | treinador |
| `/admin` | Admin | admin |
| `/prototypes/*` | protótipos | só em `vite dev` |

`Dashboard.tsx` existe mas não está roteado.

### 4.2 Estado e dados
- `AuthContext`: token em `localStorage` (`@TreinosApp:token`); 401 em request autenticada → logout.
- `services/cache.ts`: cache em memória com stale-while-revalidate entre telas;
  invalidar por prefixo após mutações.
- Sem biblioteca de estado global; estado local por página.

### 4.3 PWA e iOS
- Manifest global com `start_url: "/"` (área do treinador).
- Build gera `aluno.html` = `index.html` **sem manifest** e com `noindex`, servido pela
  Vercel em `/v/:token`. No iOS o aluno não instala PWA.
- Manifest por link: `/v/:token/manifest.webmanifest` → rewrite para `/publico/manifest/:token`.
- Service worker: estáticos cache-first; `/publico/` network-first (5s); API autenticada network-only.
- PWA instalado sem login → volta para o último link público visto (`lastPublicToken`).

### 4.4 PDF
`components/FichaPdf.tsx` + `utils/pdf.ts` com html2pdf.js, usado pelo treinador e pelo aluno.

## 5. Deploy

| Parte | Onde | Como |
|---|---|---|
| API | Railway (nixpacks, Node 22) | `npm run build` → `npx prisma migrate deploy && node dist/main.js` |
| Banco | Railway PostgreSQL | migrations versionadas em `backend/prisma/migrations` |
| Frontend | Vercel | `tsc -b && vite build`; `vercel.json` com rewrites e CSP |

Variáveis: ver `backend/.env.example` (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`CORS_ORIGIN`, `SEED_ADMIN*` só local) e `VITE_API_URL` no frontend.

A CSP do `vercel.json` fixa o domínio da API no Railway: mudar o domínio exige atualizar
`connect-src` e `img-src`.

## 6. Comandos

```bash
# backend
cd backend && npm run start:dev      # API em :3000
npm test                             # jest (unit)
npm run lint
npx prisma migrate dev --name <nome> # nova migration

# frontend
cd frontend && npm run dev           # Vite em :5173
npm run build                        # checa tipos + build
npm run lint
```
