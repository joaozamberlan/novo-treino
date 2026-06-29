import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { CreateTreinoDto } from './dto/create-treino.dto';
import { AddExercicioDto } from './dto/add-exercicio.dto';

@Injectable()
export class TreinosService {
  constructor(private prisma: PrismaService) {}

  // --- PROTOCOLOS ---
  async createProtocolo(idAluno: number, idProfissional: number, createDto: CreateProtocoloDto) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // Set other protocols of this student as inactive, then create the new active one
    return this.prisma.$transaction(async (tx) => {
      await tx.protocoloTreino.updateMany({
        where: { idAluno, ativo: true },
        data: { ativo: false },
      });

      return tx.protocoloTreino.create({
        data: {
          ...createDto,
          idAluno,
          idProfissional,
          ativo: true,
          dataInicio: createDto.dataInicio ? new Date(createDto.dataInicio) : null,
          dataFim: createDto.dataFim ? new Date(createDto.dataFim) : null,
        },
      });
    });
  }

  async findAllProtocolos(idAluno: number, idProfissional: number) {
    return this.prisma.protocoloTreino.findMany({
      where: { idAluno, idProfissional },
      orderBy: { dataInicio: 'desc' },
    });
  }

  async findOneProtocolo(idProtocolo: number, idProfissional: number) {
    const protocolo = await this.prisma.protocoloTreino.findFirst({
      where: { idProtocolo, idProfissional },
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

    if (!protocolo) {
      throw new NotFoundException('Protocolo não encontrado');
    }

    return protocolo;
  }

  async updateProtocolo(idProtocolo: number, idProfissional: number, updateDto: any) {
    const protocolo = await this.prisma.protocoloTreino.findFirst({
      where: { idProtocolo, idProfissional },
    });
    if (!protocolo) {
      throw new NotFoundException('Protocolo não encontrado');
    }

    const data: any = { ...updateDto };
    if (updateDto.dataInicio) data.dataInicio = new Date(updateDto.dataInicio);
    if (updateDto.dataFim) data.dataFim = new Date(updateDto.dataFim);

    // If activating, deactivate all other protocols of the student
    if (updateDto.ativo === true) {
      return this.prisma.$transaction(async (tx) => {
        await tx.protocoloTreino.updateMany({
          where: { idAluno: protocolo.idAluno, idProtocolo: { not: idProtocolo }, ativo: true },
          data: { ativo: false },
        });

        return tx.protocoloTreino.update({
          where: { idProtocolo },
          data,
        });
      });
    }

    return this.prisma.protocoloTreino.update({
      where: { idProtocolo },
      data,
    });
  }

  // --- TREINOS (FICHAS) ---
  async createTreino(idProtocolo: number, idProfissional: number, createDto: CreateTreinoDto) {
    const protocolo = await this.prisma.protocoloTreino.findFirst({
      where: { idProtocolo, idProfissional },
    });
    if (!protocolo) {
      throw new NotFoundException('Protocolo não encontrado');
    }

    return this.prisma.treino.create({
      data: {
        ...createDto,
        idProtocolo,
      },
    });
  }

  async updateTreino(idTreino: number, idProfissional: number, updateDto: any) {
    const treino = await this.prisma.treino.findFirst({
      where: { idTreino, protocolo: { idProfissional } },
    });
    if (!treino) {
      throw new NotFoundException('Ficha de treino não encontrada');
    }

    return this.prisma.treino.update({
      where: { idTreino },
      data: updateDto,
    });
  }

  // --- TREINO EXERCICIOS ---
  async addExercicioToTreino(idTreino: number, idProfissional: number, addDto: AddExercicioDto) {
    const treino = await this.prisma.treino.findFirst({
      where: { idTreino, protocolo: { idProfissional } },
    });
    if (!treino) {
      throw new NotFoundException('Ficha de treino não encontrada');
    }

    const exercicio = await this.prisma.exercicio.findUnique({
      where: { idExercicio: addDto.idExercicio },
    });
    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado');
    }

    if (addDto.idTecnica) {
      const tecnica = await this.prisma.tecnicaTreino.findUnique({
        where: { idTecnica: addDto.idTecnica },
      });
      if (!tecnica) {
        throw new NotFoundException('Técnica de treino não encontrada');
      }
    }

    return this.prisma.treinoExercicio.create({
      data: {
        ...addDto,
        idTreino,
      },
      include: {
        exercicio: true,
        tecnica: true,
      },
    });
  }

  async updateExercicioInTreino(
    idTreinoExercicio: number,
    idProfissional: number,
    updateDto: any,
  ) {
    const rel = await this.prisma.treinoExercicio.findFirst({
      where: {
        idTreinoExercicio,
        treino: {
          protocolo: { idProfissional },
        },
      },
    });
    if (!rel) {
      throw new NotFoundException('Exercício prescrito não encontrado');
    }

    return this.prisma.treinoExercicio.update({
      where: { idTreinoExercicio },
      data: updateDto,
    });
  }

  async removeExercicioFromTreino(idTreinoExercicio: number, idProfissional: number) {
    const rel = await this.prisma.treinoExercicio.findFirst({
      where: {
        idTreinoExercicio,
        treino: {
          protocolo: { idProfissional },
        },
      },
    });
    if (!rel) {
      throw new NotFoundException('Exercício prescrito não encontrado');
    }

    return this.prisma.treinoExercicio.delete({
      where: { idTreinoExercicio },
    });
  }

  // --- CALCULO DE VOLUME SEMANAL ---
  async getVolumeSemanal(idAluno: number, idProfissional: number) {
    const student = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
    });
    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    const exerciciosPrescritos = await this.prisma.treinoExercicio.findMany({
      where: {
        treino: {
          ativo: true,
          protocolo: {
            idAluno,
            ativo: true,
          },
        },
      },
      include: {
        exercicio: {
          include: {
            grupoMuscular: true,
          },
        },
      },
    });

    const volumePorGrupo: Record<string, number> = {};

    exerciciosPrescritos.forEach((item) => {
      const grupo = item.exercicio.grupoMuscular.nome;
      volumePorGrupo[grupo] = (volumePorGrupo[grupo] || 0) + item.series;
    });

    return volumePorGrupo;
  }
}
