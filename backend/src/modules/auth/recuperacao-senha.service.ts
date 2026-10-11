import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Profissional } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const VALIDADE_MINUTOS = 60;

// Resposta única do pedido: não revela se o e-mail tem conta.
export const MENSAGEM_PEDIDO =
  'Se houver uma conta com este e-mail, enviamos um link para redefinir a senha.';
const MENSAGEM_LINK_INVALIDO = 'Link inválido ou expirado. Peça um novo.';

// O banco guarda só o hash: quem ler a tabela não consegue montar o link.
function hashDoToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class RecuperacaoSenhaService {
  private readonly logger = new Logger(RecuperacaoSenhaService.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  get disponivel(): boolean {
    return this.email.disponivel;
  }

  async solicitar(emailInformado: string) {
    if (!this.disponivel) {
      throw new ServiceUnavailableException(
        'A recuperação de senha por e-mail não está disponível. Solicite a redefinição ao administrador.',
      );
    }

    const profissional = await this.prisma.profissional.findFirst({
      where: {
        email: {
          equals: emailInformado.trim().toLowerCase(),
          mode: 'insensitive',
        },
      },
    });

    // Sem await: gravar o token e chamar o provedor de e-mail leva bem mais
    // tempo do que não fazer nada, e a diferença revelaria se a conta existe.
    if (profissional) {
      void this.gerarEEnviar(profissional).catch((err) =>
        this.logger.error('Falha ao gerar o link de redefinição', err),
      );
    }

    return { message: MENSAGEM_PEDIDO };
  }

  private async gerarEEnviar(profissional: Profissional) {
    const token = randomBytes(32).toString('base64url');
    const { idProfissional } = profissional;

    // Um pedido novo invalida os links anteriores da conta
    await this.prisma.$transaction([
      this.prisma.tokenRedefinicaoSenha.deleteMany({
        where: { idProfissional },
      }),
      this.prisma.tokenRedefinicaoSenha.create({
        data: {
          idProfissional,
          tokenHash: hashDoToken(token),
          expiraEm: new Date(Date.now() + VALIDADE_MINUTOS * 60_000),
        },
      }),
    ]);

    await this.email.enviarRedefinicaoSenha(profissional.email, {
      nome: profissional.nome,
      token,
      validadeMinutos: VALIDADE_MINUTOS,
    });
  }

  async redefinir(token: string, novaSenha: string) {
    const tokenHash = hashDoToken(token);
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    await this.prisma.$transaction(async (tx) => {
      const registro = await tx.tokenRedefinicaoSenha.findUnique({
        where: { tokenHash },
      });
      if (!registro || registro.expiraEm <= new Date()) {
        throw new BadRequestException(MENSAGEM_LINK_INVALIDO);
      }

      // Apaga todos os links da conta. Se nenhum saiu, outra requisição com o
      // mesmo link chegou antes: uso único.
      const { count } = await tx.tokenRedefinicaoSenha.deleteMany({
        where: { idProfissional: registro.idProfissional },
      });
      if (count === 0) {
        throw new BadRequestException(MENSAGEM_LINK_INVALIDO);
      }

      // Derruba todas as sessões abertas da conta. Não mexe em `ativo`:
      // redefinir a senha não aprova uma conta pendente.
      await tx.profissional.update({
        where: { idProfissional: registro.idProfissional },
        data: { senhaHash, versaoToken: { increment: 1 } },
      });
    });

    return { message: 'Senha redefinida com sucesso' };
  }
}
