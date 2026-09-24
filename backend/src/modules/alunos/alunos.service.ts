import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { randomUUID } from 'crypto';
import {
  PaginationQueryDto,
  toSkipTake,
} from '../../common/dto/pagination-query.dto';

@Injectable()
export class AlunosService {
  constructor(private prisma: PrismaService) {}

  async create(createAlunoDto: CreateAlunoDto, idProfissional: number) {
    return this.prisma.aluno.create({
      data: {
        ...createAlunoDto,
        idProfissional,
        tokenAcesso: randomUUID(),
      },
    });
  }

  async findAll(idProfissional: number, pagination?: PaginationQueryDto) {
    return this.prisma.aluno.findMany({
      where: { idProfissional },
      orderBy: { nome: 'asc' },
      // Periodização atual: a lista de alunos mostra qual é e quando termina
      include: {
        protocolos: {
          where: { ativo: true },
          take: 1,
          select: { idProtocolo: true, nome: true, dataFim: true },
        },
      },
      ...toSkipTake(pagination),
    });
  }

  async findOne(idAluno: number, idProfissional: number) {
    let aluno = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }
    if (!aluno.tokenAcesso) {
      const token = randomUUID();
      aluno = await this.prisma.aluno.update({
        where: { idAluno },
        data: { tokenAcesso: token },
      });
    }
    return aluno;
  }

  async update(
    idAluno: number,
    updateAlunoDto: UpdateAlunoDto,
    idProfissional: number,
  ) {
    // Check if student exists and belongs to the personal trainer
    await this.findOne(idAluno, idProfissional);

    return this.prisma.aluno.update({
      where: { idAluno },
      data: updateAlunoDto,
    });
  }

  // Gera um novo tokenAcesso e descarta o anterior — o link público antigo
  // (e qualquer cópia dele que tenha vazado) para de funcionar imediatamente.
  async regenerateToken(idAluno: number, idProfissional: number) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }
    return this.prisma.aluno.update({
      where: { idAluno },
      data: { tokenAcesso: randomUUID() },
      select: { idAluno: true, nome: true, tokenAcesso: true },
    });
  }

  // Revoga o link público sem gerar um novo — /publico/* para de reconhecer
  // esse aluno até que um novo token seja gerado (regenerateToken ou o
  // próximo findOne/getVisaoGeralAluno, que recria automaticamente).
  async revokeToken(idAluno: number, idProfissional: number) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }
    return this.prisma.aluno.update({
      where: { idAluno },
      data: { tokenAcesso: null },
      select: { idAluno: true, nome: true, tokenAcesso: true },
    });
  }

  async remove(idAluno: number, idProfissional: number) {
    // Check if student exists and belongs to the personal trainer
    await this.findOne(idAluno, idProfissional);

    return this.prisma.$transaction(async (tx) => {
      await tx.sessaoTreino.deleteMany({ where: { idAluno } });
      await tx.protocoloTreino.deleteMany({ where: { idAluno } });
      return tx.aluno.delete({ where: { idAluno } });
    });
  }
}
