# PRD — TreinosApp

> Documento de requisitos do produto. Descreve **o que** o app faz e **para quem**.
> Para **como** é construído, ver [ARQUITETURE.md](ARQUITETURE.md).

## 1. Visão

TreinosApp é uma plataforma para personal trainers **prescreverem fichas de treino
estruturadas** e **compartilharem com os alunos por um link**, sem que o aluno precise
criar conta. O aluno registra cargas e repetições durante o treino; o treinador acompanha
o progresso.

**Foco futuro:** comercializar o produto com dois planos pagos:
um para **treinadores** e um para o **aluno que treina sozinho**, sem treinador
(ver [seção 3](#3-modelo-de-negócio)).

Produção: frontend em `https://novo-treino.vercel.app`, API no Railway.

## 2. Personas

| Persona | Quem é | Como acessa | Paga ao app? |
|---|---|---|---|
| **Treinador** (`Profissional`, role `USER`) | Personal trainer ou acadêmico de Educação Física (CREF opcional) | Login com e-mail e senha, depois de aprovado pelo admin | **Sim**, mensalidade (Plano Treinador) |
| **Aluno do treinador** (`Aluno`) | Cliente de um treinador | Link público `/v/:token`, **sem login** | **Não**. Paga o treinador, fora do app |
| **Aluno independente** *(futuro)* | Pessoa que monta e acompanha o próprio treino, sem treinador | A definir (precisa de conta própria) | **Sim**, mensalidade (Plano Aluno) |
| **Admin** (`Profissional`, role `ADMIN`) | Dono da plataforma | Mesmo login do treinador + tela `/admin` | — |

## 3. Modelo de negócio

O app cobra **assinatura mensal** de quem usa a ferramenta. Não intermedia dinheiro entre
treinador e aluno.

```
 Treinador ──mensalidade──►  TreinosApp
 Aluno do treinador ──paga──► Treinador        (fora do app, o app não participa)
 Aluno independente ──mensalidade──►  TreinosApp
```

### 3.1 Plano Treinador
- **Quem assina:** o treinador.
- **O que ganha:** tudo o que existe hoje na área do treinador (alunos, periodizações,
  fichas, catálogo, PDF, progresso, link do aluno).
- **Alunos dele:** usam de graça pelo link. A cobrança do aluno é assunto do treinador;
  o app **não** processa, registra nem cobra comissão sobre esse pagamento.
- **Níveis:** não decidido. Pode ser um plano único ou vários níveis
  (ex.: Básico/Pro, Standard/Pro/Ultra, Bronze/Prata/Ouro). O que diferencia cada nível
  também não está definido.

### 3.2 Plano Aluno
- **Quem assina:** a pessoa que treina sozinha, sem treinador.
- **Monta o próprio treino como quiser:** cria e edita as próprias periodizações e fichas.
- **Limitado a ele mesmo:** não tem alunos, **não gera links de compartilhamento** e não
  tem as funções de gestão de alunos do treinador.
- É um produto **diferente** do aluno do treinador: este não paga nada e não precisa de conta.

### 3.3 Assinatura vencida do treinador
A pressão recai sobre o treinador (trava a edição), **nunca de surpresa sobre o aluno**,
que já pagou o treinador e pode estar no meio do treino.

| Etapa | Treinador | Links dos alunos |
|---|---|---|
| **Carência** (7 dias) | Tudo funciona, com aviso para atualizar o pagamento | Funcionam normalmente |
| **Vencido** (até 30 dias) | Só leitura: vê e exporta, não cria nem edita alunos e fichas | Funcionam: o aluno vê o treino e registra cargas |
| **Depois disso** | Só leitura, com opção de reativar | Mostram: **"Ficha indisponível no momento, fale com seu treinador."** |
| **Reativou** | Tudo volta como estava | Os mesmos links voltam a funcionar |

Regras:
- A mensagem ao aluno é **neutra**: nunca mencionar pagamento, assinatura ou vencimento.
- Nenhum dado é apagado automaticamente sem aviso prévio ao treinador.
- Reativar restaura tudo, inclusive os links já enviados.
- Os prazos de 7 e 30 dias são os valores iniciais e podem ser ajustados.

### 3.4 Perguntas em aberto
Decisões ainda não tomadas. Não implementar nada disso antes de respondidas.

1. Preço de cada plano e se haverá plano anual ou período de teste.
2. Plano Treinador: plano único ou níveis? Quantos, com que nomes e o que muda entre eles?
3. Como o aluno independente entra: e-mail e senha como o treinador? Passa por aprovação
   do admin?
4. Um aluno independente pode depois passar a ter um treinador (e vice-versa)? O histórico vai junto?
5. O que acontece quando a assinatura do **Plano Aluno** vence?
6. Meio de pagamento na web.
7. O fluxo atual de aprovação manual pelo admin continua existindo depois do pagamento?
8. Por quanto tempo os dados de uma conta cancelada ficam guardados antes de serem
   apagados (com aviso), para a política de privacidade / LGPD.
9. *(Futuro)* Publicar ou não nas lojas (App Store / Google Play). Se publicar, avaliar as
   regras de assinatura vendida dentro do app (Guideline 3.1.1).

## 4. Glossário de domínio

| Termo no app | Modelo | Significado |
|---|---|---|
| Aluno | `Aluno` | Cliente de um treinador |
| Periodização / ciclo | `ProtocoloTreino` | Bloco de treino de um aluno (nome, objetivo, datas). Um aluno tem várias; uma é a "atual" (`ativo`) |
| Ficha / treino | `Treino` | Uma sessão-modelo dentro da periodização (ex.: "Treino A"). Ordenada por `ordem` |
| Prescrição | `TreinoExercicio` | Exercício dentro de uma ficha: séries, repetições (texto livre, ex. "8-12"), carga, descanso (fixo ou faixa), técnica, observação |
| Catálogo | `GrupoMuscular`, `Exercicio` | Biblioteca de exercícios **por treinador**, semeada no cadastro |
| Técnica | `TecnicaTreino` | Método avançado (drop-set, rest-pause…) aplicado a uma prescrição |
| Instrução | `InstrucaoTreino` | Frases de execução reutilizáveis, com autocomplete |
| Sessão | `SessaoTreino` | Uma execução real de uma ficha pelo aluno, em uma data |
| Série realizada | `SessaoExercicioSerie` | Carga (kg) e repetições registradas pelo aluno em cada série |

## 5. Funcionalidades existentes

### 5.1 Conta do treinador
- Cadastro (`/register`) com nome, e-mail, senha, profissão, telefone, Instagram; CREF opcional.
- Conta nasce **pendente** (`ativo = false`) até o admin aprovar.
- Login (`/login`) com JWT; trocar senha invalida sessões antigas (`versaoToken`).
- Configurações: dados de perfil, contatos, logo (guardada no banco), rodapé padrão das fichas, troca de senha.
- Tema claro/escuro.

### 5.2 Admin
- Listar treinadores, aprovar/desativar, promover a admin, gerar senha temporária.

### 5.3 Alunos
- CRUD de alunos (nome, e-mail, telefone).
- Gerar / regenerar / revogar o token de acesso do aluno.

### 5.4 Periodizações (`/alunos/:idAluno/periodizacoes`)
- Navegação em "pastas": Alunos → Periodizações → Treino, com breadcrumb.
- Criar, editar, excluir (exclusão lógica, preserva histórico), marcar como atual.
- Compartilhar o link público de uma periodização específica (`tokenPublico`).
- Copiar uma periodização para outro aluno (ou o mesmo) e importar de outro aluno.

### 5.5 Montagem da ficha (`/alunos/:idAluno/treinos?periodizacao=:id`)
- Criar, renomear, reordenar e excluir fichas.
- Adicionar exercícios do catálogo, reordenar por arrastar, editar parâmetros.
- Descanso como valor fixo ou faixa ("1-3 min").
- Rodapé por ficha (herda o padrão do treinador; `""` = sem rodapé).
- Tabela de progressão semanal (semanas 1–5), **apenas informativa**, igual para todas as fichas.
- Volume semanal por grupo muscular (alternar entre ficha atual e semana).
- Gerar PDF da ficha.
- Ver progresso de cargas do aluno.

### 5.6 Catálogo (`/exercicios`)
- CRUD de grupos musculares, exercícios (com descrição e vídeo), técnicas e instruções.

### 5.7 Experiência do aluno do treinador (`/v/:token`)
- Ver as fichas da periodização do link, com logo e rodapé do treinador.
- Iniciar sessão, registrar carga/reps por série, marcar exercícios como feitos, adicionar/remover séries extras.
- Cronômetro de descanso com vibração (onde suportado).
- Encerrar treino ou iniciar nova sessão.
- Ver progresso de cargas e recordes (PR).
- Baixar PDF da ficha.
- Instalar como PWA no **Android**; no **iOS** o PWA do aluno foi removido de propósito.

### 5.8 Progresso de cargas
- Histórico da **melhor série** (maior carga, desempate por reps) das últimas 12 sessões por exercício.
- Conta toda série marcada como feita, **mesmo sem "Encerrar treino"**.
- Segue o exercício do catálogo entre periodizações diferentes.
- Sinais permitidos: reps **acima** da faixa prescrita (subir carga) e **abaixo** (carga alta).
- **Não existe** alerta de estagnação (decisão de produto, ver [RULES.md](RULES.md)).

## 6. Requisitos não funcionais

- **Mobile-first**: o aluno usa no celular, na academia, com uma mão. Alvos de toque grandes, teclado não pode cobrir ações.
- **Idioma**: pt-BR em toda a interface.
- **Segurança**: nenhum dado de um treinador pode vazar para outro; links públicos são tokens aleatórios e revogáveis; `noindex` nas páginas de aluno.
- **Dados do aluno nunca se perdem**: exclusões de periodização e de prescrição são lógicas.
- **Online-first**: sem modo offline completo; o SW só faz cache dos estáticos e *network-first* das rotas públicas.

## 7. Fora de escopo

**Hoje** (ainda não existe, mas faz parte do foco futuro):
- Cobrança de assinatura dos planos Treinador e Aluno.
- Conta e login do aluno independente (Plano Aluno).

**Não faz parte do produto** (nem no futuro):
- Cobrança do aluno pelo treinador dentro do app, repasse ou comissão. O aluno paga o
  treinador por fora.
- Login para o aluno do treinador: ele continua acessando só pelo link.

**Fora de escopo por enquanto:**
- Chat treinador ↔ aluno.
- Decidir automaticamente em que semana da progressão o aluno está.

## 8. Roadmap planejado

1. **Comercialização:** Plano Treinador (assinatura) e Plano Aluno (conta própria +
   assinatura), depois de respondidas as perguntas da [seção 3.4](#34-perguntas-em-aberto).
2. **App nativo** *(a decidir se será publicado nas lojas)*: ver [docs/plans/2026-09-24-app-mobile-multiplataforma-design.md](docs/plans/2026-09-24-app-mobile-multiplataforma-design.md)
   e [task.md](task.md). Inclui Capacitor (App Store / Google Play), exclusão de conta,
   páginas de Privacidade e Termos (LGPD), push notifications e storage externo.
