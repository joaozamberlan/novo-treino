# Região do corpo do grupo muscular

Data: 2026-10-24

## Problema

Cada treinador tem os próprios grupos, e o app descobria qual músculo acender
pelo nome do grupo, numa tabela fixa. Grupos como "Ombro posterior",
"Peitoral superior" ou "Post. coxa" ficavam sem miniatura na Biblioteca e
sumiam do mapa do volume semanal.

## Decisão

O treinador escolhe a **região do corpo** ao criar ou editar o grupo. Ícone
genérico foi descartado: não diz qual músculo é e não resolve o volume semanal.

### Regiões

Uma por músculo da ilustração. Subdivisões usam o músculo inteiro (ombro
anterior, lateral e posterior → Ombros; costas alta e baixa → Costas;
peitoral superior, médio e inferior → Peito).

Peito, Costas, Ombros, Bíceps, Tríceps, Antebraço, Abdômen, Glúteos,
Quadríceps, Posterior de coxa, Adutores, Panturrilha e **Sem região**
(`nenhuma`). Adutores não têm máscara na ilustração: a miniatura desenha a
face interna da coxa por cima; no mapa do volume semanal aparecem só no placar.

### Dados

- `GrupoMuscular.regiao` (texto, opcional), validado contra a lista no
  backend (`REGIOES_GRUPO`). Migração só adiciona a coluna.
- Vazia: o app usa o palpite pelo nome (`sugerirRegiao`), então grupos antigos
  e os criados pelo atalho do modal de exercício seguem funcionando sem revisão.
- Edição sem `regiao` no pedido não mexe na salva.

### Uso

- Miniatura da aba Grupos e mapa do volume semanal (treinador e aluno).
- No mapa, grupos na mesma região somam as séries no mesmo músculo (a
  biblioteca só junta pela maior intensidade, então a soma é feita antes).

### Tela

- Modal de grupo: seletor "Região no corpo" com prévia da miniatura.
- Enquanto o treinador não escolhe à mão, a região acompanha o nome digitado.
- Grupo antigo abre com o palpite do nome; salvar grava a região.
- "Novo grupo" rápido do modal de exercício continua só com o nome.

## Testes

- Backend: criar e editar com e sem região; DTO aceita a lista e recusa o resto.
- Frontend: 41 nomes de treinador contra o palpite; tela com dados simulados
  (sugestão, escolha manual que não é sobrescrita, envio, grupo antigo).
