import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AreaAlunoService, hojeEmSaoPaulo } from './area-aluno.service';
import { PrismaService } from '../../prisma/prisma.service';

// Aluno A (idAluno 1) é o único "dono legítimo" nos cenários abaixo. Aluno B
// representa outra conta, usada para provar que a cadeia
// aluno (do JWT) → treino → sessão → exercício realmente isola cada uma.
const ID_ALUNO_A = 1;
const ID_ALUNO_B = 2;

const PROTOCOLO_ATUAL = { ativo: true };
const PROTOCOLO_ANTERIOR = { ativo: false };

const TREINO_DO_ALUNO_A = {
  idTreino: 100,
  idProtocolo: 900,
  protocolo: PROTOCOLO_ATUAL,
};

const SESSAO_DO_ALUNO_A = {
  idSessao: 500,
  idAluno: ID_ALUNO_A,
  idTreino: 100,
  data: '2026-09-15',
  concluida: false,
  finalizadoEm: null,
  treino: { protocolo: PROTOCOLO_ATUAL },
};

const SESSAO_DO_ALUNO_B = {
  idSessao: 600,
  idAluno: ID_ALUNO_B,
  idTreino: 150,
  data: '2026-09-15',
  concluida: false,
  finalizadoEm: null,
};

// Como getSessaoDoAluno consulta a sessão: sempre com o idAluno da sessão
// autenticada e ignorando protocolos excluídos.
const consultaSessao = (idSessao: number, idAluno: number) => ({
  where: { idSessao, idAluno, treino: { protocolo: { excluido: false } } },
  include: { treino: { select: { protocolo: { select: { ativo: true } } } } },
});

const TREINO_EXERCICIO_DA_SESSAO_A = { idTreinoExercicio: 700, idTreino: 100 };
// Pertence a um treino diferente do treino 100 — não deve ser aceito na sessão do Aluno A.
const TREINO_EXERCICIO_DE_OUTRO_TREINO = {
  idTreinoExercicio: 701,
  idTreino: 999,
};

describe('AreaAlunoService — cadeia de posse da área do aluno', () => {
  let service: AreaAlunoService;
  let prisma: {
    aluno: { findUnique: jest.Mock };
    protocoloTreino: { findFirst: jest.Mock; findMany: jest.Mock };
    treino: { findFirst: jest.Mock; findMany: jest.Mock };
    sessaoTreino: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    treinoExercicio: { findFirst: jest.Mock };
    exercicioConcluido: {
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
      upsert: jest.Mock;
    };
    sessaoExercicioSerie: {
      upsert: jest.Mock;
      count: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      aluno: { findUnique: jest.fn() },
      protocoloTreino: { findFirst: jest.fn(), findMany: jest.fn() },
      treino: { findFirst: jest.fn(), findMany: jest.fn() },
      sessaoTreino: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      treinoExercicio: { findFirst: jest.fn() },
      exercicioConcluido: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        upsert: jest.fn(),
      },
      sessaoExercicioSerie: {
        upsert: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        deleteMany: jest.fn(),
      },
      // Transação interativa: o callback recebe o próprio mock como cliente
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaAlunoService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AreaAlunoService>(AreaAlunoService);
  });

  describe('protocolos', () => {
    it('lista só os protocolos do próprio aluno, sem os excluídos', async () => {
      prisma.protocoloTreino.findMany.mockResolvedValue([]);

      await service.listarProtocolos(ID_ALUNO_A);

      expect(prisma.protocoloTreino.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idAluno: ID_ALUNO_A, excluido: false },
        }),
      );
    });

    it('devolve as fichas de um protocolo anterior como somente leitura', async () => {
      prisma.protocoloTreino.findFirst.mockResolvedValue({
        idProtocolo: 800,
        ativo: false,
        treinos: [],
      });

      const result = await service.getProtocolo(ID_ALUNO_A, 800);

      expect(result.isAtual).toBe(false);
      expect(prisma.protocoloTreino.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idProtocolo: 800, idAluno: ID_ALUNO_A, excluido: false },
        }),
      );
    });

    it('rejeita o protocolo de outro aluno', async () => {
      // A consulta já filtra pelo idAluno da sessão; o protocolo do Aluno B nunca "bate".
      prisma.protocoloTreino.findFirst.mockResolvedValue(null);

      await expect(
        service.getProtocolo(ID_ALUNO_A, 901),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.getProgresso(ID_ALUNO_A, 901),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.treino.findMany).not.toHaveBeenCalled();
    });

    it('não expõe o token do link nas fichas', async () => {
      prisma.protocoloTreino.findFirst.mockResolvedValue(null);

      await service.getProtocoloAtual(ID_ALUNO_A);

      expect(prisma.protocoloTreino.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ omit: { tokenPublico: true } }),
      );
    });
  });

  // 1. Aluno legítimo consegue iniciar uma sessão.
  it('permite que o aluno legítimo inicie/recupere uma sessão do próprio treino', async () => {
    let dadosCriacaoSessao: { idAluno: number; idTreino: number } | undefined;

    prisma.treino.findFirst.mockResolvedValue(TREINO_DO_ALUNO_A);
    prisma.sessaoTreino.findFirst
      .mockResolvedValueOnce(null) // não há sessão ativa aberta
      .mockResolvedValueOnce(null) // nenhum treino encerrado hoje
      .mockResolvedValueOnce(null) // sessão anterior concluída com séries
      .mockResolvedValueOnce(null); // sessão anterior (fallback) com séries
    prisma.sessaoTreino.create.mockImplementation(
      (args: { data: { idAluno: number; idTreino: number } }) => {
        dadosCriacaoSessao = args.data;
        return Promise.resolve({
          ...SESSAO_DO_ALUNO_A,
          concluidos: [],
          seriesRealizadas: [],
        });
      },
    );

    const result = await service.getOuCriarSessao(ID_ALUNO_A, 100);

    expect(result.idSessao).toBe(500);
    expect(prisma.treino.findFirst).toHaveBeenCalledWith({
      where: {
        idTreino: 100,
        protocolo: { idAluno: ID_ALUNO_A, excluido: false },
      },
      include: { protocolo: { select: { ativo: true } } },
    });
    expect(dadosCriacaoSessao?.idAluno).toBe(ID_ALUNO_A);
    expect(dadosCriacaoSessao?.idTreino).toBe(100);
  });

  it('reabrir a ficha no dia do treino encerrado mostra a sessão concluída sem criar outra', async () => {
    const encerradaHoje = {
      ...SESSAO_DO_ALUNO_A,
      concluida: true,
      finalizadoEm: new Date(),
      concluidos: [],
      seriesRealizadas: [
        {
          idTreinoExercicio: 700,
          numeroSerie: 1,
          cargaKg: 20,
          repeticoes: 10,
          concluido: true,
        },
      ],
    };
    prisma.treino.findFirst.mockResolvedValue(TREINO_DO_ALUNO_A);
    prisma.sessaoTreino.findFirst
      .mockResolvedValueOnce(null) // não há sessão aberta
      .mockResolvedValueOnce(encerradaHoje)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await service.getOuCriarSessao(ID_ALUNO_A, 100);

    expect(result.concluida).toBe(true);
    expect(result.seriesHoje[700]).toHaveLength(1);
    expect(prisma.sessaoTreino.create).not.toHaveBeenCalled();
  });

  it('a sessão recebe a data do primeiro registro de série, não a da abertura da ficha', async () => {
    prisma.sessaoTreino.findFirst.mockResolvedValue(SESSAO_DO_ALUNO_A);
    prisma.treinoExercicio.findFirst.mockResolvedValue(
      TREINO_EXERCICIO_DA_SESSAO_A,
    );
    prisma.sessaoExercicioSerie.upsert.mockResolvedValue({ concluido: true });
    prisma.sessaoExercicioSerie.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await service.salvarSeriesExercicio(ID_ALUNO_A, 500, 700, [
      { numeroSerie: 1, cargaKg: 20, repeticoes: 10, concluido: true },
    ]);
    expect(prisma.sessaoTreino.update).toHaveBeenCalledWith({
      where: { idSessao: 500 },
      data: { data: hojeEmSaoPaulo() },
    });

    // Registros seguintes não mexem mais na data
    prisma.sessaoTreino.update.mockClear();
    await service.salvarSeriesExercicio(ID_ALUNO_A, 500, 700, [
      { numeroSerie: 2, cargaKg: 20, repeticoes: 10, concluido: true },
    ]);
    expect(prisma.sessaoTreino.update).not.toHaveBeenCalled();
  });

  // 2. Aluno legítimo consegue marcar/desmarcar exercício.
  it('permite que o aluno legítimo marque um exercício como concluído', async () => {
    prisma.sessaoTreino.findFirst.mockResolvedValue(SESSAO_DO_ALUNO_A);
    prisma.treinoExercicio.findFirst.mockResolvedValue(
      TREINO_EXERCICIO_DA_SESSAO_A,
    );
    prisma.exercicioConcluido.findUnique.mockResolvedValue(null);
    prisma.exercicioConcluido.create.mockResolvedValue({ idConcluido: 1 });

    const result = await service.toggleExercicio(ID_ALUNO_A, 500, 700);

    expect(result).toEqual({ concluido: true, idTreinoExercicio: 700 });
    expect(prisma.exercicioConcluido.create).toHaveBeenCalledWith({
      data: { idSessao: 500, idTreinoExercicio: 700 },
    });
  });

  // 3. Aluno legítimo consegue salvar séries.
  it('permite que o aluno legítimo salve séries do próprio treino', async () => {
    prisma.sessaoTreino.findFirst.mockResolvedValue(SESSAO_DO_ALUNO_A);
    prisma.treinoExercicio.findFirst.mockResolvedValue(
      TREINO_EXERCICIO_DA_SESSAO_A,
    );
    prisma.sessaoExercicioSerie.upsert.mockResolvedValue({ concluido: false });
    prisma.exercicioConcluido.findUnique.mockResolvedValue(null);

    const result = await service.salvarSeriesExercicio(ID_ALUNO_A, 500, 700, [
      { numeroSerie: 1, cargaKg: 20, repeticoes: 10, concluido: false },
    ]);

    expect(result.success).toBe(true);
  });

  // 4. Aluno legítimo consegue encerrar sessão.
  it('permite que o aluno legítimo encerre a própria sessão', async () => {
    prisma.sessaoTreino.findFirst.mockResolvedValue(SESSAO_DO_ALUNO_A);
    prisma.sessaoTreino.update.mockResolvedValue({
      ...SESSAO_DO_ALUNO_A,
      concluida: true,
      finalizadoEm: new Date('2026-09-15T12:00:00Z'),
      concluidos: [],
      seriesRealizadas: [],
    });

    const result = await service.encerrarSessao(ID_ALUNO_A, 500);

    expect(result.success).toBe(true);
    expect(result.concluida).toBe(true);
    expect(prisma.sessaoTreino.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idSessao: 500 } }),
    );
  });

  // 5. Aluno A não consegue modificar sessão do aluno B.
  it('rejeita mutação quando a sessão pertence a outro aluno', async () => {
    // A consulta já filtra pelo idAluno da sessão autenticada (1); a sessão
    // do Aluno B (idAluno 2) nunca "bate".
    prisma.sessaoTreino.findFirst.mockResolvedValue(null);

    await expect(
      service.toggleExercicio(ID_ALUNO_A, SESSAO_DO_ALUNO_B.idSessao, 700),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.sessaoTreino.findFirst).toHaveBeenCalledWith(
      consultaSessao(SESSAO_DO_ALUNO_B.idSessao, ID_ALUNO_A),
    );
    expect(prisma.treinoExercicio.findFirst).not.toHaveBeenCalled();
    expect(prisma.exercicioConcluido.create).not.toHaveBeenCalled();
  });

  // 6. idSessao de outro aluno não pode ser usado por um aluno logado.
  it('rejeita salvarSeriesExercicio e encerrarSessao quando idSessao pertence a outro aluno', async () => {
    prisma.sessaoTreino.findFirst.mockResolvedValue(null); // idSessao 600 não pertence ao idAluno 1

    await expect(
      service.salvarSeriesExercicio(
        ID_ALUNO_A,
        SESSAO_DO_ALUNO_B.idSessao,
        700,
        [{ numeroSerie: 1 }],
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.encerrarSessao(ID_ALUNO_A, SESSAO_DO_ALUNO_B.idSessao),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.sessaoExercicioSerie.upsert).not.toHaveBeenCalled();
    expect(prisma.sessaoTreino.update).not.toHaveBeenCalled();
  });

  // 7. idTreinoExercicio de outro treino não pode ser utilizado dentro de uma sessão válida.
  it('rejeita mutação quando o exercício não pertence ao treino da sessão', async () => {
    prisma.sessaoTreino.findFirst.mockResolvedValue(SESSAO_DO_ALUNO_A); // idTreino 100
    prisma.treinoExercicio.findFirst.mockResolvedValue(null); // 701 não pertence ao treino 100

    await expect(
      service.toggleExercicio(
        ID_ALUNO_A,
        500,
        TREINO_EXERCICIO_DE_OUTRO_TREINO.idTreinoExercicio,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.treinoExercicio.findFirst).toHaveBeenCalledWith({
      where: {
        idTreinoExercicio: TREINO_EXERCICIO_DE_OUTRO_TREINO.idTreinoExercicio,
        idTreino: 100,
      },
    });
    expect(prisma.exercicioConcluido.create).not.toHaveBeenCalled();
  });

  // 8. IDs sequenciais não permitem acesso cruzado: nenhum idSessao "adivinhado" funciona,
  // só o idSessao real do aluno logado.
  it('não permite acesso cruzado testando uma faixa de idSessao sequenciais', async () => {
    prisma.sessaoTreino.findFirst.mockImplementation(
      ({ where }: { where: { idSessao: number; idAluno: number } }) => {
        // Simula o banco: só existe vínculo (idSessao, idAluno) para a sessão 500 do Aluno A.
        if (
          where.idSessao === SESSAO_DO_ALUNO_A.idSessao &&
          where.idAluno === ID_ALUNO_A
        ) {
          return Promise.resolve(SESSAO_DO_ALUNO_A);
        }
        return Promise.resolve(null);
      },
    );
    prisma.treinoExercicio.findFirst.mockResolvedValue(
      TREINO_EXERCICIO_DA_SESSAO_A,
    );
    prisma.exercicioConcluido.findUnique.mockResolvedValue(null);
    prisma.exercicioConcluido.create.mockResolvedValue({ idConcluido: 1 });

    const idsAdivinhados = [497, 498, 499, 501, 502, 503];
    for (const idSessaoTentativa of idsAdivinhados) {
      await expect(
        service.toggleExercicio(ID_ALUNO_A, idSessaoTentativa, 700),
      ).rejects.toBeInstanceOf(NotFoundException);
    }
    expect(prisma.exercicioConcluido.create).not.toHaveBeenCalled();

    // O único idSessao que realmente pertence ao aluno funciona normalmente.
    const result = await service.toggleExercicio(
      ID_ALUNO_A,
      SESSAO_DO_ALUNO_A.idSessao,
      700,
    );
    expect(result.concluido).toBe(true);
  });

  // Cobertura extra: getOuCriarSessao também valida que o idTreino pertence ao aluno logado.
  it('rejeita getOuCriarSessao quando o treino não pertence ao aluno', async () => {
    prisma.treino.findFirst.mockResolvedValue(null); // treino 999 não é do Aluno A

    await expect(
      service.getOuCriarSessao(ID_ALUNO_A, 999),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.sessaoTreino.create).not.toHaveBeenCalled();
  });

  // O aluno vê os protocolos anteriores, mas só registra cargas no atual.
  describe('protocolo anterior é somente leitura', () => {
    const TREINO_ANTIGO = {
      ...TREINO_DO_ALUNO_A,
      protocolo: PROTOCOLO_ANTERIOR,
    };
    const SESSAO_ANTIGA = {
      ...SESSAO_DO_ALUNO_A,
      treino: { protocolo: PROTOCOLO_ANTERIOR },
    };

    it('não abre nem cria sessão em ficha de protocolo anterior', async () => {
      prisma.treino.findFirst.mockResolvedValue(TREINO_ANTIGO);

      await expect(
        service.getOuCriarSessao(ID_ALUNO_A, 100),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.iniciarNovaSessao(ID_ALUNO_A, 100),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(prisma.sessaoTreino.create).not.toHaveBeenCalled();
      expect(prisma.sessaoTreino.updateMany).not.toHaveBeenCalled();
    });

    it('não grava séries, marcações nem encerramento em sessão de protocolo anterior', async () => {
      prisma.sessaoTreino.findFirst.mockResolvedValue(SESSAO_ANTIGA);

      await expect(
        service.salvarSeriesExercicio(ID_ALUNO_A, 500, 700, [
          { numeroSerie: 1, cargaKg: 20 },
        ]),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.toggleExercicio(ID_ALUNO_A, 500, 700),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.removerSerieExtra(ID_ALUNO_A, 500, 700, 9),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.encerrarSessao(ID_ALUNO_A, 500),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(prisma.sessaoExercicioSerie.upsert).not.toHaveBeenCalled();
      expect(prisma.sessaoExercicioSerie.deleteMany).not.toHaveBeenCalled();
      expect(prisma.exercicioConcluido.create).not.toHaveBeenCalled();
      expect(prisma.sessaoTreino.update).not.toHaveBeenCalled();
    });
  });
});

describe('hojeEmSaoPaulo', () => {
  afterEach(() => jest.useRealTimers());

  it('usa o dia de Brasília, não o de UTC', () => {
    jest.useFakeTimers();
    // 23h30 de 25/09 em Brasília = 02h30 de 26/09 em UTC
    jest.setSystemTime(new Date('2026-09-26T02:30:00Z'));
    expect(hojeEmSaoPaulo()).toBe('2026-09-25');
  });
});
