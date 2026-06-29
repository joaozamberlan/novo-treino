import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExercicioDto } from './dto/create-exercicio.dto';
import { UpdateExercicioDto } from './dto/update-exercicio.dto';
import { DEFAULT_CATALOG, DEFAULT_TECNICAS } from '../../constants/default-catalog';

@Injectable()
export class ExerciciosService {
  constructor(private prisma: PrismaService) {}

  // --- GRUPOS MUSCULARES ---
  async createGrupoMuscular(nome: string, idProfissional: number) {
    const exists = await this.prisma.grupoMuscular.findUnique({
      where: {
        nome_idProfissional: { nome, idProfissional }
      },
    });
    if (exists) {
      throw new ConflictException('Grupo muscular já cadastrado');
    }
    return this.prisma.grupoMuscular.create({
      data: { nome, idProfissional },
    });
  }

  async findAllGruposMusculares(idProfissional: number) {
    return this.prisma.grupoMuscular.findMany({
      where: { idProfissional, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async updateGrupoMuscular(idGrupoMuscular: number, nome: string, idProfissional: number) {
    const exists = await this.prisma.grupoMuscular.findFirst({
      where: { idGrupoMuscular, idProfissional },
    });
    if (!exists) {
      throw new NotFoundException('Grupo muscular não encontrado');
    }

    const nameExists = await this.prisma.grupoMuscular.findUnique({
      where: {
        nome_idProfissional: { nome, idProfissional }
      }
    });
    if (nameExists && nameExists.idGrupoMuscular !== idGrupoMuscular) {
      throw new ConflictException('Você já possui um grupo muscular com este nome');
    }

    return this.prisma.grupoMuscular.update({
      where: { idGrupoMuscular },
      data: { nome },
    });
  }

  async removeGrupoMuscular(idGrupoMuscular: number, idProfissional: number) {
    const exists = await this.prisma.grupoMuscular.findFirst({
      where: { idGrupoMuscular, idProfissional },
    });
    if (!exists) {
      throw new NotFoundException('Grupo muscular não encontrado');
    }
    return this.prisma.grupoMuscular.update({
      where: { idGrupoMuscular },
      data: { ativo: false },
    });
  }

  // --- EXERCICIOS ---
  async createExercicio(createDto: CreateExercicioDto, idProfissional: number) {
    const exists = await this.prisma.exercicio.findUnique({
      where: {
        nome_idProfissional: { nome: createDto.nome, idProfissional }
      },
    });
    if (exists) {
      throw new ConflictException('Exercício com este nome já cadastrado');
    }

    const group = await this.prisma.grupoMuscular.findFirst({
      where: { idGrupoMuscular: createDto.idGrupoMuscular, idProfissional },
    });
    if (!group) {
      throw new NotFoundException('Grupo muscular não encontrado ou inválido');
    }

    return this.prisma.exercicio.create({
      data: {
        ...createDto,
        idProfissional
      },
      include: { grupoMuscular: true },
    });
  }

  async findAllExercicios(idProfissional: number) {
    return this.prisma.exercicio.findMany({
      where: { idProfissional, ativo: true },
      include: { grupoMuscular: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOneExercicio(idExercicio: number, idProfissional: number) {
    const exercicio = await this.prisma.exercicio.findFirst({
      where: { idExercicio, idProfissional },
      include: { grupoMuscular: true },
    });
    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado');
    }
    return exercicio;
  }

  async updateExercicio(idExercicio: number, updateDto: UpdateExercicioDto, idProfissional: number) {
    await this.findOneExercicio(idExercicio, idProfissional);

    if (updateDto.idGrupoMuscular) {
      const group = await this.prisma.grupoMuscular.findFirst({
        where: { idGrupoMuscular: updateDto.idGrupoMuscular, idProfissional },
      });
      if (!group) {
        throw new NotFoundException('Grupo muscular não encontrado ou inválido');
      }
    }

    if (updateDto.nome) {
      const nameExists = await this.prisma.exercicio.findUnique({
        where: {
          nome_idProfissional: { nome: updateDto.nome, idProfissional }
        }
      });
      if (nameExists && nameExists.idExercicio !== idExercicio) {
        throw new ConflictException('Você já possui um exercício com este nome');
      }
    }

    return this.prisma.exercicio.update({
      where: { idExercicio },
      data: updateDto,
      include: { grupoMuscular: true },
    });
  }

  async removeExercicio(idExercicio: number, idProfissional: number) {
    await this.findOneExercicio(idExercicio, idProfissional);

    // Soft delete
    return this.prisma.exercicio.update({
      where: { idExercicio },
      data: { ativo: false },
    });
  }

  // --- TECNICAS DE TREINO ---
  async createTecnicaTreino(nome: string, idProfissional: number, descricao?: string) {
    const exists = await this.prisma.tecnicaTreino.findUnique({
      where: {
        nome_idProfissional: { nome, idProfissional }
      },
    });
    if (exists) {
      throw new ConflictException('Técnica de treino já cadastrada');
    }
    return this.prisma.tecnicaTreino.create({
      data: { nome, descricao, idProfissional },
    });
  }

  async findAllTecnicas(idProfissional: number) {
    return this.prisma.tecnicaTreino.findMany({
      where: { idProfissional, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async updateTecnicaTreino(idTecnica: number, updateDto: { nome?: string; descricao?: string; ativo?: boolean }, idProfissional: number) {
    const exists = await this.prisma.tecnicaTreino.findFirst({ where: { idTecnica, idProfissional } });
    if (!exists) {
      throw new NotFoundException('Técnica não encontrada');
    }

    if (updateDto.nome) {
      const nameExists = await this.prisma.tecnicaTreino.findUnique({
        where: {
          nome_idProfissional: { nome: updateDto.nome, idProfissional }
        }
      });
      if (nameExists && nameExists.idTecnica !== idTecnica) {
        throw new ConflictException('Você já possui uma técnica com este nome');
      }
    }

    return this.prisma.tecnicaTreino.update({
      where: { idTecnica },
      data: updateDto,
    });
  }

  async removeTecnicaTreino(idTecnica: number, idProfissional: number) {
    const exists = await this.prisma.tecnicaTreino.findFirst({ where: { idTecnica, idProfissional } });
    if (!exists) {
      throw new NotFoundException('Técnica não encontrada');
    }
    return this.prisma.tecnicaTreino.update({
      where: { idTecnica },
      data: { ativo: false },
    });
  }

  // --- SEED CATALOG METHOD FOR INDIVIDUAL PROFESSIONAL ---
  async seedCatalogForProfessional(idProfissional: number) {
    // Check if professional already has any groups to prevent duplicate seeding
    const existingGroupsCount = await this.prisma.grupoMuscular.count({
      where: { idProfissional }
    });

    if (existingGroupsCount > 0) {
      return { message: 'Profissional já possui dados cadastrados no catálogo.' };
    }

    // 1. Seed Groups & Exercises
    for (const [groupName, exercises] of Object.entries(DEFAULT_CATALOG)) {
      const group = await this.prisma.grupoMuscular.create({
        data: {
          nome: groupName,
          idProfissional
        }
      });

      for (const exName of exercises) {
        await this.prisma.exercicio.create({
          data: {
            nome: exName,
            idGrupoMuscular: group.idGrupoMuscular,
            idProfissional
          }
        });
      }
    }

    // 2. Seed default techniques
    for (const tech of DEFAULT_TECNICAS) {
      await this.prisma.tecnicaTreino.create({
        data: {
          nome: tech.nome,
          descricao: tech.desc,
          idProfissional
        }
      });
    }

    return { message: 'Catálogo semeado com sucesso para o profissional.' };
  }

  // Legacy method signature maintained for compatibility
  async seedCatalog() {
    return { message: 'Método obsoleto. Utilize seedCatalogForProfessional.' };
  }
}
