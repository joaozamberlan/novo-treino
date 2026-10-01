# Memória do projeto — TreinosApp

Registro das decisões já tomadas e do porquê. Consulte antes de propor algo que pareça
"óbvio": muita coisa aqui já foi tentada e rejeitada. Adicione novas entradas no topo da
seção correspondente, com data.

## Preferências do dono do produto

- **Só o que foi pedido.** Propostas com tabela nova, campo `semanaAtual`, botões de
  avançar semana e lógica de "em que semana o aluno está" foram rejeitadas. A tabela de
  progressão semanal é uma cópia literal (semanas 1–5) no link público e no PDF, sem saber
  a semana atual. *(2026-09-24)*
- **Sem alerta de estagnação.** Ninguém progride para sempre; semanas na mesma carga são
  normais. Sinais válidos: reps acima/abaixo da faixa prescrita. *(2026-09-25)*
- **Não acoplar a nomes ou datas.** Fichas nem sempre são "Treino A" e não estão ligadas
  a dias da semana; o aluno não começa necessariamente na semana 1.

## Decisões de produto

- **Assinatura vencida do treinador não derruba o aluno de surpresa:** 7 dias de carência,
  depois o treinador fica só com leitura até 30 dias, e só então o link mostra
  "Ficha indisponível no momento, fale com seu treinador.". A mensagem nunca cita
  pagamento, para não constranger o treinador diante do cliente. Detalhes em PRD §3.3. *(2026-09-30)*
- **Modelo de negócio:** o treinador paga mensalidade ao app; o aluno dele paga o treinador
  por fora, sem o app intermediar. O Plano Aluno é para quem treina sozinho: monta o próprio
  treino, sem alunos e sem links de compartilhamento. *(2026-09-30)*
- **CREF opcional** no cadastro: acadêmicos de Educação Física ainda não têm. A coluna
  continua `NOT NULL`, gravada como `""`. *(2026-09-30)*
- **Navegação em pastas:** Alunos → Periodizações → Treino, sempre passando pela lista,
  sem atalho automático para a periodização ativa. *(2026-09-17)*
- **Link por periodização** (`tokenPublico`) em vez de por aluno; `tokenAcesso` fica só
  para compatibilidade com links antigos.
- **Progresso conta séries feitas mesmo sem "Encerrar treino"**, porque o aluno esquece
  de encerrar. Agrupa por exercício do catálogo para seguir entre periodizações.
- **Descanso pode ser faixa** ("1-3 min"): `descansoSegundos` + `descansoMaxSegundos`.
- **Login do aluno por telefone + PIN** (em vez de só o link). Motivo: no iPhone o app
  instalado sempre abre na raiz do site e não enxerga nada do Safari, então seis tentativas
  de fazer o ícone abrir o link do aluno falharam (manifest por link, `aluno.html` sem
  manifest, "último link visitado"). Com login, o aluno entra de dentro do app. O link
  passou a servir só para o primeiro acesso, quando ele cria o PIN. *(2026-09-30)*
- **PIN, e não código por SMS/WhatsApp:** sem custo por mensagem. Se o aluno esquece, o
  treinador redefine e reenvia o link. *(2026-09-30)*
- **Protocolos anteriores são somente leitura para o aluno:** ele consulta fichas e
  histórico, mas só registra cargas no protocolo atual. *(2026-09-30)*
- **"Inativo" não bloqueia o login do aluno**, como já não bloqueava o link. Para cortar o
  acesso, o treinador usa "Revogar acesso". *(2026-09-30)*

## Decisões técnicas

- **Logo no banco** (`LogoProfissional`, tabela separada): o disco do container do
  Railway é apagado a cada deploy. Tabela separada para os bytes não virem junto em
  login/JWT/perfil.
- **Exclusão lógica** em `ProtocoloTreino.excluido` e `TreinoExercicio.ativo`: apagar a
  linha levava em cascata as sessões e cargas do aluno.
- **`versaoToken`** no profissional: trocar/redefinir senha derruba JWTs antigos.
  Tokens sem `ver` valem como versão 0 para não derrubar sessões no deploy.
- **Hash dummy no login** para não revelar por tempo de resposta se o e-mail existe.
- **`trust proxy = 1`** no Railway para o throttler não pôr todos no mesmo IP.
- **Paginação com teto maior** para exercícios e alunos (antes cortava em 50).
- **`SessaoTreino.data` como string `YYYY-MM-DD`** para não sofrer com fuso horário.
- **Modais em portal no `body`** para ficarem acima da tab bar; `--keyboard-inset` para
  ficarem acima do teclado no iOS.
- **Listener vazio de `touchstart`** em `main.tsx` para o iOS aplicar `:active` no toque.

## Armadilhas conhecidas

- Mudar o domínio da API exige atualizar a CSP do `frontend/vercel.json`. As regras de
  cache do service worker leem a origem de `VITE_API_URL` no build.
- O `backend/.env` local aponta para o banco de **produção**. Não rodar `prisma migrate dev`
  nem subir o backend local sem trocar o `DATABASE_URL`.
- As migrations antigas não rodam do zero (o banco foi baselined). Para um banco local de
  teste, usar `prisma db push`.
- Cache em memória (`memoryCache`) vazava dados entre alunos: sempre usar chaves com o id
  do aluno/periodização e invalidar após mutações.
- Migrations `20260919_*` recuperaram exercícios que tinham sumido do catálogo; não
  reaplicar nem editar.
