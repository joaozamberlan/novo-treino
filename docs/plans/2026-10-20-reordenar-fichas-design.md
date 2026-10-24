# Reordenar fichas de uma periodização

Data: 2026-10-20

## Problema

Ao copiar uma periodização de um aluno para outro, o treinador quer mudar a
ordem das fichas: a ficha B do aluno de origem pode precisar ser a A, ou a E,
do aluno de destino. A letra da ficha (no PDF e na área do aluno) vem da
posição (`Treino.ordem`), não do nome.

## Decisão

A cópia continua como está (periodização inteira, mesma ordem, mesmos nomes).
Entra uma função de **reordenar fichas** na tela do treino, igual à dos
exercícios. Assim o treinador copia e depois arrasta, e a mesma função serve
para qualquer periodização, a qualquer momento.

Considerado e descartado: reordenar dentro do modal de cópia (lista arrastável
ou seletor de posição por ficha). Resolvia só a cópia, mexia nos dois modais e
exigia um campo novo e validação na API de duplicar.

## Comportamento

- As abas das fichas (Upper, Limbs, Pull...) podem ser arrastadas para os
  lados. O arrasto só vale com mouse; no toque a barra de abas continua
  rolando normalmente.
- No cabeçalho da ficha aberta entram dois botões, "mover para a esquerda" e
  "mover para a direita", que servem para teclado e para o celular.
- O nome da ficha não muda; só a posição (e com ela a letra).
- A UI atualiza na hora (otimista); se a gravação falhar, recarrega o treino.

## Dados

Sem mudança de API. `PATCH /treinos/fichas/:idTreino` já aceita `ordem`. Ao
reordenar, todas as fichas da periodização recebem `ordem` 1..n na sequência
nova; isso também corrige ordens repetidas ou com buracos que já existam.

## Fora do escopo

Copiar só algumas fichas, renomear durante a cópia, reordenar dentro do modal
de cópia.

## Teste

`tsc` + build. No navegador: arrastar abas, botões de mover, recarregar a
página e conferir que a ordem ficou. Atenção: o backend local usa o banco de
produção, então o teste de gravação acontece numa periodização real.

## Revisão (2026-10-25): modal "Ordenar fichas"

No uso, o arrasto das abas ficou pouco prático no PC (barra estreita que rola
para os lados, clique e arrasto no mesmo alvo) e no celular sobravam só as
setas ← → do cabeçalho, uma posição por toque.

Substituído por um modal próprio, aberto pelo botão "Ordenar" ao lado das
abas (fora da área que rola, para não sumir no celular):

- Lista vertical das fichas com a letra que cada uma vai ter (A, B, C…),
  alça de arrastar (mouse e toque, como nos exercícios) e setas ↑ ↓.
- "Salvar ordem" grava tudo de uma vez; "Cancelar" descarta.
- Saem o arrasto das abas e as setas ← → do cabeçalho: um jeito só de ordenar.
- Gravação igual à de antes (`handleReorderFichas`, ordem 1..n).
