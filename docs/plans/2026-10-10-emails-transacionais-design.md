# E-mails transacionais e recuperação de senha

Data: 2026-10-10 · Branch: `feat/emails-transacionais`

## Objetivo

O treinador recupera a própria senha por e-mail, sem depender do administrador, e o app
passa a ter uma base única para todos os e-mails que envia.

## Decisões

| Tema | Decisão |
|---|---|
| Domínio | Ainda não existe: o nome do app não foi definido. O código fica pronto e **desligado** até lá |
| Como liga | `RESEND_API_KEY` + `EMAIL_FROM` + `FRONTEND_URL` no Railway. Faltando qualquer uma, nada é enviado |
| Provedor | Resend, pela API HTTP com `fetch` (sem biblioteca). O Railway pode bloquear SMTP de saída |
| Enquanto desligado | "Esqueceu a senha?" continua mandando pedir ao administrador |
| Reset pelo admin | Continua existindo, para quem perdeu o acesso ao e-mail |
| Conta pendente | Recebe o link e troca a senha, mas continua pendente |
| Nome do app nos e-mails | `APP_NOME` (padrão `TreinosApp`), para trocar sem mexer em código |

## E-mails

Todos usam o mesmo layout (`backend/src/modules/email/email.templates.ts`): faixa de marca
preta com filete vermelho e corpo claro, com as cores dos tokens de `frontend/src/index.css`.
Cada e-mail sai em HTML e em texto puro.

| E-mail | Gatilho | Estado |
|---|---|---|
| Redefinição de senha | `POST /auth/esqueci-senha` | Ligado ao fluxo |
| Conta aprovada | Admin passa a conta de inativa para ativa | Ligado ao fluxo |
| Assinatura confirmada | Pagamento confirmado | Só o template: a cobrança não existe |
| Assinatura vencendo | Dias antes do vencimento | Só o template: não há data de vencimento nem agendador |

Quando a cobrança existir, "conta aprovada" passa a ser disparado pelo pagamento, não pelo
admin, e os dois de assinatura ganham gatilho.

## Recuperação de senha

1. No `/login`, "Esqueceu a senha?" consulta `GET /auth/recuperacao-senha` → `{ disponivel }`.
2. Ligado: o treinador informa o e-mail e o app chama `POST /auth/esqueci-senha`. A resposta
   é sempre a mesma, exista a conta ou não, e o envio roda sem `await` para o tempo de
   resposta também não revelar nada.
3. O e-mail leva a `/redefinir-senha?token=...`. A página tira o token da barra de endereço
   assim que carrega.
4. `POST /auth/redefinir-senha` `{ token, novaSenha }` troca a senha (8 a 72 caracteres),
   sobe o `versaoToken` (derruba as sessões abertas) e apaga o link.

### Token

- 32 bytes aleatórios; o banco guarda só o SHA-256 (`TokenRedefinicaoSenha.tokenHash`).
- Vale 60 minutos e só pode ser usado uma vez.
- Um pedido novo apaga os links anteriores da conta.
- Os três endpoints `POST` de `/auth` compartilham o limite de 5 requisições/minuto por IP.

## Para ligar em produção

1. Definir o nome do app e comprar o domínio.
2. Criar a conta no Resend, verificar o domínio (registros DNS) e gerar a chave de API.
3. No Railway: `RESEND_API_KEY`, `EMAIL_FROM` (ex.: `Nome <nao-responda@dominio.com>`),
   `FRONTEND_URL` e, se o nome mudar, `APP_NOME`.
4. Testar pedindo a redefinição de uma conta própria.

## Testes

`recuperacao-senha.service.spec.ts` e `email.service.spec.ts`: resposta idêntica com e sem
conta, link vencido, link inexistente, uso simultâneo do mesmo link, pedido novo invalida o
anterior, redefinição sobe o `versaoToken` sem aprovar a conta, serviço desligado sem as
variáveis, falha do provedor não lança.
