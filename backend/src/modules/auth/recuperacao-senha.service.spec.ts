import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  MENSAGEM_PEDIDO,
  RecuperacaoSenhaService,
} from './recuperacao-senha.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const PROFISSIONAL = {
  idProfissional: 7,
  nome: 'Treinador Teste',
  email: 'treinador@ex.com',
};

// O envio roda sem await dentro de solicitar(): espera a fila esvaziar
const esperarEnvio = () => new Promise((resolve) => setImmediate(resolve));

const sha256 = (valor: string) =>
  createHash('sha256').update(valor).digest('hex');

describe('RecuperacaoSenhaService', () => {
  let service: RecuperacaoSenhaService;
  let prisma: {
    profissional: { findFirst: jest.Mock; update: jest.Mock };
    tokenRedefinicaoSenha: {
      findUnique: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let email: { disponivel: boolean; enviarRedefinicaoSenha: jest.Mock };

  beforeEach(async () => {
    prisma = {
      profissional: { findFirst: jest.fn(), update: jest.fn() },
      tokenRedefinicaoSenha: {
        findUnique: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
      },
      $transaction: jest.fn((arg: unknown) =>
        typeof arg === 'function'
          ? (arg as (tx: unknown) => unknown)(prisma)
          : Promise.all(arg as unknown[]),
      ),
    };
    email = {
      disponivel: true,
      enviarRedefinicaoSenha: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecuperacaoSenhaService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: email },
      ],
    }).compile();

    service = module.get(RecuperacaoSenhaService);
  });

  describe('solicitar', () => {
    it('recusa quando o envio de e-mail não está configurado', async () => {
      email.disponivel = false;

      await expect(
        service.solicitar('treinador@ex.com'),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(prisma.profissional.findFirst).not.toHaveBeenCalled();
    });

    it('responde a mesma mensagem com ou sem conta, e só envia quando há conta', async () => {
      prisma.profissional.findFirst.mockResolvedValueOnce(null);
      const semConta = await service.solicitar('nao-existe@ex.com');
      await esperarEnvio();
      expect(email.enviarRedefinicaoSenha).not.toHaveBeenCalled();

      prisma.profissional.findFirst.mockResolvedValueOnce(PROFISSIONAL);
      const comConta = await service.solicitar('treinador@ex.com');
      await esperarEnvio();

      expect(semConta).toEqual({ message: MENSAGEM_PEDIDO });
      expect(comConta).toEqual(semConta);
      expect(email.enviarRedefinicaoSenha).toHaveBeenCalledTimes(1);
    });

    it('procura o e-mail sem diferenciar maiúsculas nem espaços', async () => {
      prisma.profissional.findFirst.mockResolvedValue(null);

      await service.solicitar('  Treinador@Ex.COM ');

      expect(prisma.profissional.findFirst).toHaveBeenCalledWith({
        where: { email: { equals: 'treinador@ex.com', mode: 'insensitive' } },
      });
    });

    it('invalida os links anteriores e grava só o hash do token enviado', async () => {
      prisma.profissional.findFirst.mockResolvedValue(PROFISSIONAL);

      await service.solicitar('treinador@ex.com');
      await esperarEnvio();

      expect(prisma.tokenRedefinicaoSenha.deleteMany).toHaveBeenCalledWith({
        where: { idProfissional: 7 },
      });

      const [para, dados] = email.enviarRedefinicaoSenha.mock.calls[0] as [
        string,
        { token: string },
      ];
      const gravado = (
        prisma.tokenRedefinicaoSenha.create.mock.calls[0] as [
          { data: { tokenHash: string; expiraEm: Date } },
        ]
      )[0].data;

      expect(para).toBe('treinador@ex.com');
      expect(gravado.tokenHash).toBe(sha256(dados.token));
      expect(gravado.tokenHash).not.toBe(dados.token);
      expect(gravado.expiraEm.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('redefinir', () => {
    const registroValido = () => ({
      idToken: 1,
      idProfissional: 7,
      tokenHash: sha256('token-do-link'),
      expiraEm: new Date(Date.now() + 60_000),
    });

    it('troca a senha, derruba as sessões e consome o link', async () => {
      prisma.tokenRedefinicaoSenha.findUnique.mockResolvedValue(
        registroValido(),
      );

      await service.redefinir('token-do-link', 'nova-senha-123');

      expect(prisma.tokenRedefinicaoSenha.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: sha256('token-do-link') },
      });
      expect(prisma.tokenRedefinicaoSenha.deleteMany).toHaveBeenCalledWith({
        where: { idProfissional: 7 },
      });

      const atualizacao = (
        prisma.profissional.update.mock.calls[0] as [
          {
            where: { idProfissional: number };
            data: { senhaHash: string; versaoToken: unknown; ativo?: boolean };
          },
        ]
      )[0];
      expect(atualizacao.where).toEqual({ idProfissional: 7 });
      expect(atualizacao.data.versaoToken).toEqual({ increment: 1 });
      expect(
        await bcrypt.compare('nova-senha-123', atualizacao.data.senhaHash),
      ).toBe(true);
      // Redefinir a senha não aprova uma conta pendente
      expect(atualizacao.data).not.toHaveProperty('ativo');
    });

    it('rejeita link inexistente', async () => {
      prisma.tokenRedefinicaoSenha.findUnique.mockResolvedValue(null);

      await expect(
        service.redefinir('token-errado', 'nova-senha-123'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.profissional.update).not.toHaveBeenCalled();
    });

    it('rejeita link vencido', async () => {
      prisma.tokenRedefinicaoSenha.findUnique.mockResolvedValue({
        ...registroValido(),
        expiraEm: new Date(Date.now() - 1_000),
      });

      await expect(
        service.redefinir('token-do-link', 'nova-senha-123'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.profissional.update).not.toHaveBeenCalled();
    });

    it('rejeita o segundo uso simultâneo do mesmo link', async () => {
      prisma.tokenRedefinicaoSenha.findUnique.mockResolvedValue(
        registroValido(),
      );
      // A outra requisição já apagou o link
      prisma.tokenRedefinicaoSenha.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.redefinir('token-do-link', 'nova-senha-123'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.profissional.update).not.toHaveBeenCalled();
    });
  });
});
