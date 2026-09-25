import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicoService {
  constructor(private prisma: PrismaService) {}

  // ── Cadeia de posse: tokenAcesso → aluno → treino → sessão → exercício ──
  // Todas as mutações públicas passam por aqui antes de tocar em qualquer dado.
  // Erros são sempre NotFoundException com mensagem genérica — nunca revelam
  // se um recurso existe mas pertence a outro aluno, para não facilitar
  // enumeração de IDs sequenciais.

  // Resolve o aluno tanto pelo tokenPublico de uma periodização específica
  // quanto pelo tokenAcesso antigo (compatibilidade), para que interações
  // (marcar série, nova sessão, etc.) funcionem em qualquer link válido.
  private async getAlunoPorToken(token: string) {
    const protocolo = await this.prisma.protocoloTreino.findUnique({
      where: { tokenPublico: token },
      select: { aluno: true },
    });
    if (protocolo) {
      return protocolo.aluno;
    }

    const aluno = await this.prisma.aluno.findUnique({
      where: { tokenAcesso: token },
    });
    if (!aluno) {
      throw new NotFoundException('Ficha de treino não encontrada.');
    }
    return aluno;
  }

  // Manifest PWA específico do link do aluno. É servido no mesmo domínio do
  // frontend em /v/:token/manifest.webmanifest (rewrite no vercel.json), então os
  // caminhos relativos resolvem para o próprio link e o app instalado abre o
  // treino em vez da tela de login do treinador.
  async getManifest(token: string) {
    const aluno = await this.getAlunoPorToken(token);
    const primeiroNome = aluno.nome.split(' ')[0];
    return {
      id: './',
      name: `Treino de ${primeiroNome}`,
      short_name: 'Meu treino',
      description: 'Seu treino prescrito pelo seu personal',
      start_url: './',
      scope: './',
      display: 'standalone',
      orientation: 'portrait',
      theme_color: '#0d0d0d',
      background_color: '#0d0d0d',
      icons: [
        { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    };
  }

  private async getTreinoDoAluno(idTreino: number, idAluno: number) {
    const treino = await this.prisma.treino.findFirst({
      where: { idTreino, protocolo: { idAluno } },
    });
    if (!treino) {
      throw new NotFoundException('Treino não encontrado.');
    }
    return treino;
  }

  private async getSessaoDoAluno(idSessao: number, idAluno: number) {
    const sessao = await this.prisma.sessaoTreino.findFirst({
      where: { idSessao, idAluno },
    });
    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada.');
    }
    return sessao;
  }

  private async getTreinoExercicioDaSessao(
    idTreinoExercicio: number,
    idTreino: number,
  ) {
    const rel = await this.prisma.treinoExercicio.findFirst({
      where: { idTreinoExercicio, idTreino },
    });
    if (!rel) {
      throw new NotFoundException('Exercício não encontrado nesta sessão.');
    }
    return rel;
  }

  private static readonly ALUNO_PROFISSIONAL_SELECT = {
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
          orderBy: { ordem: 'asc' as const },
          include: {
            exercicio: { include: { grupoMuscular: true } },
            tecnica: true,
          },
        },
      },
    },
  };

  async findActiveByToken(token: string) {
    // Primeiro tenta resolver como link de uma periodização específica
    // (tokenPublico) — sempre mostra ESSA periodização, ativa ou não.
    const protocoloPorToken = await this.prisma.protocoloTreino.findUnique({
      where: { tokenPublico: token },
      include: {
        aluno: {
          include: { profissional: { select: PublicoService.ALUNO_PROFISSIONAL_SELECT } },
        },
        ...PublicoService.PROTOCOLO_TREINOS_INCLUDE,
      },
    });

    if (protocoloPorToken) {
      const { aluno, ...protocolo } = protocoloPorToken;

      let linkAtualToken: string | null = null;
      if (!protocolo.ativo) {
        const atual = await this.prisma.protocoloTreino.findFirst({
          where: { idAluno: aluno.idAluno, ativo: true },
          select: { tokenPublico: true },
        });
        linkAtualToken = atual?.tokenPublico || null;
      }

      return {
        aluno: { nome: aluno.nome, idAluno: aluno.idAluno },
        profissional: aluno.profissional,
        protocolo,
        isAtual: protocolo.ativo,
        linkAtualToken,
      };
    }

    // Compatibilidade com links antigos, gerados antes de existir um token
    // por periodização: continuam mostrando a periodização ativa do aluno.
    const aluno = await this.prisma.aluno.findUnique({
      where: { tokenAcesso: token },
      include: { profissional: { select: PublicoService.ALUNO_PROFISSIONAL_SELECT } },
    });

    if (!aluno) {
      throw new NotFoundException('Ficha de treino não encontrada.');
    }

    const protocolo = await this.prisma.protocoloTreino.findFirst({
      where: { idAluno: aluno.idAluno, ativo: true },
      include: PublicoService.PROTOCOLO_TREINOS_INCLUDE,
    });

    return {
      aluno: { nome: aluno.nome, idAluno: aluno.idAluno },
      profissional: aluno.profissional,
      protocolo: protocolo || null,
      isAtual: true,
      linkAtualToken: null,
    };
  }

  // Retorna (ou cria) a sessão ativa do treino + histórico anterior
  async getOuCriarSessao(tokenAcesso: string, idTreino: number) {
    const aluno = await this.getAlunoPorToken(tokenAcesso);
    await this.getTreinoDoAluno(idTreino, aluno.idAluno);

    const hoje = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // Busca sessão ativa (não encerrada) mais recente
    let sessao = await this.prisma.sessaoTreino.findFirst({
      where: {
        idAluno: aluno.idAluno,
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

    // Se não houver sessão ativa aberta, cria uma nova
    if (!sessao) {
      sessao = await this.prisma.sessaoTreino.create({
        data: {
          idAluno: aluno.idAluno,
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
        idAluno: aluno.idAluno,
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
          idAluno: aluno.idAluno,
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
    tokenAcesso: string,
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
    const aluno = await this.getAlunoPorToken(tokenAcesso);
    const sessao = await this.getSessaoDoAluno(idSessao, aluno.idAluno);

    // Se exercicios com séries foram enviados no encerramento, grava todos atomicamente
    if (exercicios && Array.isArray(exercicios) && exercicios.length > 0) {
      for (const ex of exercicios) {
        if (ex.series && Array.isArray(ex.series) && ex.series.length > 0) {
          await this.salvarSeriesNaSessao(
            sessao.idSessao,
            sessao.idTreino,
            ex.idTreinoExercicio,
            ex.series,
          );
        }
      }
    }

    const updated = await this.prisma.sessaoTreino.update({
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
  async iniciarNovaSessao(tokenAcesso: string, idTreino: number) {
    const aluno = await this.getAlunoPorToken(tokenAcesso);
    await this.getTreinoDoAluno(idTreino, aluno.idAluno);

    // Encerra qualquer sessão aberta deste treino
    await this.prisma.sessaoTreino.updateMany({
      where: {
        idAluno: aluno.idAluno,
        idTreino,
        concluida: false,
      },
      data: {
        concluida: true,
        finalizadoEm: new Date(),
      },
    });

    // Cria nova sessão vazia
    const hoje = new Date().toISOString().slice(0, 10);
    await this.prisma.sessaoTreino.create({
      data: {
        idAluno: aluno.idAluno,
        idTreino,
        data: hoje,
        concluida: false,
      },
    });

    return this.getOuCriarSessao(tokenAcesso, idTreino);
  }

  // Toggle: marca ou desmarca um exercício como concluído
  async toggleExercicio(
    tokenAcesso: string,
    idSessao: number,
    idTreinoExercicio: number,
  ) {
    const aluno = await this.getAlunoPorToken(tokenAcesso);
    const sessao = await this.getSessaoDoAluno(idSessao, aluno.idAluno);
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
    tokenAcesso: string,
    idSessao: number,
    idTreinoExercicio: number,
    series: Array<{
      numeroSerie: number;
      cargaKg?: number | null;
      repeticoes?: number | null;
      concluido?: boolean;
    }>,
  ) {
    const aluno = await this.getAlunoPorToken(tokenAcesso);
    const sessao = await this.getSessaoDoAluno(idSessao, aluno.idAluno);
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
    tokenAcesso: string,
    idSessao: number,
    idTreinoExercicio: number,
    numeroSerie: number,
  ) {
    const aluno = await this.getAlunoPorToken(tokenAcesso);
    const sessao = await this.getSessaoDoAluno(idSessao, aluno.idAluno);
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

  // Assume que a posse da sessão (tokenAcesso → aluno → sessão) já foi validada pelo chamador.
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
  ) {
    await this.getTreinoExercicioDaSessao(idTreinoExercicio, idTreinoDaSessao);

    // Upsert para cada série
    const results = await Promise.all(
      series.map((s) =>
        this.prisma.sessaoExercicioSerie.upsert({
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
      await this.prisma.exercicioConcluido.upsert({
        where: { idSessao_idTreinoExercicio: { idSessao, idTreinoExercicio } },
        update: {},
        create: { idSessao, idTreinoExercicio },
      });
    } else {
      const existente = await this.prisma.exercicioConcluido.findUnique({
        where: { idSessao_idTreinoExercicio: { idSessao, idTreinoExercicio } },
      });
      if (existente) {
        await this.prisma.exercicioConcluido.delete({
          where: { idConcluido: existente.idConcluido },
        });
      }
    }

    return { success: true, idTreinoExercicio, series: results };
  }
}
