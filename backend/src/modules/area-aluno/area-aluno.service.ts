import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildProgresso } from '../treinos/progresso';

// Data de hoje no fuso dos alunos ('YYYY-MM-DD'). O servidor roda em UTC:
// toISOString() jogava treinos feitos depois das 21h para o dia seguinte.
export function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());
}

export const PROTOCOLO_SOMENTE_LEITURA =
  'Este protocolo é somente leitura. Registre as cargas no protocolo atual.';

@Injectable()
export class AreaAlunoService {
  constructor(private prisma: PrismaService) {}

  // ── Cadeia de posse: aluno (do JWT) → treino → sessão → exercício ──
  // O idAluno vem sempre da sessão autenticada, nunca do body ou da URL.
  // Erros de posse são NotFoundException com mensagem genérica — nunca revelam
  // se um recurso existe mas pertence a outro aluno, para não facilitar
  // enumeração de IDs sequenciais.

  // O aluno só registra cargas no protocolo atual; os anteriores são leitura.
  private exigirProtocoloAtual(protocolo: { ativo: boolean }) {
    if (!protocolo.ativo) {
      throw new ForbiddenException(PROTOCOLO_SOMENTE_LEITURA);
    }
  }

  private async getTreinoDoAluno(idTreino: number, idAluno: number) {
    const treino = await this.prisma.treino.findFirst({
      where: { idTreino, protocolo: { idAluno, excluido: false } },
      include: { protocolo: { select: { ativo: true } } },
    });
    if (!treino) {
      throw new NotFoundException('Treino não encontrado.');
    }
    this.exigirProtocoloAtual(treino.protocolo);
    return treino;
  }

  private async getSessaoDoAluno(idSessao: number, idAluno: number) {
    const sessao = await this.prisma.sessaoTreino.findFirst({
      where: { idSessao, idAluno, treino: { protocolo: { excluido: false } } },
      include: {
        treino: { select: { protocolo: { select: { ativo: true } } } },
      },
    });
    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada.');
    }
    this.exigirProtocoloAtual(sessao.treino.protocolo);
    return sessao;
  }

  private async getTreinoExercicioDaSessao(
    idTreinoExercicio: number,
    idTreino: number,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const rel = await db.treinoExercicio.findFirst({
      where: { idTreinoExercicio, idTreino },
    });
    if (!rel) {
      throw new NotFoundException('Exercício não encontrado nesta sessão.');
    }
    return rel;
  }

  private static readonly ALUNO_PROFISSIONAL_SELECT = {
    idProfissional: true,
    nome: true,
    cref: true,
    profissao: true,
    telefone: true,
    instagram: true,
    logoUrl: true,
    rodapeTreino: true,
  } as const;

  private static readonly PROTOCOLO_TREINOS_INCLUDE = {
    treinos: {
      where: { ativo: true },
      orderBy: { ordem: 'asc' as const },
      include: {
        exercicios: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' as const },
          include: {
            exercicio: { include: { grupoMuscular: true } },
            tecnica: true,
          },
        },
      },
    },
  };

  // Dados do aluno logado e do treinador dele (cabeçalho, rodapé e PDF)
  async getMe(idAluno: number) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { idAluno },
      select: {
        idAluno: true,
        nome: true,
        profissional: { select: AreaAlunoService.ALUNO_PROFISSIONAL_SELECT },
      },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }
    const { profissional, ...dados } = aluno;
    return { aluno: dados, profissional };
  }

  // Protocolo atual primeiro, depois os anteriores do mais novo para o mais antigo
  async listarProtocolos(idAluno: number) {
    return this.prisma.protocoloTreino.findMany({
      where: { idAluno, excluido: false },
      orderBy: [{ ativo: 'desc' }, { idProtocolo: 'desc' }],
      select: {
        idProtocolo: true,
        nome: true,
        objetivo: true,
        dataInicio: true,
        dataFim: true,
        ativo: true,
      },
    });
  }

  // Fichas do protocolo atual; null quando o treinador ainda não definiu um
  async getProtocoloAtual(idAluno: number) {
    const protocolo = await this.prisma.protocoloTreino.findFirst({
      where: { idAluno, ativo: true, excluido: false },
      orderBy: { idProtocolo: 'desc' },
      omit: { tokenPublico: true },
      include: AreaAlunoService.PROTOCOLO_TREINOS_INCLUDE,
    });
    return { protocolo, isAtual: true };
  }

  // Fichas de um protocolo do próprio aluno (atual ou anterior)
  async getProtocolo(idAluno: number, idProtocolo: number) {
    const protocolo = await this.prisma.protocoloTreino.findFirst({
      where: { idProtocolo, idAluno, excluido: false },
      omit: { tokenPublico: true },
      include: AreaAlunoService.PROTOCOLO_TREINOS_INCLUDE,
    });
    if (!protocolo) {
      throw new NotFoundException('Protocolo não encontrado.');
    }
    return { protocolo, isAtual: protocolo.ativo };
  }

  // Progresso de cargas de um protocolo do próprio aluno
  async getProgresso(idAluno: number, idProtocolo: number) {
    const protocolo = await this.prisma.protocoloTreino.findFirst({
      where: { idProtocolo, idAluno, excluido: false },
      select: { idProtocolo: true },
    });
    if (!protocolo) {
      throw new NotFoundException('Protocolo não encontrado.');
    }
    return buildProgresso(this.prisma, idAluno, protocolo.idProtocolo);
  }

  // Retorna (ou cria) a sessão ativa do treino + histórico anterior
  async getOuCriarSessao(idAluno: number, idTreino: number) {
    await this.getTreinoDoAluno(idTreino, idAluno);

    const hoje = hojeEmSaoPaulo();

    // Busca sessão ativa (não encerrada) mais recente
    let sessao = await this.prisma.sessaoTreino.findFirst({
      where: {
        idAluno,
        idTreino,
        concluida: false,
      },
      orderBy: { criadoEm: 'desc' },
      include: {
        concluidos: true,
        seriesRealizadas: {
          orderBy: { numeroSerie: 'asc' },
        },
      },
    });

    // Treino já encerrado hoje: reabrir a ficha mostra o treino concluído, em
    // vez de criar outra sessão vazia no mesmo dia.
    if (!sessao) {
      sessao = await this.prisma.sessaoTreino.findFirst({
        where: {
          idAluno,
          idTreino,
          concluida: true,
          data: hoje,
          seriesRealizadas: { some: {} },
        },
        orderBy: [{ finalizadoEm: 'desc' }, { idSessao: 'desc' }],
        include: {
          concluidos: true,
          seriesRealizadas: {
            orderBy: { numeroSerie: 'asc' },
          },
        },
      });
    }

    // Se não houver sessão ativa aberta, cria uma nova
    if (!sessao) {
      sessao = await this.prisma.sessaoTreino.create({
        data: {
          idAluno,
          idTreino,
          data: hoje,
          concluida: false,
        },
        include: {
          concluidos: true,
          seriesRealizadas: {
            orderBy: { numeroSerie: 'asc' },
          },
        },
      });
    }

    // Busca a sessão anterior mais recente que tenha séries registradas (prioriza concluídas)
    let sessaoAnterior = await this.prisma.sessaoTreino.findFirst({
      where: {
        idAluno,
        idTreino,
        idSessao: { not: sessao.idSessao },
        concluida: true,
        seriesRealizadas: {
          some: {
            OR: [
              { cargaKg: { not: null } },
              { repeticoes: { not: null } },
              { concluido: true },
            ],
          },
        },
      },
      orderBy: [{ criadoEm: 'desc' }, { idSessao: 'desc' }],
      include: {
        seriesRealizadas: {
          orderBy: { numeroSerie: 'asc' },
        },
      },
    });

    if (!sessaoAnterior) {
      sessaoAnterior = await this.prisma.sessaoTreino.findFirst({
        where: {
          idAluno,
          idTreino,
          idSessao: { not: sessao.idSessao },
          seriesRealizadas: {
            some: {
              OR: [
                { cargaKg: { not: null } },
                { repeticoes: { not: null } },
                { concluido: true },
              ],
            },
          },
        },
        orderBy: [{ criadoEm: 'desc' }, { idSessao: 'desc' }],
        include: {
          seriesRealizadas: {
            orderBy: { numeroSerie: 'asc' },
          },
        },
      });
    }

    // Mapeia as séries de hoje por idTreinoExercicio
    const seriesHoje: Record<
      number,
      Array<{
        numeroSerie: number;
        cargaKg: number | null;
        repeticoes: number | null;
        concluido: boolean;
      }>
    > = {};
    for (const s of sessao.seriesRealizadas) {
      if (!seriesHoje[s.idTreinoExercicio]) {
        seriesHoje[s.idTreinoExercicio] = [];
      }
      seriesHoje[s.idTreinoExercicio].push({
        numeroSerie: s.numeroSerie,
        cargaKg: s.cargaKg,
        repeticoes: s.repeticoes,
        concluido: s.concluido,
      });
    }

    // Mapeia o histórico anterior por idTreinoExercicio
    let historicoAnterior: {
      idSessao: number;
      data: string;
      finalizadoEm: Date | null;
      exercicios: Record<
        number,
        Array<{
          numeroSerie: number;
          cargaKg: number | null;
          repeticoes: number | null;
        }>
      >;
    } | null = null;

    if (sessaoAnterior && sessaoAnterior.seriesRealizadas.length > 0) {
      const exerciciosMap: Record<
        number,
        Array<{
          numeroSerie: number;
          cargaKg: number | null;
          repeticoes: number | null;
        }>
      > = {};
      for (const s of sessaoAnterior.seriesRealizadas) {
        if (!exerciciosMap[s.idTreinoExercicio]) {
          exerciciosMap[s.idTreinoExercicio] = [];
        }
        exerciciosMap[s.idTreinoExercicio].push({
          numeroSerie: s.numeroSerie,
          cargaKg: s.cargaKg,
          repeticoes: s.repeticoes,
        });
      }
      historicoAnterior = {
        idSessao: sessaoAnterior.idSessao,
        data: sessaoAnterior.data,
        finalizadoEm: sessaoAnterior.finalizadoEm,
        exercicios: exerciciosMap,
      };
    }

    return {
      idSessao: sessao.idSessao,
      data: sessao.data,
      concluida: sessao.concluida,
      finalizadoEm: sessao.finalizadoEm,
      concluidosIds: sessao.concluidos.map((c: any) => c.idTreinoExercicio),
      seriesHoje,
      historicoAnterior,
    };
  }

  // Encerra a sessão atual do treino
  async encerrarSessao(
    idAluno: number,
    idSessao: number,
    exercicios?: Array<{
      idTreinoExercicio: number;
      series: Array<{
        numeroSerie: number;
        cargaKg?: number | null;
        repeticoes?: number | null;
        concluido?: boolean;
      }>;
    }>,
  ) {
    const sessao = await this.getSessaoDoAluno(idSessao, idAluno);

    // Séries enviadas no encerramento e o fechamento da sessão entram na mesma
    // transação: ou tudo é gravado, ou a sessão continua aberta como estava.
    const updated = await this.prisma.$transaction(
      async (tx) => {
        for (const ex of exercicios ?? []) {
          if (ex.series.length > 0) {
            await this.salvarSeriesNaSessao(
              sessao.idSessao,
              sessao.idTreino,
              ex.idTreinoExercicio,
              ex.series,
              tx,
            );
          }
        }

        return tx.sessaoTreino.update({
          where: { idSessao: sessao.idSessao },
          data: {
            concluida: true,
            finalizadoEm: new Date(),
          },
          include: {
            concluidos: true,
            seriesRealizadas: true,
          },
        });
      },
      { timeout: 15_000 },
    );

    const totalSeriesConcluidas = updated.seriesRealizadas.filter(
      (s) => s.concluido,
    ).length;

    return {
      success: true,
      mensagem: 'Treino encerrado com sucesso!',
      idSessao: updated.idSessao,
      concluida: updated.concluida,
      finalizadoEm: updated.finalizadoEm,
      totalExercicios: updated.concluidos.length,
      totalSeries: totalSeriesConcluidas,
    };
  }

  // Inicia uma nova sessão (nova semana), arquivando a anterior como histórico
  async iniciarNovaSessao(idAluno: number, idTreino: number) {
    await this.getTreinoDoAluno(idTreino, idAluno);

    // Encerra qualquer sessão aberta deste treino
    await this.prisma.sessaoTreino.updateMany({
      where: {
        idAluno,
        idTreino,
        concluida: false,
      },
      data: {
        concluida: true,
        finalizadoEm: new Date(),
      },
    });

    // Cria nova sessão vazia
    const hoje = hojeEmSaoPaulo();
    await this.prisma.sessaoTreino.create({
      data: {
        idAluno,
        idTreino,
        data: hoje,
        concluida: false,
      },
    });

    return this.getOuCriarSessao(idAluno, idTreino);
  }

  // Toggle: marca ou desmarca um exercício como concluído
  async toggleExercicio(
    idAluno: number,
    idSessao: number,
    idTreinoExercicio: number,
  ) {
    const sessao = await this.getSessaoDoAluno(idSessao, idAluno);
    await this.getTreinoExercicioDaSessao(idTreinoExercicio, sessao.idTreino);

    const existente = await this.prisma.exercicioConcluido.findUnique({
      where: {
        idSessao_idTreinoExercicio: {
          idSessao: sessao.idSessao,
          idTreinoExercicio,
        },
      },
    });

    if (existente) {
      await this.prisma.exercicioConcluido.delete({
        where: { idConcluido: existente.idConcluido },
      });
      return { concluido: false, idTreinoExercicio };
    } else {
      await this.prisma.exercicioConcluido.create({
        data: { idSessao: sessao.idSessao, idTreinoExercicio },
      });
      return { concluido: true, idTreinoExercicio };
    }
  }

  // Salva ou atualiza as séries de um exercício da sessão
  async salvarSeriesExercicio(
    idAluno: number,
    idSessao: number,
    idTreinoExercicio: number,
    series: Array<{
      numeroSerie: number;
      cargaKg?: number | null;
      repeticoes?: number | null;
      concluido?: boolean;
    }>,
  ) {
    const sessao = await this.getSessaoDoAluno(idSessao, idAluno);
    return this.salvarSeriesNaSessao(
      sessao.idSessao,
      sessao.idTreino,
      idTreinoExercicio,
      series,
    );
  }

  // O aluno só pode remover séries que ele mesmo acrescentou (numeroSerie acima
  // das séries prescritas pelo profissional), nunca as da ficha.
  async removerSerieExtra(
    idAluno: number,
    idSessao: number,
    idTreinoExercicio: number,
    numeroSerie: number,
  ) {
    const sessao = await this.getSessaoDoAluno(idSessao, idAluno);
    const rel = await this.getTreinoExercicioDaSessao(
      idTreinoExercicio,
      sessao.idTreino,
    );

    if (numeroSerie <= rel.series) {
      throw new BadRequestException(
        'Só é possível remover séries adicionadas por você.',
      );
    }

    await this.prisma.sessaoExercicioSerie.deleteMany({
      where: { idSessao: sessao.idSessao, idTreinoExercicio, numeroSerie },
    });
    return { removida: true, idTreinoExercicio, numeroSerie };
  }

  // Assume que a posse da sessão (aluno → sessão) já foi validada pelo chamador.
  private async salvarSeriesNaSessao(
    idSessao: number,
    idTreinoDaSessao: number,
    idTreinoExercicio: number,
    series: Array<{
      numeroSerie: number;
      cargaKg?: number | null;
      repeticoes?: number | null;
      concluido?: boolean;
    }>,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    await this.getTreinoExercicioDaSessao(
      idTreinoExercicio,
      idTreinoDaSessao,
      db,
    );

    // A sessão nasce quando o aluno abre a ficha, que pode ser dias antes do
    // treino. A data dela passa a ser o dia do primeiro registro de série.
    const seriesJaRegistradas = await db.sessaoExercicioSerie.count({
      where: { idSessao },
    });
    if (seriesJaRegistradas === 0) {
      await db.sessaoTreino.update({
        where: { idSessao },
        data: { data: hojeEmSaoPaulo() },
      });
    }

    // Upsert para cada série
    const results = await Promise.all(
      series.map((s) =>
        db.sessaoExercicioSerie.upsert({
          where: {
            idSessao_idTreinoExercicio_numeroSerie: {
              idSessao,
              idTreinoExercicio,
              numeroSerie: s.numeroSerie,
            },
          },
          update: {
            cargaKg:
              s.cargaKg !== undefined
                ? s.cargaKg !== null && !isNaN(Number(s.cargaKg))
                  ? Number(s.cargaKg)
                  : null
                : undefined,
            repeticoes:
              s.repeticoes !== undefined
                ? s.repeticoes !== null && !isNaN(Number(s.repeticoes))
                  ? Number(s.repeticoes)
                  : null
                : undefined,
            concluido: s.concluido !== undefined ? s.concluido : false,
          },
          create: {
            idSessao,
            idTreinoExercicio,
            numeroSerie: s.numeroSerie,
            cargaKg:
              s.cargaKg !== undefined &&
              s.cargaKg !== null &&
              !isNaN(Number(s.cargaKg))
                ? Number(s.cargaKg)
                : null,
            repeticoes:
              s.repeticoes !== undefined &&
              s.repeticoes !== null &&
              !isNaN(Number(s.repeticoes))
                ? Number(s.repeticoes)
                : null,
            concluido: s.concluido !== undefined ? s.concluido : false,
          },
        }),
      ),
    );

    // Se todas as séries foram concluídas, garante que ExercicioConcluido esteja registrado
    const todasConcluidas =
      results.length > 0 && results.every((r) => r.concluido);
    if (todasConcluidas) {
      await db.exercicioConcluido.upsert({
        where: { idSessao_idTreinoExercicio: { idSessao, idTreinoExercicio } },
        update: {},
        create: { idSessao, idTreinoExercicio },
      });
    } else {
      const existente = await db.exercicioConcluido.findUnique({
        where: { idSessao_idTreinoExercicio: { idSessao, idTreinoExercicio } },
      });
      if (existente) {
        await db.exercicioConcluido.delete({
          where: { idConcluido: existente.idConcluido },
        });
      }
    }

    return { success: true, idTreinoExercicio, series: results };
  }
}
