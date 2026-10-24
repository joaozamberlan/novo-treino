# Ícones da Biblioteca e miniatura do músculo

Data: 2026-10-24

## 1. Ícones das abas

Os ícones atuais não dizem nada do conteúdo (pilha de folhas, pasta com +,
brilho de "IA", balão de mensagem). Troca, todos do Phosphor:

| Aba | Antes | Depois |
|---|---|---|
| Exercícios | `Stack` | `Barbell` |
| Grupos Musculares | `FolderPlus` | `PersonArmsSpread` |
| Técnicas de Treino | `Sparkle` | `Lightning` |
| Instruções | `ChatText` | `NotePencil` |

Onde o mesmo conceito aparece com o ícone antigo (ex.: criar grupo no modal
de exercício), troca junto. A Biblioteca no menu lateral continua com a barra.

## 2. Miniatura do corpo na aba Grupos

- Coluna estreita antes do nome: silhueta do mapa do volume semanal com o
  grupo aceso em vermelho, intensidade máxima.
- Recorte de 48×48px na faixa do corpo onde o grupo está (tronco, coxa ou
  perna). O corpo inteiro nesse tamanho deixava o músculo pequeno demais
  (ombros quase não apareciam); decidido ao ver as primeiras capturas.
- Um lado só: costas para costas, tríceps, glúteos, isquiotibiais e
  panturrilha; frente para o resto.
- Grupo sem região no mapa (Adutores, grupos criados pelo treinador): espaço
  vazio do mesmo tamanho, sem silhueta apagada.
- Carregamento sob demanda, igual ao do volume semanal: só entra com a aba
  Grupos aberta; enquanto carrega, o espaço fica vazio, sem pular a tabela.
- Decorativa (`aria-hidden`): o nome do grupo já diz tudo.
- Celular: à esquerda do nome no cartão, no mesmo tamanho.

Componente `MiniaturaMusculo.tsx`, usando `regioesDoGrupo` (utils/musculos)
e um novo `ladoDoGrupo`.

## Fora do escopo

Miniatura na aba Exercícios e no modal de prescrição.
