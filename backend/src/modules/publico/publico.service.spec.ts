import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PublicoService, hojeEmSaoPaulo } from './publico.service';
import { PrismaService } from '../../prisma/prisma.service';

// Aluno A é o único "dono legítimo" nos cenários abaixo — token-a, idAluno 1.
// Aluno B/C representam outras contas, usadas para provar que a cadeia
// tokenAcesso → aluno → treino → sessão → exercício realmente isola cada uma.
const ALUNO_A = {
  idAluno: 1,
  idProfissional: 10,
  nome: 'Aluno A',
  tokenAcesso: 'token-a',
};
const ALUNO_B = {
  idAluno: 2,
  idProfissional: 10,
  nome: 'Aluno B',
  tokenAcesso: 'token-b',
};

const TREINO_DO_ALUNO_A = { idTreino: 100, idProtocolo: 900 };

const SESSAO_DO_ALUNO_A = {
  idSessao: 500,
  idAluno: 1,
  idTreino: 100,
  data: '2026-09-15',
  concluida: false,
  finalizadoEm: null,
};

const SESSAO_DO_ALUNO_B = {
  idSessao: 600,
  idAluno: ALUNO_B.idAluno,
  idTreino: 150,
  data: '2026-09-15',
  concluida: false,
  finalizadoEm: null,
};

const TREINO_EXERCICIO_DA_SESSAO_A = { idTreinoExercicio: 700, idTreino: 100 };
// Pertence a um treino diferente do treino 100 — não deve ser aceito na sessão do Aluno A.
const TREINO_EXERCICIO_DE_OUTRO_TREINO = {
  idTreinoExercicio: 701,
  idTreino: 999,
};

describe('PublicoService — cadeia de posse do link público', () => {
  let service: PublicoService;
  let prisma: {
    aluno: { findUnique: jest.Mock };
    protocoloTreino: { findFirst: jest.Mock; findUnique: jest.Mock };
    treino: { findFirst: jest.Mock };
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
    sessaoExercicioSerie: { upsert: jest.Mock; count: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      aluno: { findUnique: jest.fn() },
      // Padrão: o token não é um tokenPublico de periodização, então a
      // resolução cai no tokenAcesso do aluno (links antigos).
      protocoloTreino: {
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      treino: { findFirst: jest.fn() },
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
      },
      // Transação interativa: o callback recebe o próprio mock como cliente
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicoService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PublicoService>(PublicoService);
  });

  // 1. Aluno legítimo consegue visualizar seu treino.
  it('permite que o aluno legítimo visualize o próprio treino pelo token', async () => {
    prisma.aluno.findUnique.mockResolvedValue({
      ...ALUNO_A,
      profissional: {
        nome: 'Treinador',
        cref: '123',
        profissao: 'PT',
        telefone: null,
        instagram: null,
        logoUrl: null,
      },
    });
    prisma.protocoloTreino.findFirst.mockResolvedValue({
      idProtocolo: 900,
      treinos: [],
    });

    const result = await service.findActiveByToken('token-a');

    expect(result.aluno.nome).toBe('Aluno A');
    expect(prisma.aluno.findUnique).toHaveBeenCalledWith({
      where: { tokenAcesso: 'token-a' },
      include: {
        profissional: {
          select: {
            nome: true,
            cref: true,
            profissao: true,
            telefone: true,
            instagram: true,
            logoUrl: true,
            rodapeTreino: true,
          },
        },
      },
    });
  });

  // 2. Aluno legítimo consegue iniciar uma sessão.
  it('permite que o aluno legítimo inicie/recupere uma sessão do próprio treino', async () => {
    let dadosCriacaoSessao: { idAluno: number; idTreino: number } | undefined;

    prisma.aluno.findUnique.mockResolvedValue(ALUNO_A);
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

    const result = await service.getOuCriarSessao('token-a', 100);

    expect(result.idSessao).toBe(500);
    expect(prisma.treino.findFirst).toHaveBeenCalledWith({
      where: { idTreino: 100, protocolo: { idAluno: 1 } },
    });
    expect(dadosCriacaoSessao?.idAluno).toBe(1);
    expect(dadosCriacaoSessao?.idTreino).toBe(100);
  });

  it('reabrir o link no dia do treino encerrado mostra a sessão concluída sem criar outra', async () => {
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
    prisma.aluno.findUnique.mockResolvedValue(ALUNO_A);
    prisma.treino.findFirst.mockResolvedValue(TREINO_DO_ALUNO_A);
    prisma.sessaoTreino.findFirst
      .mockResolvedValueOnce(null) // não há sessão aberta
      .mockResolvedValueOnce(encerradaHoje)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await service.getOuCriarSessao('token-a', 100);

    expect(result.concluida).toBe(true);
    expect(result.seriesHoje[700]).toHaveLength(1);
    expect(prisma.sessaoTreino.create).not.toHaveBeenCalled();
  });

  it('a sessão recebe a data do primeiro registro de série, não a da abertura da ficha', async () => {
    prisma.aluno.findUnique.mockResolvedValue(ALUNO_A);
    prisma.sessaoTreino.findFirst.mockResolvedValue(SESSAO_DO_ALUNO_A);
    prisma.treinoExercicio.findFirst.mockResolvedValue(
      TREINO_EXERCICIO_DA_SESSAO_A,
    );
    prisma.sessaoExercicioSerie.upsert.mockResolvedValue({ concluido: true });
    prisma.sessaoExercicioSerie.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await service.salvarSeriesExercicio('token-a', 500, 700, [
      { numeroSerie: 1, cargaKg: 20, repeticoes: 10, concluido: true },
    ]);
    expect(prisma.sessaoTreino.update).toHaveBeenCalledWith({
      where: { idSessao: 500 },
      data: { data: hojeEmSaoPaulo() },
    });

    // Registros seguintes não mexem mais na data
    prisma.sessaoTreino.update.mockClear();
    await service.salvarSeriesExercicio('token-a', 500, 700, [
      { numeroSerie: 2, cargaKg: 20, repeticoes: 10, concluido: true },
    ]);
    expect(prisma.sessaoTreino.update).not.toHaveBeenCalled();
  });

  // 3. Aluno legítimo consegue marcar/desmarcar exercício.
  it('permite que o aluno legítimo marque um exercício como concluído', async () => {
    prisma.aluno.findUnique.mockResolvedValue(ALUNO_A);
    prisma.sessaoTreino.findFirst.mockResolvedValue(SESSAO_DO_ALUNO_A);
    prisma.treinoExercicio.findFirst.mockResolvedValue(
      TREINO_EXERCICIO_DA_SESSAO_A,
    );
    prisma.exercicioConcluido.findUnique.mockResolvedValue(null);
    prisma.exercicioConcluido.create.mockResolvedValue({ idConcluido: 1 });

    const result = await service.toggleExercicio('token-a', 500, 700);

    expect(result).toEqual({ concluido: true, idTreinoExercicio: 700 });
    expect(prisma.exercicioConcluido.create).toHaveBeenCalledWith({
      data: { idSessao: 500, idTreinoExercicio: 700 },
    });
  });

  // 4. Aluno legítimo consegue salvar séries.
  it('permite que o aluno legítimo salve séries do próprio treino', async () => {
    prisma.aluno.findUnique.mockResolvedValue(ALUNO_A);
    prisma.sessaoTreino.findFirst.mockResolvedValue(SESSAO_DO_ALUNO_A);
    prisma.treinoExercicio.findFirst.mockResolvedValue(
      TREINO_EXERCICIO_DA_SESSAO_A,
    );
    prisma.sessaoExercicioSerie.upsert.mockResolvedValue({ concluido: false });
    prisma.exercicioConcluido.findUnique.mockResolvedValue(null);

    const result = await service.salvarSeriesExercicio('token-a', 500, 700, [
      { numeroSerie: 1, cargaKg: 20, repeticoes: 10, concluido: false },
    ]);

    expect(result.success).toBe(true);
  });

  // 5. Aluno legítimo consegue encerrar sessão.
  it('permite que o aluno legítimo encerre a própria sessão', async () => {
    prisma.aluno.findUnique.mockResolvedValue(ALUNO_A);
    prisma.sessaoTreino.findFirst.mockResolvedValue(SESSAO_DO_ALUNO_A);
    prisma.sessaoTreino.update.mockResolvedValue({
      ...SESSAO_DO_ALUNO_A,
      concluida: true,
      finalizadoEm: new Date('2026-09-15T12:00:00Z'),
      concluidos: [],
      seriesRealizadas: [],
    });

    const result = await service.encerrarSessao('token-a', 500);

    expect(result.success).toBe(true);
    expect(result.concluida).toBe(true);
    expect(prisma.sessaoTreino.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idSessao: 500 } }),
    );
  });

  // 6. Pessoa sem token (token inexistente/inválido) não consegue modificar sessão.
  it('rejeita qualquer mutação quando o token não corresponde a nenhum aluno', async () => {
    prisma.aluno.findUnique.mockResolvedValue(null);

    await expect(
      service.toggleExercicio('token-invalido', 500, 700),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.salvarSeriesExercicio('token-invalido', 500, 700, [
        { numeroSerie: 1 },
      ]),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.encerrarSessao('token-invalido', 500),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.sessaoTreino.findFirst).not.toHaveBeenCalled();
    expect(prisma.exercicioConcluido.create).not.toHaveBeenCalled();
  });

  // 7. Token do aluno A não consegue modificar sessão do aluno B.
  it('rejeita mutação quando a sessão pertence a outro aluno', async () => {
    prisma.aluno.findUnique.mockResolvedValue(ALUNO_A); // token-a resolve para o Aluno A (idAluno 1)
    // A consulta já filtra por idAluno do token (1); a sessão do Aluno B (idAluno 2) nunca "bate".
    prisma.sessaoTreino.findFirst.mockResolvedValue(null);

    await expect(
      service.toggleExercicio('token-a', SESSAO_DO_ALUNO_B.idSessao, 700),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.sessaoTreino.findFirst).toHaveBeenCalledWith({
      where: { idSessao: SESSAO_DO_ALUNO_B.idSessao, idAluno: ALUNO_A.idAluno },
    });
    expect(prisma.treinoExercicio.findFirst).not.toHaveBeenCalled();
    expect(prisma.exercicioConcluido.create).not.toHaveBeenCalled();
  });

  // 8. idSessao de outro aluno não pode ser usado junto com um token legítimo.
  it('rejeita salvarSeriesExercicio quando idSessao pertence a outro aluno', async () => {
    prisma.aluno.findUnique.mockResolvedValue(ALUNO_A);
    prisma.sessaoTreino.findFirst.mockResolvedValue(null); // idSessao 600 não pertence ao idAluno 1

    await expect(
      service.salvarSeriesExercicio(
        'token-a',
        SESSAO_DO_ALUNO_B.idSessao,
        700,
        [{ numeroSerie: 1 }],
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.sessaoExercicioSerie.upsert).not.toHaveBeenCalled();
  });

  // 9. idTreinoExercicio de outro treino não pode ser utilizado dentro de uma sessão válida.
  it('rejeita mutação quando o exercício não pertence ao treino da sessão', async () => {
    prisma.aluno.findUnique.mockResolvedValue(ALUNO_A);
    prisma.sessaoTreino.findFirst.mockResolvedValue(SESSAO_DO_ALUNO_A); // idTreino 100
    prisma.treinoExercicio.findFirst.mockResolvedValue(null); // 701 não pertence ao treino 100

    await expect(
      service.toggleExercicio(
        'token-a',
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

  // 10. IDs sequenciais não permitem acesso cruzado: nenhum idSessao "adivinhado" funciona,
  // só o idSessao real do aluno dono do token.
  it('não permite acesso cruzado testando uma faixa de idSessao sequenciais', async () => {
    prisma.aluno.findUnique.mockResolvedValue(ALUNO_A);
    prisma.sessaoTreino.findFirst.mockImplementation(
      ({ where }: { where: { idSessao: number; idAluno: number } }) => {
        // Simula o banco: só existe vínculo (idSessao, idAluno) para a sessão 500 do Aluno A.
        if (
          where.idSessao === SESSAO_DO_ALUNO_A.idSessao &&
          where.idAluno === ALUNO_A.idAluno
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
        service.toggleExercicio('token-a', idSessaoTentativa, 700),
      ).rejects.toBeInstanceOf(NotFoundException);
    }
    expect(prisma.exercicioConcluido.create).not.toHaveBeenCalled();

    // O único idSessao que realmente pertence ao aluno funciona normalmente.
    const result = await service.toggleExercicio(
      'token-a',
      SESSAO_DO_ALUNO_A.idSessao,
      700,
    );
    expect(result.concluido).toBe(true);
  });

  // Cobertura extra: getOuCriarSessao também valida que o idTreino pertence ao aluno do token.
  it('rejeita getOuCriarSessao quando o treino não pertence ao aluno do token', async () => {
    prisma.aluno.findUnique.mockResolvedValue(ALUNO_A);
    prisma.treino.findFirst.mockResolvedValue(null); // treino 999 não é do Aluno A

    await expect(
      service.getOuCriarSessao('token-a', 999),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.sessaoTreino.create).not.toHaveBeenCalled();
  });
  // Links atuais usam o tokenPublico da periodização: ele também precisa
  // resolver para o dono da periodização e isolar os dados dos outros alunos.
  describe('link por periodização (tokenPublico)', () => {
    it('resolve o aluno pelo tokenPublico sem consultar o tokenAcesso', async () => {
      prisma.protocoloTreino.findUnique.mockResolvedValue({ aluno: ALUNO_A });
      prisma.sessaoTreino.findFirst.mockResolvedValue(null);

      await expect(
        service.toggleExercicio(
          'periodizacao-a',
          SESSAO_DO_ALUNO_B.idSessao,
          700,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.protocoloTreino.findUnique).toHaveBeenCalledWith({
        where: { tokenPublico: 'periodizacao-a' },
        select: { aluno: true },
      });
      expect(prisma.aluno.findUnique).not.toHaveBeenCalled();
      // a sessão é sempre buscada com o idAluno do dono do token
      expect(prisma.sessaoTreino.findFirst).toHaveBeenCalledWith({
        where: {
          idSessao: SESSAO_DO_ALUNO_B.idSessao,
          idAluno: ALUNO_A.idAluno,
        },
      });
      expect(prisma.exercicioConcluido.create).not.toHaveBeenCalled();
    });

    it('rejeita token que não é tokenPublico nem tokenAcesso', async () => {
      prisma.protocoloTreino.findUnique.mockResolvedValue(null);
      prisma.aluno.findUnique.mockResolvedValue(null);

      await expect(
        service.salvarSeriesExercicio(
          'token-inexistente',
          SESSAO_DO_ALUNO_A.idSessao,
          700,
          [{ numeroSerie: 1 }],
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.sessaoTreino.findFirst).not.toHaveBeenCalled();
      expect(prisma.sessaoExercicioSerie.upsert).not.toHaveBeenCalled();
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
