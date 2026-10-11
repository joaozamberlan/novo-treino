// E-mails transacionais do app. Todos saem do mesmo layout: faixa de marca
// preta com vermelho e corpo claro, como as telas de entrada.
//
// HTML de e-mail não aceita CSS externo nem variáveis: tudo vai inline, em
// tabelas, com as cores copiadas dos tokens de frontend/src/index.css.

const COR = {
  fundo: '#f4f3ef', // --bg-0 (claro)
  cartao: '#ffffff', // --bg-1 (claro)
  borda: '#dedbd2', // --bg-3 (claro)
  marca: '#0f0f0f', // --bg-0 (escuro)
  marcaTexto: '#f1f1f1', // --text-0 (escuro)
  destaque: '#BA281A', // --accent (claro)
  destaqueMarca: '#CF3427', // --accent (escuro)
  titulo: '#121316', // --text-0 (claro)
  texto: '#565963', // --text-1 (claro)
  textoSuave: '#62666f', // --text-2 (claro)
};

const FONTE =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface EmailPronto {
  assunto: string;
  html: string;
  texto: string;
}

interface Layout {
  nomeApp: string;
  // Resumo que o cliente de e-mail mostra ao lado do assunto
  previa: string;
  titulo: string;
  // Parágrafos em texto puro: o layout escapa e monta o HTML
  paragrafos: string[];
  botao?: { rotulo: string; url: string };
  // Aviso em letra menor, abaixo do botão
  observacao?: string;
}

export function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

function formatarData(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function montar(layout: Layout): Pick<EmailPronto, 'html' | 'texto'> {
  const { nomeApp, previa, titulo, paragrafos, botao, observacao } = layout;

  const paragrafosHtml = paragrafos
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${COR.texto};">${escaparHtml(p)}</p>`,
    )
    .join('');

  const botaoHtml = botao
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
        <tr>
          <td style="border-radius:8px;background:${COR.destaque};">
            <a href="${escaparHtml(botao.url)}" style="display:inline-block;padding:13px 26px;font-family:${FONTE};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${escaparHtml(botao.rotulo)}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${COR.textoSuave};">Se o botão não abrir, copie e cole este endereço no navegador:<br><a href="${escaparHtml(botao.url)}" style="color:${COR.destaque};word-break:break-all;">${escaparHtml(botao.url)}</a></p>`
    : '';

  const observacaoHtml = observacao
    ? `<p style="margin:0;padding-top:16px;border-top:1px solid ${COR.borda};font-size:13px;line-height:1.5;color:${COR.textoSuave};">${escaparHtml(observacao)}</p>`
    : '';

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escaparHtml(titulo)}</title>
</head>
<body style="margin:0;padding:0;background:${COR.fundo};font-family:${FONTE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escaparHtml(previa)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COR.fundo};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td style="background:${COR.marca};border-radius:12px 12px 0 0;border-bottom:3px solid ${COR.destaqueMarca};padding:22px 32px;">
            <span style="font-family:${FONTE};font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${COR.marcaTexto};">${escaparHtml(nomeApp)}</span>
          </td>
        </tr>
        <tr>
          <td style="background:${COR.cartao};border:1px solid ${COR.borda};border-top:0;border-radius:0 0 12px 12px;padding:32px;">
            <h1 style="margin:0 0 16px;font-family:${FONTE};font-size:22px;line-height:1.3;font-weight:800;color:${COR.titulo};">${escaparHtml(titulo)}</h1>
            ${paragrafosHtml}
            ${botaoHtml}
            ${observacaoHtml}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 16px 0;font-family:${FONTE};font-size:12px;line-height:1.5;color:${COR.textoSuave};">
            Mensagem automática do ${escaparHtml(nomeApp)}. Não é preciso responder.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const texto = [
    titulo,
    '',
    ...paragrafos,
    ...(botao ? ['', `${botao.rotulo}: ${botao.url}`] : []),
    ...(observacao ? ['', observacao] : []),
    '',
    `Mensagem automática do ${nomeApp}.`,
  ].join('\n');

  return { html, texto };
}

export function emailRedefinicaoSenha(dados: {
  nomeApp: string;
  nome: string;
  link: string;
  validadeMinutos: number;
}): EmailPronto {
  const { nomeApp, nome, link, validadeMinutos } = dados;
  return {
    assunto: `Redefinição de senha — ${nomeApp}`,
    ...montar({
      nomeApp,
      previa: `Crie uma senha nova. O link vale por ${validadeMinutos} minutos.`,
      titulo: 'Redefinir sua senha',
      paragrafos: [
        `Olá, ${primeiroNome(nome)}.`,
        `Recebemos um pedido para redefinir a senha da sua conta no ${nomeApp}. Use o botão abaixo para criar uma senha nova.`,
      ],
      botao: { rotulo: 'Criar nova senha', url: link },
      observacao: `O link vale por ${validadeMinutos} minutos e só pode ser usado uma vez. Se você não pediu a redefinição, ignore este e-mail: sua senha continua a mesma.`,
    }),
  };
}

export function emailContaAprovada(dados: {
  nomeApp: string;
  nome: string;
  linkLogin: string;
}): EmailPronto {
  const { nomeApp, nome, linkLogin } = dados;
  return {
    assunto: `Sua conta foi aprovada — ${nomeApp}`,
    ...montar({
      nomeApp,
      previa:
        'Seu acesso está liberado. Entre com o e-mail e a senha do cadastro.',
      titulo: 'Sua conta foi aprovada',
      paragrafos: [
        `Olá, ${primeiroNome(nome)}.`,
        `Seu cadastro no ${nomeApp} foi aprovado e o acesso está liberado. Entre com o e-mail e a senha que você definiu no cadastro.`,
      ],
      botao: { rotulo: 'Entrar na plataforma', url: linkLogin },
    }),
  };
}

export function emailAssinaturaConfirmada(dados: {
  nomeApp: string;
  nome: string;
  linkApp: string;
  // Até quando a assinatura vale; sem a data, o e-mail só confirma
  validaAte?: Date;
}): EmailPronto {
  const { nomeApp, nome, linkApp, validaAte } = dados;
  return {
    assunto: `Assinatura confirmada — ${nomeApp}`,
    ...montar({
      nomeApp,
      previa: 'Recebemos o pagamento e sua assinatura está ativa.',
      titulo: 'Assinatura confirmada',
      paragrafos: [
        `Olá, ${primeiroNome(nome)}.`,
        `Recebemos o pagamento e sua assinatura do ${nomeApp} está ativa.`,
        ...(validaAte ? [`Ela vale até ${formatarData(validaAte)}.`] : []),
      ],
      botao: { rotulo: 'Abrir o app', url: linkApp },
    }),
  };
}

export function emailAssinaturaVencendo(dados: {
  nomeApp: string;
  nome: string;
  linkApp: string;
  venceEm: Date;
}): EmailPronto {
  const { nomeApp, nome, linkApp, venceEm } = dados;
  const data = formatarData(venceEm);
  return {
    assunto: `Sua assinatura vence em ${data} — ${nomeApp}`,
    ...montar({
      nomeApp,
      previa: `Renove até ${data} para continuar usando o app sem interrupção.`,
      titulo: 'Sua assinatura está perto de vencer',
      paragrafos: [
        `Olá, ${primeiroNome(nome)}.`,
        `Sua assinatura do ${nomeApp} vence em ${data}. Renove até essa data para continuar prescrevendo sem interrupção.`,
      ],
      botao: { rotulo: 'Abrir o app', url: linkApp },
      observacao:
        'Seus alunos continuam acessando os treinos normalmente enquanto a assinatura estiver em dia.',
    }),
  };
}
