# Login do aluno (telefone + PIN) e PWA instalável no iPhone

## Motivação

O aluno acessa hoje por um link `/v/:token`, sem login. No iPhone, "Compartilhar →
Adicionar à Tela de Início" sempre abria a tela de login do treinador. Foram seis
tentativas de contornar (`81582a9`, `d49db76`, `f486b1e`, `b00b384`, `8a964c7`) até a
instalação ser removida no iOS (`825f6ed`). As duas causas:

1. O app instalado no iPhone **sempre abre na raiz do site (`/`)**, não no link do aluno,
   com ou sem manifest por link.
2. O app instalado tem **armazenamento separado do Safari**: nada do que o aluno fez no
   navegador existe dentro do app.

Conclusão: o aluno precisa conseguir **entrar de dentro do app instalado, pela raiz**.
Isso exige um login próprio do aluno.

## Decisões

| Tema | Decisão |
|---|---|
| Como o aluno prova que é ele | **Telefone + PIN de 4 dígitos.** Sem SMS/WhatsApp (custo) e sem "só telefone" (qualquer um que saiba o número veria os dados) |
| Primeiro acesso | Pelo link: confirma o telefone e cria o PIN. O link é a prova de posse inicial |
| Esqueceu o PIN | O treinador clica em **Redefinir PIN** e reenvia o link |
| Telefone | **Obrigatório** no cadastro e na edição. Todos os alunos atuais já têm telefone, então não existe modo "sem login" |
| Mesmo telefone em mais de um treinador | O PIN é por cadastro de aluno. Se bater em mais de um, o aluno escolhe qual abrir |
| Protocolos anteriores | O aluno vê fichas e histórico, mas só registra cargas no protocolo atual |
| Arquitetura | Login do aluno **dentro do mesmo app** (um site, um deploy). Descartados: subdomínio separado e sessão em cookie `httpOnly` |

## Fluxos

**1. Treinador cadastra o aluno.** Telefone obrigatório, gravado também normalizado (só
dígitos, com 55), sem repetir dentro do mesmo treinador.

**2. Aluno abre o link `/v/:token`.**

| Situação | O que aparece |
|---|---|
| Ainda sem PIN (1º acesso) | "Confirme seu telefone" + "Crie um PIN de 4 dígitos" + "Repita o PIN" → entra |
| Já tem PIN | Telefone + PIN → entra. Se já estiver logado neste navegador, vai direto |
| Telefone do cadastro inutilizável para login | "Fale com seu treinador para atualizar seu cadastro." |

Depois de entrar, vai para `/aluno` aberto no protocolo daquele link.

**3. Aluno abre o app instalado (ou o site pela raiz).** Sem sessão, aparece a escolha
"Sou aluno / Sou treinador" (o app lembra a escolha). "Sou aluno" → telefone + PIN →
área do aluno.

**4. Área do aluno.** Fichas do protocolo atual com registro de cargas, progresso,
protocolos anteriores em somente leitura e o botão **Instalar app**. Sessão de 90 dias,
renovada com o uso.

**5. Esqueceu o PIN.** "Esqueci meu PIN" → "Peça ao seu treinador para redefinir." O
treinador redefine e reenvia o link pelo WhatsApp.

**6. Treinador revoga o acesso ou redefine o PIN.** As sessões abertas do aluno caem na
hora, inclusive no app instalado.

## Banco

Uma migration, só em `Aluno`:

| Campo | Tipo | Para quê |
|---|---|---|
| `telefoneLogin` | `String?`, indexado | Telefone só com dígitos e DDI. `telefone` continua como o treinador digitou. A migration preenche para os alunos existentes |
| `pinHash` | `String?` | PIN com bcrypt. `null` = ainda não criou |
| `versaoToken` | `Int @default(0)` | Sobe ao redefinir o PIN ou revogar o acesso |
| `pinTentativas` | `Int @default(0)` | Erros seguidos de PIN/telefone |
| `pinBloqueadoAte` | `DateTime?` | Fim do bloqueio por tentativas |

`telefone` continua opcional na coluna; a obrigatoriedade fica nos DTOs de criar e editar.
A unicidade de `telefoneLogin` por treinador é validada no service.

## API

| Rota | Guard | O que faz |
|---|---|---|
| `GET /aluno/auth/acesso/:token` | throttle 30/min | O que o link deve mostrar: `estado` (`CRIAR_PIN`, `LOGIN` ou `ATUALIZAR_CADASTRO`), primeiro nome, treinador e o protocolo do link. Não devolve dados do treino |
| `POST /aluno/auth/primeiro-acesso` | throttle 5/min | `{ token, telefone, pin }`. Confere o telefone com o cadastro do aluno do link, exige que ainda não haja PIN, grava o `pinHash`, devolve a sessão |
| `POST /aluno/auth/login` | throttle 5/min | `{ telefone, pin }`. Devolve uma sessão por cadastro de aluno que bater (uma, ou várias para o aluno escolher) |
| `GET /aluno/me` | JWT aluno | Nome, treinador, logo. Devolve token renovado quando o atual está perto de vencer |
| `GET /aluno/protocolos` | JWT aluno | Protocolo atual e anteriores (não excluídos) |
| `GET /aluno/protocolos/atual` | JWT aluno | Fichas do protocolo atual (`protocolo: null` se não houver) |
| `GET /aluno/protocolos/:id` | JWT aluno | Fichas de um protocolo do próprio aluno |
| `GET /aluno/progresso/:id` | JWT aluno | Histórico de cargas |
| `/aluno/sessao/...` | JWT aluno | Obter/criar sessão, salvar séries, marcar exercício, remover série extra, encerrar, nova sessão |
| `POST /alunos/:id/pin/redefinir` | JWT treinador | Zera `pinHash`, tentativas e bloqueio; sobe `versaoToken` |

- **JWT do aluno:** `{ sub: idAluno, tipo: 'aluno', ver }`, 90 dias. Estratégia própria
  (`jwt-aluno`) que recarrega o aluno e rejeita se `ver !== versaoToken`. A `JwtStrategy`
  do treinador já recusa `tipo !== 'profissional'`.
- **Aluno ou treinador marcado como inativo:** não bloqueia o acesso, como já era no link
  público. Para cortar o acesso de um aluno o treinador usa **Revogar acesso**.
- **Reaproveitamento:** a lógica de sessão, séries e progresso saiu de
  `publico.service.ts` para `modules/area-aluno/area-aluno.service.ts` e recebe o aluno já
  identificado, em vez de resolver pelo token do link.
- **Rotas `/publico/*`:** as de treino, sessão, progresso e manifest foram removidas. Só
  fica `GET /publico/logo/:idProfissional`. O que o link precisa saber vem de
  `GET /aluno/auth/acesso/:token`.
- **`POST /alunos/:id/token/revogar`:** passa a subir também o `versaoToken` do aluno.
- **`/publico/manifest/:token`:** removida.

## Frontend

**Rotas**

| Rota | Tela |
|---|---|
| `/` | Treinador logado → área do treinador. Aluno logado → `/aluno`. Ninguém → escolha de perfil |
| `/aluno/entrar` | Telefone + PIN, "Esqueci meu PIN", seleção de treinador quando houver mais de um |
| `/v/:token` | Porta de entrada: primeiro acesso ou login. Depois redireciona para `/aluno` |
| `/aluno` | Área do aluno (a tela atual `PublicTreino`, lendo de `/aluno/*`) |

**Área do aluno:** seletor de protocolo no topo (atual + anteriores, estes marcados
"somente leitura") e menu com Instalar app, tema e Sair.

**Treinador:**
- `Alunos.tsx`: telefone obrigatório ao criar e editar, com validação de formato.
- Lista de alunos: estado do acesso ("PIN criado" / "aguardando 1º acesso" / telefone inválido).
- Menu do aluno: **Redefinir PIN**.

**Sessão do aluno:** token em `localStorage` (chave própria, separada da do treinador).
As duas sessões podem coexistir no mesmo aparelho; em `/` a do treinador tem prioridade.
401 em rota `/aluno/*` → logout do aluno e volta ao login.

## PWA

- **Um manifest só**, `start_url: "/"`. A raiz roteia pela sessão.
- **Instalar app** só na área do aluno logado: prompt nativo no Android
  (`usePWAInstall`), passo a passo "Compartilhar → Adicionar à Tela de Início" no iPhone.
- No iPhone o aluno digita telefone e PIN **uma vez dentro do app instalado**
  (armazenamento separado do Safari).
- Service worker: `/aluno/` com *network-first* (última ficha abre offline por até 24 h);
  o cache é limpo no logout.
- `X-Robots-Tag: noindex` e `Referrer-Policy: no-referrer` também em `/aluno`.

**Estado:** o botão Instalar app, o roteamento da raiz e a remoção do
`LAST_PUBLIC_TOKEN_KEY` entraram no passo 2. Falta o que mexe em build e deploy.

**Limpeza** (deixa de ser necessário):
- `alunoHtmlPlugin` e o `aluno.html` em `vite.config.ts`;
- rewrites de `/v/:token` e do manifest por link em `vercel.json`;
- `navigateFallbackDenylist` de `/v/`;
- `LAST_PUBLIC_TOKEN_KEY` e o redirecionamento em `RequireAuth`.

Quem já instalou no Android pelo link antigo continua abrindo em `/v/:token`, que leva ao login.

## Segurança

| Risco | Proteção |
|---|---|
| Adivinhar o PIN | 5 erros seguidos bloqueiam o aluno por 15 min; throttle de 5/min por IP |
| Descobrir se um telefone está cadastrado | Mensagem única e comparação contra hash "dummy" (mesmo padrão do login do treinador). Telefone que não é de nenhum aluno também "bloqueia" após 5 erros (contador em memória), para o aviso de bloqueio não revelar quais números existem |
| Link encaminhado | No 1º acesso o telefone tem de bater com o cadastro; telefone errado conta como tentativa |
| Token trocado entre aluno e treinador | Cada estratégia só aceita o seu `tipo` |
| Aluno ver dados de outro | Rotas `/aluno/*` usam o `idAluno` do JWT; o protocolo tem de ser dele e não excluído |
| Escrita em protocolo antigo | Recusada no backend |
| PIN/telefone em logs | O log de acesso não registra body nem headers, só método, rota, status e duração |
| Hash do PIN vazar para o treinador | A API `/alunos` remove `pinHash`, tentativas e bloqueio da resposta e devolve só `acesso` (`PIN_CRIADO`, `AGUARDANDO_PRIMEIRO_ACESSO`, `TELEFONE_INVALIDO`) |

**Risco aceito:** quem tiver o link e souber o telefone, antes de o aluno criar o PIN,
consegue criar o PIN no lugar dele. O treinador resolve com Redefinir PIN.

## Mensagens

| Situação | Mensagem |
|---|---|
| Telefone ou PIN errado | "Telefone ou PIN incorretos." |
| Bloqueado | "Muitas tentativas. Tente de novo em 15 minutos ou peça ao seu treinador para redefinir o PIN." |
| Telefone não confere no 1º acesso | "Esse telefone não confere com o cadastro. Fale com seu treinador." |
| Sessão derrubada | "Seu acesso foi atualizado. Entre de novo." |
| Esqueci meu PIN | "Peça ao seu treinador para redefinir." |
| Link revogado | "Ficha de treino não encontrada." |

## Testes

**Automáticos (backend):** normalização do telefone; primeiro acesso (telefone errado,
PIN já existente); login (PIN errado, bloqueio e desbloqueio, mesmo telefone em dois
treinadores); token de tipo errado em cada lado; aluno abrindo protocolo de outro;
gravação em protocolo antigo recusada; redefinir PIN e revogar acesso derrubando a sessão.

**Manuais (aparelho):**
- iPhone: abrir o link → criar PIN → instalar → abrir o app instalado → entrar → fechar e reabrir.
- Android: o mesmo roteiro.
- Treinador e aluno logados no mesmo aparelho.

## Ordem de construção

1. Backend: migration, login do aluno, rotas `/aluno/*`, testes.
2. Área do aluno e telas de entrada.
3. Telas do treinador: telefone obrigatório, estado do PIN, Redefinir PIN.
4. PWA: manifest único e limpeza.
5. Teste no iPhone e no Android.

## Fora deste desenho

- Código por SMS/WhatsApp.
- Conta do aluno independente (Plano Aluno do PRD): este login é do aluno **de um treinador**.
- Comportamento com assinatura vencida (PRD §3.3).
