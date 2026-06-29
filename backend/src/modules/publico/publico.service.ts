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
                exercicio: {
                  include: { grupoMuscular: true },
                },
                tecnica: true,
              },
            },
          },
        },
      },
    });

    return {
      aluno: {
        nome: aluno.nome,
      },
      profissional: aluno.profissional,
      protocolo: protocolo || null,
    };
  }
}
