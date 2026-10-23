# Guia de Design

Guia para começar qualquer projeto novo (landing page, painel, app web ou PWA) com um visual
bonito, sóbrio e acessível. Ele não é uma marca: é um método. Troque as cores e as fontes e
mantenha as regras.

Ordem de uso num projeto novo:

1. Copie o template de tokens (seção 13) e preencha a paleta do projeto.
2. Meça o contraste de cada par texto/fundo antes de usar (seção 2.3).
3. Decida a única "assinatura" visual do projeto (seção 1, princípio 6).
4. Passe pelo checklist (seção 14) antes de publicar.

---

## 1. Princípios

1. **Contenção.** Uma cor de destaque. Cor semântica (sucesso, aviso, erro) só quando
   significa alguma coisa. O resto é neutro.
2. **Borda antes de sombra.** Separação estrutural se resolve com fio de 1px e troca sutil de
   fundo. Sombra é reforço, não efeito.
3. **Nem tudo é cartão.** Listas, índices e configurações são linhas separadas por fio. Uma
   caixa por seção, no máximo. Nunca cartão dentro de cartão.
4. **Provar com o produto, não com enfeite.** Telas reais (ou recriadas fielmente) valem mais
   que foto de banco de imagem, ilustração genérica ou ícone de categoria.
5. **Movimento com significado.** Cada animação diz uma coisa. Se duas dizem a mesma, uma sai.
   Se uma não diz nada, sai também.
6. **Uma assinatura por projeto.** Um elemento que só aquele projeto tem (um traço inclinado
   antes dos títulos, um painel escuro fixo, um feixe na borda do cartão de preço, uma janela
   do produto no hero). Uma, repetida com consistência, e não cinco.
7. **Medir, não julgar no olho.** Contraste, alvo de toque, duração de animação: tudo tem
   número.

---

## 2. Cor

### 2.1 A regra de papel dos tokens

Uma cor viva quase nunca passa 4,5:1 como texto pequeno sobre fundo claro. Por isso cada
família de cor tem tons com papéis diferentes, e o nome do token carrega o papel:

| Token | Papel | Pode escrever texto? |
|---|---|---|
| `--color-X` | **vivo**: só preenche (botão, chip sólido, bolinha, filete) | não |
| `--color-X-hover` | estado de hover do preenchimento | não |
| `--color-X-soft` | fundo tingido de chip ou faixa | não |
| `--color-X-ink` | **todo texto pequeno e ícone** daquela família (≥ 4,5:1 sobre branco e sobre o `-soft`) | sim |
| `--color-X-foreground` | rótulo que vai em cima do vivo | sim |

Com dois tons (vivo para preencher, tinta para escrever), o vivo fica livre para ser vivo.
Aplique a mesma regra às semânticas: `success`, `warning`, `danger`, `info`.

### 2.2 Neutros

- **Papel**: um quase branco como fundo da página, e **branco**
  para cartões. O cartão branco sobre papel lê como objeto sem precisar de sombra.
- **Tinta**: quase preto para o texto, nunca preto puro.
- **Muted** para texto secundário: o cinza-padrão dos frameworks (`slate-400/500`,
  `gray-400`) costuma reprovar sobre branco. Escureça até passar 5:1.
- **Linha** e **linha forte**: dois cinzas claros, um para divisórias e outro para hover de
  borda.
- **Mesa**: um degrau abaixo do papel, para quando um documento ou folha precisa flutuar
  sobre o fundo.

### 2.3 Contraste

- Texto pequeno: **4,5:1**. Texto grande (≥ 24px, ou ≥ 18,66px em negrito) e componentes de
  UI (borda de foco, ícone que é controle): **3:1**.
- Escreva o valor medido no comentário do token (`/* 5,5:1 sobre branco */`). Quem mexer
  depois sabe o que não pode quebrar.
- Cor clara ou viva de marca só como texto sobre fundo escuro. Sobre
  fundo claro use a versão `-ink`. Nunca troque as duas de lugar.
- Superfície escura: se o projeto ajusta cores para AA no claro, restaure as versões claras
  dentro de superfícies escuras (uma classe `.painel-escuro` que reaplica os tokens, ou uma
  lista de fundos escuros com `:where()` para não somar especificidade).
- Nunca ponha brilho, glow ou degradê colorido atrás de texto colorido: derruba o contraste.
- Estado nunca só por cor: ▲/▼, ícone ou texto junto.

### 2.4 Ritmo de cor numa página longa

- Alterne o fundo das seções entre **papel**, **branco** e um **wash da marca** em croma muito
  baixo (o matiz da marca quase sem saturação), cada um com sua linha de borda. A página ganha ritmo sem perder o papel.
- Uma ou duas regiões escuras (cabeçalho, palco do produto, cartão do plano, rodapé) dão peso
  sem gradiente.
- Faixa com painel diagonal (`clip-path: polygon(...)`) num tom da marca é um jeito de ter
  duas cores numa faixa escura sem degradê.

### 2.5 Cores de terceiros

Botão de rede social usa a cor da rede, mas só nos tons que mantêm 4,5:1 com texto branco (no
degradê, corte os trechos claros demais).
A cor de um canal de contato fica reservada para a ação daquele canal, nunca como "sucesso" genérico.

### 2.6 Avatares e etiquetas por categoria

Tons determinísticos (hash do nome → 0..5) em `oklch` com croma baixo e luminosidade pareada:
distinguem sem gritar. Categorias fixas (áreas, tipos, módulos) ganham a mesma cor em todo
lugar onde aparecem, inclusive na página de vendas e no sistema.

---

## 3. Tipografia

### 3.1 Famílias

Escolha **uma** destas estruturas:

- **Par display + texto**: uma grotesca de título com personalidade e bojo aberto (ex.:
  Plus Jakarta Sans 700–800) e uma de texto neutra e densa (ex.: Inter). Mono opcional para
  código, números de protocolo, datas (ex.: Geist Mono).
- **Uma família variável só** com eixo de largura (ex.: Archivo): normal para texto e títulos,
  a mesma fonte presa em 75% de largura por um `@font-face` próprio para números, rótulos em
  caixa alta e tabelas, e 62% em peso 800 só para o número grande de placar.
- **Serifa para documento**: corpo de documento longo (contrato, relatório, petição) pede
  serifa de leitura (Source Serif, Georgia). Não use serifa na interface.

Regras:

- Self-host em `woff2`, `font-display: swap`, `unicode-range` latino. Importe só os pesos em
  uso (fonte não variável sem o regular 400 sintetiza tudo que não pede peso).
- Fallback de sistema completo: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.
- `-webkit-font-smoothing: antialiased` no `html`.

### 3.2 Escala

Títulos fluidos com `clamp()`, tracking negativo que aperta conforme o tamanho cresce:

| Nível | Tamanho | Peso | Tracking | Entrelinha |
|---|---|---|---|---|
| Hero | `clamp(2.25rem, 1.3rem + 3vw, 4rem)` | 700–800 | `-0.04em` a `-0.045em` | 1.03–1.04 |
| Seção | `clamp(1.9rem, 1.25rem + 2.3vw, 3.25rem)` | 700–800 | `-0.035em` a `-0.04em` | 1.06–1.08 |
| Seção pequena | `clamp(1.625rem, 1.2rem + 1.4vw, 2.25rem)` | 700 | `-0.035em` | 1.12 |
| Título de item | `1rem`–`1.125rem` | 600–700 | `-0.01em` | 1.3 |
| Lede | `1.0625rem` | 400 | 0 | 1.7, cor muted |
| Corpo de interface | 13–15px | 400 | 0 | 1.4–1.6 |
| Rótulo | 11–13px, caixa alta | 700–800 | `+0.08em` a `+0.1em` | 1.3 |

Interface de alta densidade (painel, ferramenta) usa corpo de 13–14px. Página de marketing usa
15–17px.

### 3.3 Regras de texto

- `text-wrap: balance` em todo título; `text-wrap: pretty` em todo parágrafo. Nada de palavra
  órfã na última linha.
- Largura de leitura em `ch`: título do hero `max-w-[17ch]`, título de seção `max-w-[22ch]`,
  lede `max-w-[56ch]`–`[62ch]`, coluna de texto 65–75ch.
- `font-variant-numeric: tabular-nums` em todo número que alinha em coluna, contador ou preço.
- Input com `font-size: 16px` no celular, senão o iOS dá zoom ao focar.
- Termo próprio do produto pode ganhar um sublinhado de 1,5px na cor da marca (`.termo`), em
  vez de negrito ou cor.

---

## 4. Layout

- Container: `max-w-7xl` com `px-4 sm:px-6 lg:px-8`. Texto denso (FAQ, termos) em
  `max-w-3xl`–`max-w-5xl`.
- Seção: `py-20 lg:py-28`, borda de 1px no topo, fundo alternado (seção 2.4).
- Hero com grade de duas colunas: texto em `minmax(0,1fr)`, palco do produto ao lado. No
  celular a dobra é do título e do CTA; ilustração decorativa some.
- **Hero curto**: rótulo opcional, título, uma frase, dois botões e no máximo três destaques.
  A primeira dobra mostra CTA e produto, não só título. O resto desce.
- Grades simples: `grid-cols-1 → md:2 → lg:3`.
- Breakpoints: escolha um conjunto pequeno no início (ex.: 420, 640, 768, 920, 1280) e não
  crie outros.
- `scroll-padding-top` igual à altura do cabeçalho fixo, para âncora e foco não ficarem
  escondidos atrás dele.
- `overflow-x: hidden` no `body`.

### Painel / app

- Sidebar com superfície própria e **uma** linha na borda: divisória, não moldura.
- Recolhida mostra ícone e nome embaixo. Aberta no desktop passa por cima do conteúdo (com
  fundo escurecido), não o empurra. Fecha no fundo, no Esc e ao navegar.
- Item atual: **um** tratamento só. Fundo neutro, texto forte e ícone na cor de destaque.
  Nunca fundo tingido + texto colorido + barra lateral juntos.
- Barra do topo sempre escura nos dois temas, com um filete fino da cor de destaque. Nunca a
  barra inteira na cor de destaque: ela fica reservada para ação principal, item ativo e erro.
- Ações frequentes (tema, instalar app) visíveis. Conta e sair dentro do menu do avatar.
- Celular: tab bar inferior respeitando a safe area.

---

## 5. Superfícies e profundidade

### Vocabulário de sombra

A cor da sombra é a tinta (ou a marca, onde indicado); só a opacidade muda.

| Uso | Geometria e opacidade |
|---|---|
| Repouso de cartão | `0 1px 3px` a 4% + `0 1px 2px -1px` a 2% |
| Hover de cartão | `0 10px 25px -5px` a 16% + `0 8px 10px -6px` a 10%, na cor da marca |
| Nó / cartão de canvas | `0 1px 2px` a 5% + `0 6px 16px -4px` a 8% |
| Selecionado | anel `0 0 0 4px` da marca a 10% + a sombra de hover |
| Folha de documento | anel `0 0 0 1px` a 5% + `0 12px 32px -8px` a 14% |
| Modal | `0 24px 64px` a 50% + `0 4px 12px` a 30% |
| Palco do hero | `0 30px 70px -20px` a 45%: **a única** sombra forte da página |

### Regras

- **Sem gradiente empilhado.** No máximo uma camada decorativa por seção. Gradiente de fundo +
  glow + marca d'água ao mesmo tempo nunca.
- Textura de fundo (malha de pontos de 22–24px, grão, marca d'água da logo via `mask`) abaixo
  de 6% de opacidade. A malha pode ter significado (ex.: "fechado/concluído") em vez de ser só
  enfeite.
- Material de vidro (`backdrop-filter: blur(12px)` + fundo 85%) só no cabeçalho fixo, com
  fallback opaco em `prefers-reduced-transparency: reduce`.
- Backdrop de modal só escurece (tinta a 60%). Desfocar a página inteira custa caro.

---

## 6. Forma

Escala de raio única: `2 · 4 · 6 · 8 · 10 · 12 · 16 · 24px`.

- Botão, input, chip: 6–10px.
- Cartão: 12px.
- Contêiner grande (palco, banner, modal): 16px.
- `rounded-full` só em pill, badge, avatar e indicador. **Nunca em botão de texto.**
- Telas recriadas do produto usam o raio do produto, não o do marketing.

---

## 7. Componentes

### Botões

- Variantes: `primary` (cor de marca), `dark` (tinta), `ghost` (branco com borda que escurece
  no hover), `on-dark` (transparente com borda branca a 35%), `danger` (transparente, texto
  `danger-ink`, borda tingida). Mais `sm` e `icon`.
- `display: inline-flex; gap: .5rem; font-weight: 600`, altura 36px em painel denso e
  ~48px em marketing.
- `:active { transform: scale(0.97) }` com 140ms. `touch-action: manipulation`.
- Seta dentro do botão anda 4px para a direita no hover.
- Rótulo é o verbo da ação ("Excluir contato", "Agendar demonstração"), nunca "OK" ou "Enviar".
- Um CTA principal por tela. Na página de vendas, um canal de contato só.
- Botão magnético (inclina alguns px na direção do ponteiro, mola `stiffness 260, damping 18`)
  pode existir **uma vez**, na chamada final, e só para `pointerType === 'mouse'`.

### Cartões

- Fundo branco, borda de 1px sempre, raio 12px, padding 20–24px (12–14px em grade densa).
- Cartão clicável: hover sobe 2–4px e a borda ganha cor; `:active` encolhe para 0.985.
- Cartão **não** clicável não sobe nem ganha sombra no hover. Levantar diz "clicável".

### Listas com fio

Índices, configurações, resultados: `border-top` no contêiner, `border-bottom` em cada linha,
`padding-block: 12px`. Marcador opcional pequeno (um traço inclinado de 10×4px na cor de
marca). Hover de linha é **um sinal só**: borda mais forte e ações mais visíveis.

### Chips e badges

Altura 20px, raio cheio ou 6px, 11px peso 600. Fundo e borda derivados da cor com
`color-mix()`:

```css
.badge-success {
  background: color-mix(in srgb, var(--success) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--success) 24%, transparent);
  color: var(--success-text);
}
```

Badge não leva cor inline: a variante já traz fundo, borda e texto.

### Formulários

- Rótulo acima (12px, peso 500, cor secundária), `<label htmlFor>` sempre.
- Input 36px no desktop, 42–44px no toque, fundo um degrau acima, borda de 1px, foco com
  anel de 2px na cor de marca (sem glow, sem troca de fundo).
- Erro perto da fonte: borda na cor de erro, fundo 4% tingido, mensagem embaixo que entra em 180ms.
- Senha errada pode tremer uma vez (400ms): é rara, o encanto é merecido.
- Select e checkbox nativos crus destoam. Use um componente acessível de base (React Aria,
  Radix) com o seu visual por cima.
- Código de verificação em casas: um `<input>` real invisível sob as casas desenhadas.

### Modal e folha

- Sempre por portal: trava rolagem do fundo, leva o foco para dentro, prende o Tab, fecha no
  Esc, devolve o foco a quem abriu, `role="dialog"`, `aria-modal`, `aria-labelledby`.
- Desktop: centralizado, até 420px (600px para formulário), cabeçalho e rodapé presos, só o
  miolo rola. Entra com escala em mola (300ms).
- Celular (≤ 640px): vira folha de baixo, com alça de 36×5px no topo, rodapé `sticky`,
  respiro da safe area e altura que encolhe com o teclado.
- Confirmação substitui o `confirm()` do navegador: título em pergunta, mensagem dizendo o que
  se perde, botão com o verbo. Em ação destrutiva o foco começa em Cancelar.

### Abas

Sem trilho em caixa. Fio embaixo, aba ativa com texto forte e sublinhado de 2px na cor de
marca. Controle segmentado (duas opções) pode ter um "thumb" que desliza.

### Navegação de site

- Link do cabeçalho com sublinhado que se desenha da esquerda (`scaleX` 0 → 1, 200ms) no hover
  e fica permanente na página atual.
- Cabeçalho transparente sobre hero escuro, sólido ao rolar ou ao abrir o menu.
- Dropdown é cartão branco com ícone + título + subtítulo em grade.

### Acordeão e popover

- Acordeão anima altura com `grid-template-rows: 0fr → 1fr`, sem medir em JS.
- Popover, dropdown e banner de cookies ficam montados (com `inert` quando fechados) e animam
  entrada e saída com **tempos assimétricos**: abrir 200–320ms (a pessoa vai ler), fechar
  130–260ms (o sistema só responde).

### Estados

Vazio, carregando, erro e "não encontrado" sempre desenhados. Estado vazio é texto solto entre
fios, com um link de volta. Esqueleto pulsa a opacidade (0.35 ↔ 0.75, 1.4s). Toast no canto
inferior direito.

### Ícones

Uma biblioteca só por projeto, com traço consistente (ex.: 1,75 aplicado por classe global, em
vez de repetir a prop). Duotone só em destaque, com a parte clara na cor de marca. Nada de
ícone genérico de categoria (balança, estetoscópio, prancheta, foguete): mostre um pedaço real
do produto no lugar.

### Gráficos

SVG próprio quando for simples: uma medida por gráfico, linha de 2px, último ponto na cor de
marca, tooltip no toque e no mouse, número com `tabular-nums`. Card de placar com filete
escuro no topo (`box-shadow: inset 0 3px 0 var(--text-0)`) em vez de borda redonda.

### Janela do produto (palco do hero)

Em página de vendas, o produto aparece numa "janela de aplicação" recriada em HTML (barra de
título, conteúdo real com nomes e números fictícios), dentro de um notebook ou celular
desenhado em CSS. Ela pode rodar **uma** ação curta ao entrar na tela (um status muda, um
número recalcula, um selo aparece). A janela usa a paleta do produto, não a do marketing: a
diferença sinaliza "isto é a tela de verdade".

Dica técnica: o conteúdo é desenhado numa largura fixa e escalado para a tampa com
`container-type: inline-size` e `transform: scale(tan(atan2(100cqw, var(--largura))))`.

---

## 8. Movimento

### Tokens

```css
--ease-out-expo:      cubic-bezier(0.16, 1, 0.3, 1);    /* entradas, hover */
--ease-out:           cubic-bezier(0.23, 1, 0.32, 1);   /* estado de interface */
--ease-in-out-expo:   cubic-bezier(0.65, 0, 0.35, 1);   /* saídas, vai-e-vem */
--ease-drawer:        cubic-bezier(0.32, 0.72, 0, 1);   /* folhas, gavetas */
--ease-spring-bounce: cubic-bezier(0.18, 0.89, 0.32, 1.28); /* só onde houve impulso */
--transition-fast: 120ms; /* micro-feedback */
--transition:      160ms; /* hover e estado */
```

| Ação | Duração |
|---|---|
| Press de botão | 120–140ms |
| Hover, cor, borda | 150–200ms |
| Popover, aba, erro de campo | 180–220ms |
| Modal, folha, troca de passo | 280–340ms |
| Entrada do hero | 550–900ms, escalonada |
| Loop lento (respiração, deriva) | 2,4s, 3,2s, 6s, 12s |

### Regras

- **Um momento orquestrado por página.** Normalmente o hero: as palavras do título sobem de um
  leve desfoque em sequência (`--i * 55ms`), depois lede, botões e destaques. Nada de toda
  seção aparecendo ao rolar.
- **Frequência decide o encanto.** Ação repetida (abrir menu, marcar item) é rápida e seca.
  Ação rara (copiar, concluir, errar senha) pode ter um salto ou um tremor.
- **Nada começa invisível esperando JavaScript.** Entrada em CSS puro que roda do HTML
  pré-renderizado. Revelação ao rolar só esconde depois que o JS marcou o contêiner. Contador
  que sobe só zera se ainda estiver abaixo da dobra, e termina no valor exato.
- Animação ligada à rolagem em CSS (`animation-timeline: view()` dentro de
  `@supports`): sem suporte, a tela só aparece pronta.
- Mola sem quique em quem não teve impulso. Quique só ao soltar depois de arrastar.
- Material entra com opacidade + escala 0.985 + desfoque juntos, não com fade chapado.
  Formulário inteiro não se desfoca: só direção e opacidade.
- Loops com significados distintos não compartilham ritmo. Se 1s já quer dizer "chegou algo"
  e 2s "carregando", a luz de "aguardando" respira em 3,2s. Ícone que gira sem parar vira
  spinner e mente. Prefira girar uma vez na chegada e descansar.
- Transição entre telas com View Transitions: elementos que existem nas duas telas cruzam, o
  corpo desliza no sentido do movimento (avançar entra pela direita, voltar pela esquerda).
- Faixa infinita (marquee) com máscara nas bordas, pausa no hover e, com movimento reduzido,
  vira lista quebrada em linhas.
- Feixe de luz numa borda (`conic-gradient` com `@property --angulo`) num único cartão, 7s.
- Hover discreto. Um efeito, não três gritando "passe o mouse aqui".

### Movimento reduzido

`prefers-reduced-motion: reduce` **troca** o retorno, não remove: o que desliza ou escala vira
cross-fade curto (160–200ms); cor e opacidade continuam; spinner de carregamento segue
girando (é status). Um sinal que depende de animação ganha versão estática (a luz que respira
fica acesa a 45%). Com Motion: `MotionConfig reducedMotion="user"`.

---

## 9. Interação e acessibilidade

- **Hover só para quem tem hover.** Redefina a variante no projeto inteiro, para nada ficar
  "preso" depois de um toque:

  ```css
  @custom-variant hover {
    @media (hover: hover) and (pointer: fine) {
      &:hover { @slot; }
    }
  }
  ```

  No toque, o retorno é `:active` e escala.
- Foco visível: `outline: 2px solid` na cor `-ink` da marca, `offset 2–3px`. Sobre fundo escuro,
  a cor viva. Dentro de sidebar, o anel vai por dentro.
- **Alvos de toque**: interface pode ser densa no desktop (28–36px), mas em
  `@media (pointer: coarse)` todo controle tem no mínimo 44px. Não fixe `height` inline em
  botão ou campo, isso anula a regra.
- Botão só de ícone tem `aria-label` com ação e alvo ("Remover item Pedido 42").
- Nada que aparece no hover muda o tamanho do elemento: controle sob demanda fica fora do fluxo
  (`position: absolute` + `opacity`), nunca `display: none`.
- `-webkit-tap-highlight-color: transparent` e `-webkit-touch-callout: none` em botões.
- Safe area (`env(safe-area-inset-*)`) em barras fixas; ações de modal acima do teclado no iOS.
- `prefers-contrast: more`: bordas passam para a versão forte e 1,5px.
- `color-scheme` declarado; `<meta name="theme-color">` acompanha o tema.
- `::selection` na cor de marca. Scrollbar fina (6px, polegar na cor de linha forte).
- Ações destrutivas sempre confirmadas, dizendo o que se perde.

### Tema escuro (quando houver)

- Cinzas neutros em quatro degraus (fundo, cartão, input/hover, elevado), do quase preto ao
  cinza escuro médio. Bordas em branco a 10% e 20%.
- A cor de destaque escura é outra, não a mesma: clareie para texto pequeno
  (`color-mix(in srgb, var(--accent-hover) 80%, var(--text-0))`).
- Texto terciário precisa passar 4,5:1 nos três primeiros degraus. No quarto, use o secundário.
- Confira todo componente novo nos dois temas.

---

## 10. Conteúdo e prova

- Nada de foto de banco de imagem. O produto é mostrado pelas próprias telas.
- Não fabricar prova social: sem depoimento, logo de cliente ou contagem que não exista.
  Prove com comparativo de funcionalidade e tela real.
- Número na página só se estiver confirmado na fonte (código, banco, contrato).
- Terminologia técnica do público, correta. Imprecisão mina credibilidade com quem é do ramo.
- Voz direta, técnica mas acessível. Frase curta. Nada de hype.

---

## 11. Desempenho

- Fontes self-hosted, pré-carregadas, com `unicode-range`. Sem Google Fonts em runtime.
- Imagens em WebP/SVG, `width` e `height` sempre (zero CLS), `fetchPriority="high"` só na
  imagem do hero, `loading="lazy"` no resto.
- Pré-renderize o HTML (SSG/SSR). Animações de entrada em CSS para rodar antes da hidratação.
- Prefira CSS a biblioteca para efeitos (marquee, acordeão, scroll-driven). Use uma lib de
  animação (Motion) só para o que responde à ação: layout, presença, mola.
- Ilustração vetorial gerada por script (meio-tom, padrão) pesa menos que bitmap.

---

## 12. Anti-padrões (o que faz parecer template)

- Gradiente decorativo de dois matizes, glow atrás do título, blobs desfocados.
- Rótulo em caixa alta acima de **todo** título + uma palavra do título colorida. Se usar rótulo,
  use com propósito e de forma consistente; destacar uma palavra só, nunca.
- Faixa colorida grossa na lateral de cartões.
- Grade de cartões iguais com ícone em círculo colorido + título + duas linhas.
- `rounded-full` em botão, sombra em tudo, tudo em cartão.
- Seção inteira aparecendo com fade ao rolar.
- Hover que levanta, colore, escala e sombreia ao mesmo tempo.
- Cinza padrão de framework como texto sobre branco (reprova AA).
- Cor viva de marca escrevendo texto pequeno.
- Ícone genérico de categoria e emoji como ícone.
- Botão "OK", "Enviar", "Clique aqui".

---

## 13. Template de tokens (Tailwind v4)

Ponto de partida. Os valores entre `<...>` são da paleta de cada projeto: preencha e meça
cada par antes de usar. O resto (escala, botões, animações) funciona como está.

```css
@import "tailwindcss";

@custom-variant hover {
  @media (hover: hover) and (pointer: fine) {
    &:hover { @slot; }
  }
}

/* Regra de papel: brand só preenche; brand-ink escreve texto pequeno;
   brand-soft só fundo de chip. Anote o contraste medido ao lado. */
@theme {
  /* Neutros */
  --color-paper: <quase branco>;           /* fundo da página */
  --color-ink: <quase preto>;              /* texto */
  --color-graphite: <um degrau acima da tinta>; /* hover de fundo escuro */
  --color-line: <cinza claro>;             /* divisórias */
  --color-line-strong: <cinza um degrau mais escuro>;
  --color-muted: <cinza de texto secundário>; /* ≥ 4,5:1 sobre branco e papel */

  /* Marca */
  --color-brand: <cor da marca>;           /* só preenche */
  --color-brand-hover: <marca um pouco mais escura>;
  --color-brand-ink: <marca escurecida>;   /* texto pequeno: ≥ 4,5:1 sobre branco e soft */
  --color-brand-soft: <marca bem clara>;   /* fundo de chip */
  --color-brand-foreground: <tinta ou branco>; /* o que passar sobre a marca */
  --color-warm: <matiz da marca quase sem saturação>; /* wash de seção */
  --color-warm-line: <um degrau mais escuro que o wash>;

  /* Semânticas: o mesmo trio vivo / ink / soft de cada uma */
  --color-success: <sucesso>; --color-success-ink: <...>;  --color-success-soft: <...>;
  --color-warning: <aviso>;   --color-warning-ink: <...>;  --color-warning-soft: <...>;
  --color-danger:  <erro>;    --color-danger-ink: <...>;  --color-danger-soft:  <...>;
  --color-info:    <info>;    --color-info-ink:    <...>;  --color-info-soft:    <...>;

  --font-display: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-expo: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}

@layer base {
  html {
    scroll-behavior: smooth;
    scroll-padding-top: 5rem;
    -webkit-font-smoothing: antialiased;
    color-scheme: light;
  }
  body {
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-sans);
    overflow-x: hidden;
  }
  h1, h2, h3, h4 { font-family: var(--font-display); text-wrap: balance; }
  p { text-wrap: pretty; }
  :focus-visible {
    outline: 2px solid var(--color-brand-ink);
    outline-offset: 3px;
    border-radius: 4px;
  }
  .bg-ink :focus-visible { outline-color: var(--color-brand); }
  ::selection { background: var(--color-brand); color: var(--color-ink); }
}

@layer components {
  .heading-hero {
    font-size: clamp(2.35rem, 1.4rem + 3.3vw, 4rem);
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1.03;
  }
  .heading-section {
    font-size: clamp(1.9rem, 1.25rem + 2.2vw, 3rem);
    font-weight: 700;
    letter-spacing: -0.035em;
    line-height: 1.08;
  }
  .lede { color: var(--color-muted); font-size: 1.0625rem; line-height: 1.7; }

  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
    border-radius: 10px; padding: .85rem 1.35rem;
    font-size: 15px; font-weight: 600; line-height: 1.2;
    touch-action: manipulation;
    transition: background-color .15s, border-color .15s, color .15s,
                transform .15s var(--ease-out-expo);
  }
  .btn:active { transform: scale(0.975); }
  .btn-primary { background: var(--color-brand); color: var(--color-brand-foreground); }
  .btn-primary:hover { background: var(--color-brand-hover); }
  .btn-dark { background: var(--color-ink); color: #fff; }
  .btn-dark:hover { background: var(--color-graphite); }
  .btn-ghost { background: #fff; color: var(--color-ink); border: 1px solid var(--color-line); }
  .btn-ghost:hover { border-color: var(--color-ink); }
  .btn-on-dark { color: #fff; border: 1px solid rgb(255 255 255 / .35); }
  .btn-on-dark:hover { border-color: #fff; }

  .ruled-list { border-top: 1px solid var(--color-line); }
  .ruled-list > li { padding-block: 12px; border-bottom: 1px solid var(--color-line); }
}

/* Entrada do hero: o único momento orquestrado. Só com no-preference,
   então o padrão é tudo visível. */
@media (prefers-reduced-motion: no-preference) {
  .palavra {
    display: inline-block;
    animation: palavra-sobe .8s var(--ease-out-expo) both;
    animation-delay: calc(var(--i) * 55ms + 80ms);
  }
  .entra {
    animation: entra-sobe .9s var(--ease-out-expo) both;
    animation-delay: calc(var(--i) * 90ms + 520ms);
  }
}
@keyframes palavra-sobe {
  from { opacity: 0; transform: translateY(.35em); filter: blur(8px); }
}
@keyframes entra-sobe {
  from { opacity: 0; transform: translateY(12px); }
}

/* Telas do produto assentam ao rolar; sem suporte, aparecem prontas. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .tela-entra {
      animation: tela-entra linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 28%;
    }
  }
}
@keyframes tela-entra {
  from { opacity: .35; transform: translateY(48px) scale(.97); }
}

/* Acordeão sem medir altura em JS. */
.accordion-row {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows .3s var(--ease-out-expo);
}
.accordion-row[data-open='true'] { grid-template-rows: 1fr; }
.accordion-row > div { overflow: hidden; }

@media (pointer: coarse) {
  .btn, input, select, textarea { min-height: 44px; }
}

@media (max-width: 768px) {
  input, select, textarea { font-size: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: .001ms !important;
    transition-duration: .001ms !important;
  }
}
```

No título do hero, divida as palavras e mantenha o texto acessível:

```jsx
<h1 className="heading-hero max-w-[17ch]" aria-label={TITULO}>
  {TITULO.split(' ').map((p, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span aria-hidden="true" className="palavra" style={{ '--i': i }}>{p}</span>
    </Fragment>
  ))}
</h1>
```

---

## 14. Checklist antes de publicar

- [ ] Uma cor de destaque; vivo só preenche, `-ink` escreve.
- [ ] Todo par texto/fundo medido (4,5:1 pequeno, 3:1 grande e UI), também nas superfícies escuras.
- [ ] Títulos com `balance`, parágrafos com `pretty`, larguras em `ch`.
- [ ] Números com `tabular-nums`.
- [ ] Hero curto, CTA e produto visíveis na primeira dobra (celular e desktop).
- [ ] Borda antes de sombra; uma sombra forte no máximo; nenhum gradiente empilhado.
- [ ] Nada de cartão dentro de cartão; listas com fio onde não precisa de caixa.
- [ ] Um momento de entrada; nada invisível no HTML pré-renderizado.
- [ ] Hover só com `pointer: fine`; alvos de 44px no toque; inputs com 16px no celular.
- [ ] Foco visível em tudo, `aria-label` em botão de ícone, modal com foco preso e Esc.
- [ ] Movimento reduzido testado: o retorno troca, não some.
- [ ] Estados vazio, carregando e erro desenhados.
- [ ] Sem foto de banco, sem prova social inventada, sem ícone genérico.
- [ ] Fontes self-hosted, imagens com dimensões, zero CLS.
- [ ] Testado em 360px, 768px e 1440px, e nos dois temas se houver.
