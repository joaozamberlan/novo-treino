import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmailPronto,
  emailAssinaturaConfirmada,
  emailAssinaturaVencendo,
  emailContaAprovada,
  emailRedefinicaoSenha,
} from './email.templates';

const RESEND_URL = 'https://api.resend.com/emails';
const NOME_APP_PADRAO = 'No Game';

// Envio de e-mails transacionais pela API HTTP do Resend (o Railway bloqueia
// SMTP de saída em alguns planos).
//
// O envio só liga quando RESEND_API_KEY, EMAIL_FROM e FRONTEND_URL existem.
// Sem elas, `disponivel` é false e nenhum método envia nada. Nenhum método
// lança: falha de envio vira log e `false`, para nunca derrubar a ação que
// disparou o e-mail (aprovar uma conta, pedir a redefinição).
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {}

  private get apiKey(): string | undefined {
    return this.config.get<string>('RESEND_API_KEY')?.trim() || undefined;
  }

  // Ex.: "No Game <nao-responda@seudominio.com>"
  private get remetente(): string | undefined {
    return this.config.get<string>('EMAIL_FROM')?.trim() || undefined;
  }

  // Endereço do frontend, sem barra no fim: base dos links dos e-mails
  private get frontendUrl(): string | undefined {
    const url = this.config.get<string>('FRONTEND_URL')?.trim();
    return url ? url.replace(/\/+$/, '') : undefined;
  }

  private get nomeApp(): string {
    return this.config.get<string>('APP_NOME')?.trim() || NOME_APP_PADRAO;
  }

  get disponivel(): boolean {
    return Boolean(this.apiKey && this.remetente && this.frontendUrl);
  }

  private async enviar(para: string, email: EmailPronto): Promise<boolean> {
    if (!this.disponivel) return false;

    try {
      const resposta = await fetch(RESEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.remetente,
          to: [para],
          subject: email.assunto,
          html: email.html,
          text: email.texto,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!resposta.ok) {
        this.logger.error(
          `Resend recusou o e-mail "${email.assunto}": ${resposta.status} ${await resposta.text()}`,
        );
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar o e-mail "${email.assunto}"`, err);
      return false;
    }
  }

  enviarRedefinicaoSenha(
    para: string,
    dados: { nome: string; token: string; validadeMinutos: number },
  ): Promise<boolean> {
    return this.enviar(
      para,
      emailRedefinicaoSenha({
        nomeApp: this.nomeApp,
        nome: dados.nome,
        link: `${this.frontendUrl}/redefinir-senha?token=${encodeURIComponent(dados.token)}`,
        validadeMinutos: dados.validadeMinutos,
      }),
    );
  }

  enviarContaAprovada(para: string, dados: { nome: string }): Promise<boolean> {
    return this.enviar(
      para,
      emailContaAprovada({
        nomeApp: this.nomeApp,
        nome: dados.nome,
        linkLogin: `${this.frontendUrl}/login`,
      }),
    );
  }

  // Os dois abaixo ainda não têm quem os chame: dependem da cobrança de
  // assinatura, que não existe (PRD §3).
  enviarAssinaturaConfirmada(
    para: string,
    dados: { nome: string; validaAte?: Date },
  ): Promise<boolean> {
    return this.enviar(
      para,
      emailAssinaturaConfirmada({
        nomeApp: this.nomeApp,
        nome: dados.nome,
        linkApp: `${this.frontendUrl}/`,
        validaAte: dados.validaAte,
      }),
    );
  }

  enviarAssinaturaVencendo(
    para: string,
    dados: { nome: string; venceEm: Date },
  ): Promise<boolean> {
    return this.enviar(
      para,
      emailAssinaturaVencendo({
        nomeApp: this.nomeApp,
        nome: dados.nome,
        linkApp: `${this.frontendUrl}/`,
        venceEm: dados.venceEm,
      }),
    );
  }
}
