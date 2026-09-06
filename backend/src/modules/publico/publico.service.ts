import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicoService {
  constructor(private prisma: PrismaService) {}

  async findActiveByToken(tokenAcesso: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { tokenAcesso },
      include: {
        profissional: {
          select: {
            nome: true,
            cref: true,
            profissao: true,
            telefone: true,
            instagram: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!aluno) {
      throw new NotFoundException('Ficha de treino não encontrada.');
    }

    const protocolo = await this.prisma.protocoloTreino.findFirst({
      where: { idAluno: aluno.idAluno, ativo: true },
      include: {
        treinos: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
          include: {
            exercicios: {
              orderBy: { ordem: 'asc' },
              include: {
                exercicio: { include: { grupoMuscular: true } },
                tecnica: true,
              },
            },
          },
        },
      },
    });

    return {
      aluno: { nome: aluno.nome, idAluno: aluno.idAluno },
      profissional: aluno.profissional,
      protocolo: protocolo || null,
    };
  }

  // Retorna (ou cria) a sessão ativa do treino + histórico anterior
  async getOuCriarSessao(tokenAcesso: string, idTreino: number) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { tokenAcesso },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado.');

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

    // Busca a sessão anterior mais recente (que tenha séries) que não seja a sessão atual
    const sessaoAnterior = await this.prisma.sessaoTreino.findFirst({
      where: {
        idAluno: aluno.idAluno,
        idTreino,
        idSessao: { not: sessao.idSessao },
        seriesRealizadas: { some: {} },
      },
      orderBy: [{ criadoEm: 'desc' }, { data: 'desc' }],
      include: {
        seriesRealizadas: {
          orderBy: { numeroSerie: 'asc' },
        },
      },
    });

    // Mapeia as séries de hoje por idTreinoExercicio
    const seriesHoje: Record<number, Array<{ numeroSerie: number; cargaKg: number | null; repeticoes: number | null; concluido: boolean }>> = {};
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
      exercicios: Record<number, Array<{ numeroSerie: number; cargaKg: number | null; repeticoes: number | null }>>;
    } | null = null;

    if (sessaoAnterior && sessaoAnterior.seriesRealizadas.length > 0) {
      const exerciciosMap: Record<number, Array<{ numeroSerie: number; cargaKg: number | null; repeticoes: number | null }>> = {};
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
  async encerrarSessao(idSessao: number) {
    const sessao = await this.prisma.sessaoTreino.findUnique({
      where: { idSessao },
      include: {
        concluidos: true,
        seriesRealizadas: true,
      },
    });
    if (!sessao) throw new NotFoundException('Sessão não encontrada.');

    const updated = await this.prisma.sessaoTreino.update({
      where: { idSessao },
      data: {
        concluida: true,
        finalizadoEm: new Date(),
      },
      include: {
        concluidos: true,
        seriesRealizadas: true,
      },
    });

    const totalSeriesConcluidas = updated.seriesRealizadas.filter((s) => s.concluido).length;

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
    const aluno = await this.prisma.aluno.findUnique({
      where: { tokenAcesso },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado.');

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
  async toggleExercicio(idSessao: number, idTreinoExercicio: number) {
    const existente = await this.prisma.exercicioConcluido.findUnique({
      where: { idSessao_idTreinoExercicio: { idSessao, idTreinoExercicio } },
    });

    if (existente) {
      await this.prisma.exercicioConcluido.delete({
        where: { idConcluido: existente.idConcluido },
      });
      return { concluido: false, idTreinoExercicio };
    } else {
      await this.prisma.exercicioConcluido.create({
        data: { idSessao, idTreinoExercicio },
      });
      return { concluido: true, idTreinoExercicio };
    }
  }

  // Salva ou atualiza as séries de um exercício da sessão
  async salvarSeriesExercicio(
    idSessao: number,
    idTreinoExercicio: number,
    series: Array<{ numeroSerie: number; cargaKg?: number | null; repeticoes?: number | null; concluido?: boolean }>,
  ) {
    const sessao = await this.prisma.sessaoTreino.findUnique({
      where: { idSessao },
    });
    if (!sessao) throw new NotFoundException('Sessão não encontrada.');

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
            cargaKg: s.cargaKg !== undefined ? (s.cargaKg !== null && !isNaN(Number(s.cargaKg)) ? Number(s.cargaKg) : null) : undefined,
            repeticoes: s.repeticoes !== undefined ? (s.repeticoes !== null && !isNaN(Number(s.repeticoes)) ? Number(s.repeticoes) : null) : undefined,
            concluido: s.concluido !== undefined ? s.concluido : false,
          },
          create: {
            idSessao,
            idTreinoExercicio,
            numeroSerie: s.numeroSerie,
            cargaKg: s.cargaKg !== undefined && s.cargaKg !== null && !isNaN(Number(s.cargaKg)) ? Number(s.cargaKg) : null,
            repeticoes: s.repeticoes !== undefined && s.repeticoes !== null && !isNaN(Number(s.repeticoes)) ? Number(s.repeticoes) : null,
            concluido: s.concluido !== undefined ? s.concluido : false,
          },
        }),
      ),
    );

    // Se todas as séries foram concluídas, garante que ExercicioConcluido esteja registrado
    const todasConcluidas = results.length > 0 && results.every((r) => r.concluido);
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

