import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

const CONFIG_COMPLETA: Record<string, string> = {
  RESEND_API_KEY: 're_teste',
  EMAIL_FROM: 'TreinosApp <nao-responda@ex.com>',
  FRONTEND_URL: 'https://app.ex.com/',
};

function criar(config: Record<string, string>) {
  return new EmailService({
    get: (chave: string) => config[chave],
  } as unknown as ConfigService);
}

interface CorpoResend {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
}

describe('EmailService', () => {
  let fetchMock: jest.Mock;

  // Corpo JSON da única chamada feita ao Resend
  const corpoEnviado = (): CorpoResend => {
    const [, opcoes] = fetchMock.mock.calls[0] as [string, { body: string }];
    return JSON.parse(opcoes.body) as CorpoResend;
  };

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
  });

  it('fica desligado e não envia nada sem as três variáveis', async () => {
    for (const faltando of Object.keys(CONFIG_COMPLETA)) {
      const config = { ...CONFIG_COMPLETA };
      delete config[faltando];
      const service = criar(config);

      expect(service.disponivel).toBe(false);
      expect(await service.enviarContaAprovada('a@ex.com', { nome: 'A' })).toBe(
        false,
      );
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envia a redefinição com o link do frontend e o token', async () => {
    const service = criar(CONFIG_COMPLETA);

    const enviado = await service.enviarRedefinicaoSenha('treinador@ex.com', {
      nome: 'João Vitor',
      token: 'abc-123_XYZ',
      validadeMinutos: 60,
    });

    expect(enviado).toBe(true);
    const corpo = corpoEnviado();
    expect(corpo.from).toBe('TreinosApp <nao-responda@ex.com>');
    expect(corpo.to).toEqual(['treinador@ex.com']);
    // Sem barra dupla, mesmo com FRONTEND_URL terminando em "/"
    const link = 'https://app.ex.com/redefinir-senha?token=abc-123_XYZ';
    expect(corpo.html).toContain(link);
    expect(corpo.text).toContain(link);
    expect(corpo.html).toContain('Olá, João.');
  });

  it('escapa o nome do destinatário no HTML', async () => {
    const service = criar(CONFIG_COMPLETA);

    await service.enviarContaAprovada('a@ex.com', {
      nome: '<script>alert(1)</script>',
    });

    expect(corpoEnviado().html).not.toContain('<script>');
  });

  it('monta os e-mails de assinatura com a data em pt-BR', async () => {
    const service = criar(CONFIG_COMPLETA);

    await service.enviarAssinaturaVencendo('a@ex.com', {
      nome: 'Ana',
      venceEm: new Date('2026-11-05T15:00:00Z'),
    });

    const corpo = corpoEnviado();
    expect(corpo.subject).toContain('05/11/2026');
    expect(corpo.html).toContain('05/11/2026');

    fetchMock.mockClear();
    await service.enviarAssinaturaConfirmada('a@ex.com', { nome: 'Ana' });
    expect(corpoEnviado().subject).toContain('Assinatura confirmada');
  });

  it('devolve false, sem lançar, quando o provedor recusa ou a rede falha', async () => {
    const service = criar(CONFIG_COMPLETA);
    // Silencia o log de erro esperado
    jest
      .spyOn(
        (service as unknown as { logger: { error: () => void } }).logger,
        'error',
      )
      .mockImplementation(() => undefined);

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: () => Promise.resolve('domínio não verificado'),
    });
    expect(await service.enviarContaAprovada('a@ex.com', { nome: 'A' })).toBe(
      false,
    );

    fetchMock.mockRejectedValueOnce(new Error('timeout'));
    expect(await service.enviarContaAprovada('a@ex.com', { nome: 'A' })).toBe(
      false,
    );
  });
});
