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

  // Não recria o tokenAcesso quando ele é nulo: nulo significa link revogado,
  // e só o "gerar novo link" (regenerateToken) devolve o acesso.
  async findOne(idAluno: number, idProfissional: number) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
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

  // Gera novos tokens e descarta os anteriores — tanto o tokenAcesso do aluno
  // quanto o tokenPublico de cada periodização, já que /publico/* aceita os
  // dois. Qualquer link antigo (e cópia vazada) para de funcionar na hora.
  async regenerateToken(idAluno: number, idProfissional: number) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
      include: {
        protocolos: {
          where: { excluido: false },
          select: { idProtocolo: true },
        },
      },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }
    const [atualizado] = await this.prisma.$transaction([
      this.prisma.aluno.update({
        where: { idAluno },
        data: { tokenAcesso: randomUUID() },
        select: { idAluno: true, nome: true, tokenAcesso: true },
      }),
      ...aluno.protocolos.map((p) =>
        this.prisma.protocoloTreino.update({
          where: { idProtocolo: p.idProtocolo },
          data: { tokenPublico: randomUUID() },
        }),
      ),
    ]);
    return atualizado;
  }

  // Revoga todos os links públicos do aluno (tokenAcesso e o tokenPublico de
  // cada periodização) sem gerar novos — /publico/* para de reconhecer esse
  // aluno até o treinador gerar um link novo.
  async revokeToken(idAluno: number, idProfissional: number) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }
    const [atualizado] = await this.prisma.$transaction([
      this.prisma.aluno.update({
        where: { idAluno },
        data: { tokenAcesso: null },
        select: { idAluno: true, nome: true, tokenAcesso: true },
      }),
      this.prisma.protocoloTreino.updateMany({
        where: { idAluno },
        data: { tokenPublico: null },
      }),
    ]);
    return atualizado;
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
