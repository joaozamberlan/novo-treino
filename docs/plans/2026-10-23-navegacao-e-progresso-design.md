# Navegação do treinador e progresso do aluno

Data: 2026-10-23

Três melhorias de uso, validadas em conversa:

1. Treinador: buscar aluno na barra superior e menu lateral em trilho fixo.
2. Treinador: rodapé do modal de exercício com dois botões.
3. Aluno: progresso fixo no topo e descida até o próximo exercício.

---

## 1. Barra superior e menu do treinador

### Buscar aluno na barra

- Campo "Buscar aluno…" no centro da barra escura, com lupa e a dica do
  atalho `/`. Usa o `CampoBusca` (sem acento, palavras em qualquer ordem).
- Escolher abre `/alunos/:id/periodizacoes`, o mesmo destino da lista de
  Alunos.
- Atalhos `/` e `Ctrl+K` (`Cmd+K`) focam o campo de qualquer tela, menos
  quando o foco já está num campo de texto. Esc sai.
- Dados: a lista que o app já guarda em `memoryCache` (`'alunos'`). Se o
  cache estiver vazio, busca `/alunos` uma vez ao focar. Sem endpoint novo.
- Celular: o campo não cabe ao lado da marca; vira um botão de lupa que
  abre a busca ocupando a barra, com um botão para fechar.

### Trilho fixo (D1)

- Trilho de ~76px à esquerda, sempre visível no desktop: ícone com o nome
  pequeno embaixo. Início, Alunos, Biblioteca, Configurações e, para o
  superadmin, Administração.
- Saem o botão de menu (hambúrguer), o menu aberto por cima com fundo
  escurecido e as tooltips.
- Biblioteca vira link simples para `/exercicios`: a página já tem as
  próprias abas (eram 4; o submenu mostrava 3).
- Item atual: um tratamento só (fundo neutro, ícone em vermelho).
- Celular: sem mudança, continua a barra de abas de baixo.

## 2. Modal de adicionar exercício

- Dois botões: `Fechar` e **`Adicionar`** (vermelho, mantém o modal aberto).
- Ao adicionar, limpa só o exercício e as instruções; séries, reps,
  descanso, técnica e grupo ficam. Foco volta para a busca no desktop.
- Depois do primeiro, `Fechar` vira `Concluir · N adicionados`.
- Enter num campo aciona `Adicionar`.
- Edição de exercício não muda: `Cancelar` e `Salvar`.

## 3. Área do aluno

### Progresso fixo no topo

- Faixa fina que gruda no topo ao rolar: barra segmentada (um segmento por
  exercício, cheio quando todas as séries estão feitas) e "3 de 7
  exercícios" em mono.
- Tocar leva ao primeiro exercício não concluído.
- Só na ficha da periodização atual, com treino em andamento. Some com o
  treino encerrado e em periodizações antigas (somente leitura).
- Usa as contas que a barra de "Progresso da sessão" já faz. Nada é salvo.

### Descer até o próximo

- Ao marcar a última série de um exercício, depois de ~600ms, a tela desce
  até o próximo exercício não concluído.
- Não desce ao desmarcar. No último exercício desce até o "Encerrar treino".
  Com "reduzir movimento", o salto é sem animação.
- O timer de descanso flutuante continua igual.

## Fora do escopo

- Tela sempre acesa (Wake Lock) e avisos de leitor de tela: sugeridos, não
  escolhidos agora.
