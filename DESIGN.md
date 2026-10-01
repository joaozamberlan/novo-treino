# Design — TreinosApp

Fonte da verdade: `frontend/src/index.css` (tokens em `:root` e `body.light-theme`).
Referências visuais em `docs/design/` e logos em `docs/logo-jvz*`.

## 1. Princípios

1. **Ferramenta de alta densidade para o treinador.** Muita informação por tela, hierarquia
   clara e sem enfeite. O treinador monta fichas rápido, no desktop ou no celular.
2. **Uma mão, na academia, para o aluno.** Alvos de toque grandes, números legíveis,
   feedback imediato ao tocar, teclado nunca cobre a ação.
3. **Sensação nativa (Apple).** Movimento físico, interrompível, curto. Nada de animação
   decorativa em ação repetida.
4. **Contenção.** Uma cor de destaque (vermelho). Cor semântica só quando significa algo.

## 2. Temas

- **Claro** (padrão, `body.light-theme`): fundo creme `#f4f3ef`, cartões brancos.
- **Escuro**: cinzas neutros no estilo do tema escuro do YouTube (`#0f0f0f` → `#3f3f3f`).
- Preferência salva em `localStorage('theme')`; o `<meta name="theme-color">` acompanha o tema.
- Todo componente novo deve ser conferido nos dois temas.

## 3. Tokens

### Cores

| Token | Escuro | Claro | Uso |
|---|---|---|---|
| `--bg-0` | `#0f0f0f` | `#f4f3ef` | fundo da página |
| `--bg-1` | `#181818` | `#ffffff` | cartões, sidebar |
| `--bg-2` | `#272727` | `#eae8e1` | inputs, hover |
| `--bg-3` | `#3f3f3f` | `#dedbd2` | elementos elevados |
| `--border` / `--border-strong` | branco 10% / 20% | preto 10% / 20% | divisórias |
| `--accent` | `#CF3427` | `#BA281A` | ação primária, foco, estado ativo |
| `--accent-hover` | `#E44436` | `#D13322` | hover da ação primária |
| `--accent-soft` / `-dim` / `-border` | alfas do accent | alfas do accent | fundos e bordas de destaque |
| `--text-0` / `-1` / `-2` | `#f1f1f1` / `#aaa` / `#717171` | `#121316` / `#565963` / `#868a95` | texto primário / secundário / terciário |
| `--danger` | `#f04438` | `#d92d20` | erro, excluir |
| `--success` | `#2da868` | `#2da868` | concluído |
| `--warning` | `#f59e0b` | `#dc6803` | atenção |
| `--pr-gold` / `-soft` | `#e5a93c` | — | recorde pessoal (PR) |

### Tipografia
- `--font`: **Inter** (400–900) → fallback de sistema Apple/Segoe/Roboto.
- `--font-mono`: **JetBrains Mono** (500–800) para números: cargas, reps, séries,
  cronômetro, tabelas.
- Escala compacta em `rem` (≈ 0.6875–0.875rem no corpo da UI de alta densidade).
- Inputs com `font-size: 16px` no mobile para o iOS não dar zoom.

### Raios
`--radius-s: 6px` · `--radius-m: 8px` · `--radius-l: 12px` · `--radius-xl: 16px`

### Movimento
| Token | Valor | Uso |
|---|---|---|
| `--transition` | 160ms `ease-out` | padrão de hover/estado |
| `--transition-fast` | 120ms | micro-feedback |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | entradas |
| `--ease-drawer` / `--ease-spring` | `cubic-bezier(0.32, 0.72, 0, 1)` | sheets, drawers |
| `--ease-spring-bounce` | `cubic-bezier(0.18, 0.89, 0.32, 1.28)` | só onde há momento físico |

- `PressScale`: escala 0.95, mola sem bounce, 0.12s. Bounce 0.2 / 0.3s apenas para
  soltar após arrastar.
- `PageTransition`: 0.3s entre páginas.
- `MotionConfig reducedMotion="user"` + `@media (prefers-reduced-motion: reduce)`.

### Safe area e teclado
`--sat/--sab/--sal/--sar` = `env(safe-area-inset-*)`; `--keyboard-inset` é atualizado por
`useMobileViewportFix` para manter ações de modal acima do teclado no iOS.

## 4. Layout

- **Desktop (≥ 921px):** sidebar à esquerda, recolhível, com rótulos visíveis mesmo
  recolhida.
- **Mobile:** tab bar inferior (respeita `--sab`), topbar com logo.
- Breakpoints usados: 420, 640, 768, 860, 920/921, 960px. Preferir estes a criar novos.
- Navegação em pastas com `Breadcrumb`: Alunos / Aluno / Periodizações / Ciclo.

## 5. Componentes base (classes em `index.css`)

| Componente | Classes |
|---|---|
| Botões | `.btn` + `.btn-primary` · `.btn-secondary` · `.btn-danger` · `.btn-ghost` · `.btn-sm` · `.btn-icon` |
| Formulário | `.form-group` · `.form-label` · `.form-row` · `.form-control` |
| Cartões | `.card` · `.card-clickable` · `.card-flat` |
| Badges | `.badge` + `-success` · `-danger` · `-warning` · `-accent` · `-neutral` |
| Modal | `.modal-backdrop` · `.modal-content` · `.modal-header` · `.modal-footer` (sempre via `ModalPortal`) |
| Página | `.page-header` |
| Menus | `ActionMenu` (menu "⋯" dos cartões). `align="left"` quando o gatilho fica na borda esquerda da tela |
| Toasts | sonner, `bottom-right`, `richColors` |
| Ícones | lucide-react; biblioteca de exercícios usa o ícone de halter |

## 6. Regras de interação

- Hover apenas em `@media (hover: hover) and (pointer: fine)`; no toque, feedback por `:active`/escala.
- `-webkit-tap-highlight-color: transparent` e sem callout de toque longo em botões.
- Estados vazios, de carregamento e de erro sempre desenhados (ex.: periodização não encontrada → link de volta).
- Ações destrutivas pedem confirmação e dizem o que se perde.
- Vibração no fim do descanso e ao concluir série (onde o navegador suporta).

## 7. Impressão e PDF

- `@media print` e `FichaPdf.tsx` reproduzem a ficha em layout claro, com logo e rodapé
  do treinador e a tabela de progressão semanal.
- Números em fonte mono também no PDF.

## 8. Marca

- Nome do produto: **TreinosApp**.
- Logo do treinador: enviada em Configurações, exibida no link do aluno e no PDF.
- Identidade JVZ (logo do autor) em `docs/logo-jvz*`; exploração em `docs/logo-jvz-preview.html`.
