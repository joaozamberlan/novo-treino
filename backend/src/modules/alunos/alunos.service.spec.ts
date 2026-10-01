import { BadRequestException, ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AlunosService } from './alunos.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';

const ID_PROFISSIONAL = 10;

// Linha do aluno como sai do banco, com os campos internos do login
const ALUNO_DO_BANCO = {
  idAluno: 1,
  idProfissional: ID_PROFISSIONAL,
  nome: 'Aluno A',
  email: null,
  telefone: '(54) 99999-0000',
  dataCadastro: new Date('2026-09-01'),
  ativo: true,
  tokenAcesso: 'token-a',
  telefoneLogin: '5554999990000',
  pinHash: 'hash-do-pin',
  versaoToken: 3,
  pinTentativas: 2,
  pinBloqueadoAte: null,
};

describe('AlunosService — telefone e PIN do aluno', () => {
  let service: AlunosService;
  let prisma: {
    aluno: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    protocoloTreino: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      aluno: {
        create: jest.fn().mockResolvedValue(ALUNO_DO_BANCO),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue(ALUNO_DO_BANCO),
      },
      protocoloTreino: { updateMany: jest.fn() },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    service = new AlunosService(prisma as unknown as PrismaService);
  });

  it('nunca devolve o hash do PIN nem os contadores ao treinador', async () => {
    prisma.aluno.findMany.mockResolvedValue([ALUNO_DO_BANCO]);
    prisma.aluno.findFirst.mockResolvedValue(ALUNO_DO_BANCO);

    const [daLista] = await service.findAll(ID_PROFISSIONAL);
    const unico = await service.findOne(1, ID_PROFISSIONAL);

    for (const resposta of [daLista, unico]) {
      expect(resposta).not.toHaveProperty('pinHash');
      expect(resposta).not.toHaveProperty('pinTentativas');
      expect(resposta).not.toHaveProperty('pinBloqueadoAte');
      expect(resposta).not.toHaveProperty('versaoToken');
      expect(resposta.acesso).toBe('PIN_CRIADO');
    }
  });

  it.each([
    [{ pinHash: null }, 'AGUARDANDO_PRIMEIRO_ACESSO'],
    [{ telefoneLogin: null, pinHash: null }, 'TELEFONE_INVALIDO'],
  ])('informa a situação do acesso: %j → %s', async (extra, acesso) => {
    prisma.aluno.findFirst.mockResolvedValue({ ...ALUNO_DO_BANCO, ...extra });

    expect((await service.findOne(1, ID_PROFISSIONAL)).acesso).toBe(acesso);
  });

  describe('cadastro', () => {
    it('grava o telefone de login normalizado', async () => {
      prisma.aluno.findFirst.mockResolvedValue(null); // nenhum outro aluno com o telefone

      await service.create(
        { nome: 'Aluno A', telefone: '(54) 99999-0000' },
        ID_PROFISSIONAL,
      );

      expect(prisma.aluno.create.mock.calls[0][0].data).toMatchObject({
        telefone: '(54) 99999-0000',
        telefoneLogin: '5554999990000',
        idProfissional: ID_PROFISSIONAL,
      });
    });

    it('exige telefone no DTO', async () => {
      const erros = await validate(
        plainToInstance(CreateAlunoDto, { nome: 'Aluno A' }),
      );

      expect(erros.map((e) => e.property)).toContain('telefone');
    });

    it('rejeita telefone que não serve para login', async () => {
      await expect(
        service.create(
          { nome: 'Aluno A', telefone: '99999-0000' },
          ID_PROFISSIONAL,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.aluno.create).not.toHaveBeenCalled();
    });

    it('rejeita telefone repetido entre os alunos do mesmo treinador', async () => {
      prisma.aluno.findFirst.mockResolvedValue({ nome: 'Outro Aluno' });

      await expect(
        service.create(
          { nome: 'Aluno A', telefone: '54 99999-0000' },
          ID_PROFISSIONAL,
        ),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.aluno.findFirst).toHaveBeenCalledWith({
        where: {
          idProfissional: ID_PROFISSIONAL,
          telefoneLogin: '5554999990000',
        },
        select: { nome: true },
      });
    });
  });

  describe('edição', () => {
    it('não deixa apagar o telefone', async () => {
      prisma.aluno.findFirst.mockResolvedValue(ALUNO_DO_BANCO);

      await expect(
        service.update(
          1,
          { telefone: null as unknown as string },
          ID_PROFISSIONAL,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.aluno.update).not.toHaveBeenCalled();
    });

    it('mantém o telefone quando ele não vem no body', async () => {
      prisma.aluno.findFirst.mockResolvedValue(ALUNO_DO_BANCO);

      await service.update(1, { nome: 'Novo nome' }, ID_PROFISSIONAL);

      expect(prisma.aluno.update).toHaveBeenCalledWith({
        where: { idAluno: 1 },
        data: { nome: 'Novo nome', telefoneLogin: undefined },
      });
    });

    it('ao trocar o telefone, ignora o próprio aluno na checagem de repetido', async () => {
      prisma.aluno.findFirst
        .mockResolvedValueOnce(ALUNO_DO_BANCO) // findOne
        .mockResolvedValueOnce(null); // repetido

      await service.update(1, { telefone: '(54) 98888-1111' }, ID_PROFISSIONAL);

      expect(prisma.aluno.findFirst).toHaveBeenLastCalledWith({
        where: {
          idProfissional: ID_PROFISSIONAL,
          telefoneLogin: '5554988881111',
          idAluno: { not: 1 },
        },
        select: { nome: true },
      });
      expect(prisma.aluno.update.mock.calls[0][0].data).toMatchObject({
        telefoneLogin: '5554988881111',
      });
    });
  });

  it('redefinir o PIN apaga o PIN, o bloqueio e derruba as sessões abertas', async () => {
    prisma.aluno.findFirst.mockResolvedValue(ALUNO_DO_BANCO);

    await service.redefinirPin(1, ID_PROFISSIONAL);

    expect(prisma.aluno.update).toHaveBeenCalledWith({
      where: { idAluno: 1 },
      data: {
        pinHash: null,
        pinTentativas: 0,
        pinBloqueadoAte: null,
        versaoToken: { increment: 1 },
      },
    });
  });

  it('não redefine o PIN do aluno de outro treinador', async () => {
    prisma.aluno.findFirst.mockResolvedValue(null);

    await expect(service.redefinirPin(1, 99)).rejects.toThrow(
      'Aluno não encontrado',
    );
    expect(prisma.aluno.update).not.toHaveBeenCalled();
  });

  it('revogar o acesso também derruba as sessões abertas do aluno', async () => {
    prisma.aluno.findFirst.mockResolvedValue(ALUNO_DO_BANCO);

    await service.revokeToken(1, ID_PROFISSIONAL);

    expect(prisma.aluno.update.mock.calls[0][0].data).toEqual({
      tokenAcesso: null,
      versaoToken: { increment: 1 },
    });
  });
});
