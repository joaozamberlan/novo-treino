# Aviso de exercício repetido entre fichas

Data: 2026-10-21

## Problema

O treinador coloca supino reto no treino A e, sem perceber, de novo no D. Ele
quer ser avisado, sem ser bloqueado, e quer ver na ficha quais exercícios se
repetem em outras fichas do mesmo aluno.

## Regra

- Repetido = o mesmo exercício do catálogo (`idExercicio`) em mais de uma
  linha das fichas da **periodização aberta**. Técnica, séries e reps não
  importam. Periodizações antigas não contam.
- Repetir dentro da mesma ficha também conta.
- Nada é bloqueado; tudo é aviso.

## Telas

1. **Tag na linha do exercício** (aba Fichas do Treinos): ícone de repetir +
   "também em Upper", "também em Upper, Pull" ou "2× nesta ficha".
2. **Marca no seletor de exercício** do modal: os já usados mostram "em Upper"
   à direita, em mono pequeno.
3. **Confirmação ao salvar** (`useConfirmar`): "Supino reto já está no Upper.
   Adicionar no Full body mesmo assim?" com "Adicionar mesmo assim" / "Voltar".
   Voltar mantém o modal aberto e preenchido. Na edição só pergunta se o
   exercício foi trocado por um que já existe; a própria linha editada não conta.

## Implementação

Só front. `utils/repetidos.ts` monta, a partir das fichas da periodização,
onde cada exercício aparece. Tag, seletor e confirmação usam a mesma função,
recalculada quando as fichas mudam. `Seletor` ganha um texto de apoio
opcional por opção (`detalhe`).

## Fora do escopo

Periodizações anteriores, bloqueio, aviso na cópia de periodização.
