import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { CreateTreinoDto } from './dto/create-treino.dto';
import { AddExercicioDto } from './dto/add-exercicio.dto';
import { UpdateProtocoloDto } from './dto/update-protocolo.dto';
import { UpdateTreinoDto } from './dto/update-treino.dto';
import { UpdateTreinoExercicioDto } from './dto/update-treino-exercicio.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TreinosService {
  constructor(private prisma: PrismaService) {}

  // --- PROTOCOLOS ---
  async createProtocolo(
    idAluno: number,
    idProfissional: number,
    createDto: CreateProtocoloDto,
  ) {
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
          tokenPublico: randomUUID(),
          dataInicio: createDto.dataInicio
            ? new Date(createDto.dataInicio)
            : null,
          dataFim: createDto.dataFim ? new Date(createDto.dataFim) : null,
        },
      });
    });
  }

  async findAllProtocolos(idAluno: number, idProfissional: number) {
    const protocolos = await this.prisma.protocoloTreino.findMany({
      where: { idAluno, idProfissional },
      orderBy: { dataInicio: 'desc' },
      include: {
        treinos: {
          where: { ativo: true },
          select: { _count: { select: { exercicios: true } } },
        },
      },
    });

    // Resumo para o cartão da periodização (sem devolver as fichas inteiras)
    return protocolos.map(({ treinos, ...protocolo }) => ({
      ...protocolo,
      totalFichas: treinos.length,
      totalExercicios: treinos.reduce((n, t) => n + t._count.exercicios, 0),
    }));
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

  // Copia profunda de uma periodização (fichas + exercícios) para um aluno do
  // mesmo profissional. Mantém o nome; não copia datas, link público, carga,
  // sessões nem histórico. A cópia vira a periodização atual do aluno destino.
  async duplicarProtocolo(
    idProtocolo: number,
    idAlunoDestino: number,
    idProfissional: number,
  ) {
    const origem = await this.prisma.protocoloTreino.findFirst({
      where: { idProtocolo, idProfissional },
      include: {
        treinos: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
          include: { exercicios: { orderBy: { ordem: 'asc' } } },
        },
      },
    });
    if (!origem) {
      throw new NotFoundException('Protocolo não encontrado');
    }

    const destino = await this.prisma.aluno.findFirst({
      where: { idAluno: idAlunoDestino, idProfissional },
    });
    if (!destino) {
      throw new NotFoundException('Aluno não encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.protocoloTreino.updateMany({
        where: { idAluno: idAlunoDestino, ativo: true },
        data: { ativo: false },
      });

      return tx.protocoloTreino.create({
        data: {
          nome: origem.nome,
          objetivo: origem.objetivo,
          idAluno: idAlunoDestino,
          idProfissional,
          ativo: true,
          tokenPublico: randomUUID(),
          treinos: {
            create: origem.treinos.map((t) => ({
              nome: t.nome,
              observacao: t.observacao,
              ordem: t.ordem,
              exercicios: {
                create: t.exercicios.map((e) => ({
                  idExercicio: e.idExercicio,
                  idTecnica: e.idTecnica,
                  series: e.series,
                  repeticoes: e.repeticoes,
                  descansoSegundos: e.descansoSegundos,
                  descansoMaxSegundos: e.descansoMaxSegundos,
                  observacao: e.observacao,
                  ordem: e.ordem,
                })),
              },
            })),
          },
        },
      });
    });
  }

  async updateProtocolo(
    idProtocolo: number,
    idProfissional: number,
    updateDto: UpdateProtocoloDto,
  ) {
    const protocolo = await this.prisma.protocoloTreino.findFirst({
      where: { idProtocolo, idProfissional },
    });
    if (!protocolo) {
      throw new NotFoundException('Protocolo não encontrado');
    }

    const data: {
      nome?: string;
      objetivo?: string;
      ativo?: boolean;
      dataInicio?: Date;
      dataFim?: Date;
    } = {
      nome: updateDto.nome,
      objetivo: updateDto.objetivo,
      ativo: updateDto.ativo,
    };
    if (updateDto.dataInicio) data.dataInicio = new Date(updateDto.dataInicio);
    if (updateDto.dataFim) data.dataFim = new Date(updateDto.dataFim);

    // If activating, deactivate all other protocols of the student
    if (updateDto.ativo === true) {
      return this.prisma.$transaction(async (tx) => {
        await tx.protocoloTreino.updateMany({
          where: {
            idAluno: protocolo.idAluno,
            idProtocolo: { not: idProtocolo },
            ativo: true,
          },
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

  async deleteProtocolo(idProtocolo: number, idProfissional: number) {
    const protocolo = await this.prisma.protocoloTreino.findFirst({
      where: { idProtocolo, idProfissional },
    });
    if (!protocolo) {
      throw new NotFoundException('Protocolo não encontrado');
    }

    return this.prisma.protocoloTreino.delete({
      where: { idProtocolo },
    });
  }

  // --- TREINOS (FICHAS) ---
  async createTreino(
    idProtocolo: number,
    idProfissional: number,
    createDto: CreateTreinoDto,
  ) {
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

  async updateTreino(
    idTreino: number,
    idProfissional: number,
    updateDto: UpdateTreinoDto,
  ) {
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

  async deleteTreino(idTreino: number, idProfissional: number) {
    const treino = await this.prisma.treino.findFirst({
      where: { idTreino, protocolo: { idProfissional } },
    });
    if (!treino) {
      throw new NotFoundException('Ficha de treino não encontrada');
    }

    return this.prisma.treino.delete({
      where: { idTreino },
    });
  }

  // --- VISÃO GERAL CONSOLIDADA (ALUNO + PROTOCOLOS + TREINOS + VOLUME EM 1 REQUISIÇÃO) ---
  async getVisaoGeralAluno(idAluno: number, idProfissional: number) {
    let aluno = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
      select: {
        idAluno: true,
        nome: true,
        email: true,
        telefone: true,
        tokenAcesso: true,
      },
    });

    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }

    if (!aluno.tokenAcesso) {
      const tokenAcesso = randomUUID();
      aluno = await this.prisma.aluno.update({
        where: { idAluno },
        data: { tokenAcesso },
        select: {
          idAluno: true,
          nome: true,
          email: true,
          telefone: true,
          tokenAcesso: true,
        },
      });
    }

    const protocolos = await this.prisma.protocoloTreino.findMany({
      where: { idAluno, idProfissional },
      orderBy: { dataInicio: 'desc' },
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

    const activeProtocol = protocolos.find((p) => p.ativo) || null;

    const volumePorGrupo: Record<string, number> = {};
    if (activeProtocol) {
      activeProtocol.treinos.forEach((treino) => {
        treino.exercicios.forEach((item) => {
          const grupo = item.exercicio.grupoMuscular.nome;
          volumePorGrupo[grupo] = (volumePorGrupo[grupo] || 0) + item.series;
        });
      });
    }

    return {
      aluno,
      protocolos,
      activeProtocol,
      volume: volumePorGrupo,
    };
  }

  // --- TREINO EXERCICIOS ---
  async addExercicioToTreino(
    idTreino: number,
    idProfissional: number,
    addDto: AddExercicioDto,
  ) {
    const treino = await this.prisma.treino.findFirst({
      where: { idTreino, protocolo: { idProfissional } },
    });
    if (!treino) {
      throw new NotFoundException('Ficha de treino não encontrada');
    }

    // Escopado por idProfissional: sem isso, um treinador poderia anexar (e
    // assim enxergar o nome de) um exercício/técnica de outro treinador.
    const exercicio = await this.prisma.exercicio.findFirst({
      where: { idExercicio: addDto.idExercicio, idProfissional },
    });
    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado');
    }

    if (addDto.idTecnica) {
      const tecnica = await this.prisma.tecnicaTreino.findFirst({
        where: { idTecnica: addDto.idTecnica, idProfissional },
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
        exercicio: {
          include: { grupoMuscular: true },
        },
        tecnica: true,
      },
    });
  }

  async updateExercicioInTreino(
    idTreinoExercicio: number,
    idProfissional: number,
    updateDto: UpdateTreinoExercicioDto,
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

    // Mesma checagem de posse do addExercicioToTreino: só permite reapontar
    // para um exercício/técnica que pertença ao mesmo treinador.
    if (updateDto.idExercicio !== undefined) {
      const exercicio = await this.prisma.exercicio.findFirst({
        where: { idExercicio: updateDto.idExercicio, idProfissional },
      });
      if (!exercicio) {
        throw new NotFoundException('Exercício não encontrado');
      }
    }
    if (updateDto.idTecnica !== undefined && updateDto.idTecnica !== null) {
      const tecnica = await this.prisma.tecnicaTreino.findFirst({
        where: { idTecnica: updateDto.idTecnica, idProfissional },
      });
      if (!tecnica) {
        throw new NotFoundException('Técnica de treino não encontrada');
      }
    }

    return this.prisma.treinoExercicio.update({
      where: { idTreinoExercicio },
      data: updateDto,
      include: {
        exercicio: {
          include: { grupoMuscular: true },
        },
        tecnica: true,
      },
    });
  }

  async removeExercicioFromTreino(
    idTreinoExercicio: number,
    idProfissional: number,
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
