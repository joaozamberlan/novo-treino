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

describe('TreinosService — duplicarProtocolo', () => {
  let service: TreinosService;
  let tx: {
    protocoloTreino: { updateMany: jest.Mock; create: jest.Mock };
  };
  let prisma: {
    protocoloTreino: { findFirst: jest.Mock };
    aluno: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };

  const ORIGEM = {
    idProtocolo: 10,
    nome: 'Hipertrofia 12 sem.',
    objetivo: 'Massa',
    treinos: [
      {
        nome: 'Treino A',
        observacao: null,
        ordem: 1,
        exercicios: [
          {
            idExercicio: 300,
            idTecnica: 5,
            series: 3,
            repeticoes: '8-12',
            carga: '20kg',
            descansoSegundos: 60,
            descansoMaxSegundos: 180,
            observacao: 'Buscar a falha',
            ordem: 1,
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    tx = {
      protocoloTreino: {
        updateMany: jest.fn(),
        create: jest.fn().mockResolvedValue({ idProtocolo: 99 }),
      },
    };
    prisma = {
      protocoloTreino: { findFirst: jest.fn() },
      aluno: { findFirst: jest.fn() },
      $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [TreinosService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<TreinosService>(TreinosService);
  });

  it('copia fichas e exercícios mantendo o nome, sem carga, datas ou sessões', async () => {
    prisma.protocoloTreino.findFirst.mockResolvedValue(ORIGEM);
    prisma.aluno.findFirst.mockResolvedValue({ idAluno: 2 });

    await service.duplicarProtocolo(10, 2, ID_PROFISSIONAL_A);

    expect(prisma.protocoloTreino.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idProtocolo: 10, idProfissional: ID_PROFISSIONAL_A },
      }),
    );
    expect(prisma.aluno.findFirst).toHaveBeenCalledWith({
      where: { idAluno: 2, idProfissional: ID_PROFISSIONAL_A },
    });
    expect(tx.protocoloTreino.updateMany).toHaveBeenCalledWith({
      where: { idAluno: 2, ativo: true },
      data: { ativo: false },
    });

    const { data } = tx.protocoloTreino.create.mock.calls[0][0];
    expect(data).toMatchObject({
      nome: 'Hipertrofia 12 sem.',
      idAluno: 2,
      idProfissional: ID_PROFISSIONAL_A,
      ativo: true,
    });
    expect(data.tokenPublico).toEqual(expect.any(String));
    expect(data).not.toHaveProperty('dataInicio');
    const ex = data.treinos.create[0].exercicios.create[0];
    expect(ex).toMatchObject({
      idExercicio: 300,
      descansoSegundos: 60,
      descansoMaxSegundos: 180,
      observacao: 'Buscar a falha',
    });
    expect(ex).not.toHaveProperty('carga');
  });

  it('não duplica protocolo de outro treinador', async () => {
    prisma.protocoloTreino.findFirst.mockResolvedValue(null);

    await expect(
      service.duplicarProtocolo(10, 2, ID_PROFISSIONAL_A),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('não copia para aluno de outro treinador', async () => {
    prisma.protocoloTreino.findFirst.mockResolvedValue(ORIGEM);
    prisma.aluno.findFirst.mockResolvedValue(null);

    await expect(
      service.duplicarProtocolo(10, 999, ID_PROFISSIONAL_A),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
