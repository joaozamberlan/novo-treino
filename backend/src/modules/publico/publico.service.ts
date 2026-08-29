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

  // Retorna (ou cria) a sessão do dia para um treino específico
  async getOuCriarSessao(tokenAcesso: string, idTreino: number) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { tokenAcesso },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado.');

    const hoje = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    const sessao = await this.prisma.sessaoTreino.upsert({
      where: {
        idAluno_idTreino_data: {
          idAluno: aluno.idAluno,
          idTreino,
          data: hoje,
        },
      },
      update: {},
      create: { idAluno: aluno.idAluno, idTreino, data: hoje },
      include: { concluidos: true },
    });

    return {
      idSessao: sessao.idSessao,
      data: sessao.data,
      concluidosIds: sessao.concluidos.map((c: any) => c.idTreinoExercicio),
    };
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
}

