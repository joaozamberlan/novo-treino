# Navegação em duas etapas: Alunos → Periodizações → Treino

## Motivação

Clicar num aluno levava direto para a tela de treino do protocolo `ativo`,
escondendo as demais periodizações atrás de um modal. O pedido foi tornar a
navegação mais parecida com abrir pastas no Windows/Mac: clicar no aluno
mostra as periodizações (pastas), clicar numa periodização mostra o treino
(o conteúdo da pasta).

## Fluxo

```
/alunos (ou Home)
  ↓ clica no aluno
/alunos/:idAluno/periodizacoes        ← nova página
  ↓ clica numa periodização (sempre, mesmo havendo só uma)
/alunos/:idAluno/treinos?periodizacao=:idProtocolo
```

Não há atalho automático para a periodização "Ativa" — todo acesso passa
pela lista, por consistência e previsibilidade.

## Reforço da metáfora de pastas

Cada tela ganhou uma trilha de navegação (breadcrumb) clicável, como o path
bar do Explorer/Finder, subindo sempre um nível por vez:

- `/alunos/:id/periodizacoes`: `Alunos / [Nome do Aluno]`
- `/alunos/:id/treinos`: `Alunos / [Nome do Aluno] / Periodizações / [Nome do Ciclo]`

Componente novo: `frontend/src/components/Breadcrumb.tsx`.

## Página `/alunos/:idAluno/periodizacoes`

Novo arquivo `frontend/src/pages/Periodizacoes.tsx`. Reaproveita os
endpoints já existentes (`GET /alunos/:id`, `GET /treinos/protocolos/:idAluno`).
Lista cada ciclo como um card (nome, badge "Ativo", objetivo, datas) com as
ações que antes viviam no modal "Periodizações" dentro de `/treinos`:
**Ver Treino**, **Marcar como Atual**, **Compartilhar** (usa o `tokenPublico`
daquela periodização), **Editar**, **Excluir**. O botão **+ Nova
Periodização** abre um modal de criação/edição reaproveitando o mesmo form.

Esse modal e toda a lógica de CRUD de periodização foram **removidos** de
`Treinos.tsx` — esta página é agora o único lugar onde periodizações são
criadas, editadas, ativadas ou excluídas.

## Mudanças em `/alunos/:idAluno/treinos`

- Lê `?periodizacao=:idProtocolo` da URL e busca diretamente
  `GET /treinos/protocolos/detalhes/:idProtocolo` (em vez do endpoint
  `visao-geral`, que só resolvia o protocolo ativo).
- Sem o parâmetro na URL, redireciona para `/alunos/:idAluno/periodizacoes`
  — a tela nunca mais tenta adivinhar/mostrar um protocolo sozinha.
- O "Volume semanal" (rodapé) passou a ser calculado no cliente a partir do
  protocolo carregado (`volumeSemanalPorGrupo`, que já existia para o
  resumo de impressão) em vez de vir do endpoint `/treinos/volume/:idAluno`,
  que só calculava para o protocolo ativo do aluno — errado ao visualizar
  uma periodização inativa.
- Se a periodização não for encontrada (excluída, ou link antigo), mostra um
  estado de erro com link de volta para a lista de periodizações.

## Não mudou

Fichas (criar/editar/excluir/reordenar), prescrição de exercícios, geração
de PDF, e o botão "Compartilhar" do cabeçalho de `/treinos` (continua
copiando o link da periodização em visualização).

## Validado via

- `tsc -b` e `vite build` limpos.
- Smoke test via API local (registro de conta de teste, criação de aluno e
  duas periodizações, e chamada de cada endpoint que as telas novas usam:
  listar, ver detalhes de uma periodização não-ativa, marcar como atual,
  editar, excluir, 404 em periodização inexistente) — dados de teste
  removidos ao final.
