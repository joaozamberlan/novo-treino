import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { randomUUID } from 'crypto';

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

  async findAll(idProfissional: number) {
    return this.prisma.aluno.findMany({
      where: { idProfissional },
      orderBy: { nome: 'asc' },
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

  async update(idAluno: number, updateAlunoDto: UpdateAlunoDto, idProfissional: number) {
    // Check if student exists and belongs to the personal trainer
    await this.findOne(idAluno, idProfissional);

    return this.prisma.aluno.update({
      where: { idAluno },
      data: updateAlunoDto,
    });
  }

  async remove(idAluno: number, idProfissional: number) {
    // Check if student exists and belongs to the personal trainer
    await this.findOne(idAluno, idProfissional);

    // Soft delete / deactivate the student
    return this.prisma.aluno.update({
      where: { idAluno },
      data: { ativo: false },
    });
  }
}
