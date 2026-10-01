import {
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AlunoAuthService,
  BLOQUEIO_PIN_MS,
  MAX_TENTATIVAS_PIN,
  MSG_BLOQUEADO,
  MSG_CREDENCIAIS,
  MSG_TELEFONE_NAO_CONFERE,
} from './aluno-auth.service';

const TELEFONE = '(54) 99999-0000';
const TELEFONE_LOGIN = '5554999990000';
const PIN = '4821';
const PIN_HASH = bcrypt.hashSync(PIN, 4);

const TREINADOR_X = { idProfissional: 10, nome: 'Treinador X', logoUrl: null };
const TREINADOR_Y = { idProfissional: 20, nome: 'Treinador Y', logoUrl: null };

function aluno(extra: Record<string, unknown> = {}) {
  return {
    idAluno: 1,
    nome: 'João Vitor Silva',
    telefoneLogin: TELEFONE_LOGIN,
    pinHash: null as string | null,
    versaoToken: 0,
    pinBloqueadoAte: null as Date | null,
    profissional: TREINADOR_X,
    ...extra,
  };
}

describe('AlunoAuthService', () => {
  let service: AlunoAuthService;
  let jwt: JwtService;
  let prisma: {
    aluno: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    protocoloTreino: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      aluno: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        // Padrão: a tentativa registrada ainda não chegou ao limite
        update: jest.fn().mockResolvedValue({ pinTentativas: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      protocoloTreino: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    jwt = new JwtService({ secret: 'segredo-de-teste' });
    service = new AlunoAuthService(prisma as unknown as PrismaService, jwt);
  });

  const linkDoAluno = (dados: ReturnType<typeof aluno>) =>
    prisma.protocoloTreino.findUnique.mockResolvedValue({
      idProtocolo: 900,
      aluno: dados,
    });

  describe('getAcesso — o que o link mostra', () => {
    it('pede para criar o PIN no primeiro acesso, sem devolver dados do treino', async () => {
      linkDoAluno(aluno());

      const acesso = await service.getAcesso('link-a');

      expect(acesso).toEqual({
        estado: 'CRIAR_PIN',
        idAluno: 1,
        primeiroNome: 'João',
        idProtocolo: 900,
        profissional: TREINADOR_X,
      });
    });

    it('pede login quando o PIN já existe', async () => {
      linkDoAluno(aluno({ pinHash: PIN_HASH }));

      expect((await service.getAcesso('link-a')).estado).toBe('LOGIN');
    });

    it('manda falar com o treinador quando o telefone do cadastro não serve para login', async () => {
      linkDoAluno(aluno({ telefoneLogin: null }));

      expect((await service.getAcesso('link-a')).estado).toBe(
        'ATUALIZAR_CADASTRO',
      );
    });

    it('aceita o link antigo (tokenAcesso do aluno)', async () => {
      prisma.aluno.findUnique.mockResolvedValue(aluno());

      const acesso = await service.getAcesso('token-antigo');

      expect(acesso.idProtocolo).toBeNull();
      expect(acesso.estado).toBe('CRIAR_PIN');
    });

    it('rejeita link revogado ou inexistente', async () => {
      await expect(service.getAcesso('nao-existe')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('primeiroAcesso', () => {
    it('cria o PIN e devolve a sessão quando o telefone confere', async () => {
      linkDoAluno(aluno());

      const conta = await service.primeiroAcesso({
        token: 'link-a',
        telefone: TELEFONE,
        pin: PIN,
      });

      const { where, data } = prisma.aluno.updateMany.mock.calls[0][0];
      expect(where).toEqual({ idAluno: 1, pinHash: null });
      // O PIN nunca é gravado em texto puro
      expect(data.pinHash).not.toBe(PIN);
      expect(await bcrypt.compare(PIN, data.pinHash)).toBe(true);

      expect(jwt.verify(conta.accessToken)).toMatchObject({
        sub: 1,
        tipo: 'aluno',
        ver: 0,
      });
      expect(conta.idProtocolo).toBe(900);
      expect(conta.aluno).toEqual({ idAluno: 1, nome: 'João Vitor Silva' });
    });

    it('rejeita telefone que não é o do cadastro e conta como tentativa', async () => {
      linkDoAluno(aluno());

      await expect(
        service.primeiroAcesso({
          token: 'link-a',
          telefone: '(54) 98888-1111',
          pin: PIN,
        }),
      ).rejects.toThrow(MSG_TELEFONE_NAO_CONFERE);

      expect(prisma.aluno.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idAluno: 1 },
          data: { pinTentativas: { increment: 1 } },
        }),
      );
      expect(prisma.aluno.updateMany).not.toHaveBeenCalled();
    });

    it('não deixa trocar um PIN que já existe', async () => {
      linkDoAluno(aluno({ pinHash: PIN_HASH }));

      await expect(
        service.primeiroAcesso({
          token: 'link-a',
          telefone: TELEFONE,
          pin: '0000',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.aluno.updateMany).not.toHaveBeenCalled();
    });

    it('não cria dois PINs em requisições simultâneas', async () => {
      linkDoAluno(aluno());
      prisma.aluno.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.primeiroAcesso({
          token: 'link-a',
          telefone: TELEFONE,
          pin: PIN,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('recusa enquanto o aluno está bloqueado por tentativas', async () => {
      linkDoAluno(aluno({ pinBloqueadoAte: new Date(Date.now() + 60_000) }));

      await expect(
        service.primeiroAcesso({
          token: 'link-a',
          telefone: TELEFONE,
          pin: PIN,
        }),
      ).rejects.toThrow(MSG_BLOQUEADO);
      expect(prisma.aluno.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('entra com telefone e PIN corretos', async () => {
      prisma.aluno.findMany.mockResolvedValue([aluno({ pinHash: PIN_HASH })]);

      const { contas } = await service.login({ telefone: TELEFONE, pin: PIN });

      expect(prisma.aluno.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { telefoneLogin: TELEFONE_LOGIN, pinHash: { not: null } },
        }),
      );
      expect(contas).toHaveLength(1);
      expect(jwt.verify(contas[0].accessToken)).toMatchObject({
        sub: 1,
        tipo: 'aluno',
      });
      expect(prisma.aluno.update).not.toHaveBeenCalled();
    });

    it('PIN errado devolve a mensagem genérica e conta a tentativa', async () => {
      prisma.aluno.findMany.mockResolvedValue([aluno({ pinHash: PIN_HASH })]);

      await expect(
        service.login({ telefone: TELEFONE, pin: '0000' }),
      ).rejects.toThrow(MSG_CREDENCIAIS);

      expect(prisma.aluno.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idAluno: 1 },
          data: { pinTentativas: { increment: 1 } },
        }),
      );
    });

    it('bloqueia o aluno por 15 minutos ao chegar no limite de erros', async () => {
      prisma.aluno.findMany.mockResolvedValue([aluno({ pinHash: PIN_HASH })]);
      prisma.aluno.update.mockResolvedValueOnce({
        pinTentativas: MAX_TENTATIVAS_PIN,
      });
      const antes = Date.now();

      await expect(
        service.login({ telefone: TELEFONE, pin: '0000' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      const bloqueio = prisma.aluno.update.mock.calls[1][0];
      expect(bloqueio.where).toEqual({ idAluno: 1 });
      expect(bloqueio.data.pinTentativas).toBe(0);
      expect(bloqueio.data.pinBloqueadoAte.getTime()).toBeGreaterThanOrEqual(
        antes + BLOQUEIO_PIN_MS,
      );
    });

    it('bloqueado recusa até o PIN correto, sem contar nova tentativa', async () => {
      prisma.aluno.findMany.mockResolvedValue([
        aluno({
          pinHash: PIN_HASH,
          pinBloqueadoAte: new Date(Date.now() + 60_000),
        }),
      ]);

      const erro = await service
        .login({ telefone: TELEFONE, pin: PIN })
        .catch((e: HttpException) => e);

      expect(erro).toBeInstanceOf(HttpException);
      expect((erro as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
      expect((erro as HttpException).message).toBe(MSG_BLOQUEADO);
      expect(prisma.aluno.update).not.toHaveBeenCalled();
    });

    it('volta a aceitar o PIN quando o bloqueio vence', async () => {
      prisma.aluno.findMany.mockResolvedValue([
        aluno({
          pinHash: PIN_HASH,
          pinBloqueadoAte: new Date(Date.now() - 1000),
        }),
      ]);

      const { contas } = await service.login({ telefone: TELEFONE, pin: PIN });

      expect(contas).toHaveLength(1);
    });

    it('mesmo telefone em dois treinadores devolve as duas contas para o aluno escolher', async () => {
      prisma.aluno.findMany.mockResolvedValue([
        aluno({ pinHash: PIN_HASH }),
        aluno({ idAluno: 2, pinHash: PIN_HASH, profissional: TREINADOR_Y }),
      ]);

      const { contas } = await service.login({ telefone: TELEFONE, pin: PIN });

      expect(contas.map((c) => c.profissional.nome)).toEqual([
        'Treinador X',
        'Treinador Y',
      ]);
      expect(jwt.verify(contas[1].accessToken)).toMatchObject({ sub: 2 });
    });

    it('PINs diferentes em dois treinadores: entra em um sem contar erro no outro', async () => {
      prisma.aluno.findMany.mockResolvedValue([
        aluno({ pinHash: PIN_HASH }),
        aluno({
          idAluno: 2,
          pinHash: bcrypt.hashSync('9999', 4),
          profissional: TREINADOR_Y,
        }),
      ]);

      const { contas } = await service.login({ telefone: TELEFONE, pin: PIN });

      expect(contas).toHaveLength(1);
      expect(contas[0].aluno.idAluno).toBe(1);
      expect(prisma.aluno.update).not.toHaveBeenCalled();
    });

    // "Muitas tentativas" não pode revelar quais telefones estão cadastrados
    it('telefone que não é de nenhum aluno se comporta igual a um cadastrado', async () => {
      const tentativa = () =>
        service
          .login({ telefone: '(11) 97777-0000', pin: '1234' })
          .catch((e: HttpException) => e.message);

      for (let i = 0; i < MAX_TENTATIVAS_PIN; i++) {
        expect(await tentativa()).toBe(MSG_CREDENCIAIS);
      }
      expect(await tentativa()).toBe(MSG_BLOQUEADO);
      expect(prisma.aluno.update).not.toHaveBeenCalled();
    });
  });

  describe('renovarSeNecessario', () => {
    const logado = (diasRestantes: number) => ({
      idAluno: 1,
      idProfissional: 10,
      nome: 'João',
      versaoToken: 3,
      tokenExp: Math.floor(Date.now() / 1000) + diasRestantes * 86_400,
    });

    it('não troca um token recente', () => {
      expect(service.renovarSeNecessario(logado(85))).toBeUndefined();
    });

    it('emite um token novo quando o atual está perto de vencer', () => {
      const token = service.renovarSeNecessario(logado(20));

      expect(jwt.verify(token as string)).toMatchObject({
        sub: 1,
        tipo: 'aluno',
        ver: 3,
      });
    });
  });
});
