import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TreinosService } from './treinos.service';
import { PrismaService } from '../../prisma/prisma.service';

// Treinador A é quem está autenticado em todos os testes. Os recursos "de B"
// nos testes abaixo simulam IDs que existem no banco mas pertencem a outro
// tenant — por isso os mocks de ownership retornam null para eles.
const ID_PROFISSIONAL_A = 1;

const TREINO_DE_A = { idTreino: 200, idProtocolo: 10 };
const EXERCICIO_DE_A = { idExercicio: 300, idProfissional: ID_PROFISSIONAL_A };

describe('TreinosService — isolamento entre treinadores (multi-tenancy)', () => {
  let service: TreinosService;
  let prisma: {
    protocoloTreino: {
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    treino: { findFirst: jest.Mock; delete: jest.Mock; create: jest.Mock };
    exercicio: { findFirst: jest.Mock };
    tecnicaTreino: { findFirst: jest.Mock };
    treinoExercicio: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      protocoloTreino: {
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      treino: { findFirst: jest.fn(), delete: jest.fn(), create: jest.fn() },
      exercicio: { findFirst: jest.fn() },
      tecnicaTreino: { findFirst: jest.fn() },
      treinoExercicio: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TreinosService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TreinosService>(TreinosService);
  });

  it('treinador A não encontra protocolo do treinador B', async () => {
    // A consulta já filtra por idProfissional: um protocolo de B nunca "bate".
    prisma.protocoloTreino.findFirst.mockResolvedValue(null);

    await expect(
      service.findOneProtocolo(/* idProtocolo de B */ 999, ID_PROFISSIONAL_A),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('treinador A não deleta ficha de treino do treinador B', async () => {
    prisma.treino.findFirst.mockResolvedValue(null);

    await expect(
      service.deleteTreino(/* idTreino de B */ 888, ID_PROFISSIONAL_A),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.treino.delete).not.toHaveBeenCalled();
  });

  it('treinador A não deleta protocolo do treinador B', async () => {
    prisma.protocoloTreino.findFirst.mockResolvedValue(null);

    await expect(
      service.deleteProtocolo(777, ID_PROFISSIONAL_A),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Regressão do achado HIGH da auditoria: addExercicioToTreino buscava o
  // exercício só por idExercicio (findUnique), sem checar o dono — um
  // treinador conseguia anexar (e ver o nome de) um exercício de outro
  // treinador ao próprio treino. Corrigido para findFirst({idExercicio,
  // idProfissional}).
  it('treinador A não consegue anexar exercício pertencente ao treinador B', async () => {
    prisma.treino.findFirst.mockResolvedValue(TREINO_DE_A);
    // exercicio 999 existe, mas é do treinador B — filtrado por idProfissional, não aparece
    prisma.exercicio.findFirst.mockResolvedValue(null);

    await expect(
      service.addExercicioToTreino(TREINO_DE_A.idTreino, ID_PROFISSIONAL_A, {
        idExercicio: 999,
        series: 3,
        repeticoes: '10',
        ordem: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.exercicio.findFirst).toHaveBeenCalledWith({
      where: { idExercicio: 999, idProfissional: ID_PROFISSIONAL_A },
    });
    expect(prisma.treinoExercicio.create).not.toHaveBeenCalled();
  });

  it('treinador A não consegue anexar técnica pertencente ao treinador B', async () => {
    prisma.treino.findFirst.mockResolvedValue(TREINO_DE_A);
    prisma.exercicio.findFirst.mockResolvedValue(EXERCICIO_DE_A);
    prisma.tecnicaTreino.findFirst.mockResolvedValue(null); // técnica é do treinador B

    await expect(
      service.addExercicioToTreino(TREINO_DE_A.idTreino, ID_PROFISSIONAL_A, {
        idExercicio: EXERCICIO_DE_A.idExercicio,
        idTecnica: 999,
        series: 3,
        repeticoes: '10',
        ordem: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.treinoExercicio.create).not.toHaveBeenCalled();
  });

  it('treinador A consegue anexar seu próprio exercício normalmente', async () => {
    prisma.treino.findFirst.mockResolvedValue(TREINO_DE_A);
    prisma.exercicio.findFirst.mockResolvedValue(EXERCICIO_DE_A);
    prisma.treinoExercicio.create.mockResolvedValue({ idTreinoExercicio: 1 });

    await service.addExercicioToTreino(
      TREINO_DE_A.idTreino,
      ID_PROFISSIONAL_A,
      {
        idExercicio: EXERCICIO_DE_A.idExercicio,
        series: 3,
        repeticoes: '10',
        ordem: 1,
      },
    );

    expect(prisma.treinoExercicio.create).toHaveBeenCalled();
  });

  // Mesma classe de vulnerabilidade dentro de updateExercicioInTreino: trocar
  // o idExercicio de uma prescrição já existente para um exercício de outro
  // treinador.
  it('treinador A não consegue reapontar uma prescrição para exercício do treinador B', async () => {
    prisma.treinoExercicio.findFirst.mockResolvedValue({
      idTreinoExercicio: 50,
    });
    prisma.exercicio.findFirst.mockResolvedValue(null); // exercício pedido é do treinador B

    await expect(
      service.updateExercicioInTreino(50, ID_PROFISSIONAL_A, {
        idExercicio: 999,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.treinoExercicio.update).not.toHaveBeenCalled();
  });
});
