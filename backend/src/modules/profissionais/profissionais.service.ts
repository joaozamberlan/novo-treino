import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfissionalDto } from './dto/update-profissional.dto';

@Injectable()
export class ProfissionaisService {
  constructor(private prisma: PrismaService) {}

  async getProfile(idProfissional: number) {
    const profissional = await this.prisma.profissional.findUnique({
      where: { idProfissional },
    });
    if (!profissional) {
      throw new NotFoundException('Profissional não encontrado');
    }
    const { senhaHash: _, ...result } = profissional;
    return result;
  }

  async updateProfile(idProfissional: number, updateDto: UpdateProfissionalDto) {
    // Ensure professional exists
    await this.getProfile(idProfissional);

    const profissional = await this.prisma.profissional.update({
      where: { idProfissional },
      data: updateDto,
    });
    const { senhaHash: _, ...result } = profissional;
    return result;
  }

  async listAllProfessionals() {
    return this.prisma.profissional.findMany({
      orderBy: { dataCadastro: 'desc' },
      select: {
        idProfissional: true,
        nome: true,
        email: true,
        cref: true,
        profissao: true,
        telefone: true,
        instagram: true,
        logoUrl: true,
        ativo: true,
        role: true,
        dataCadastro: true,
      },
    });
  }

  async updateProfessionalStatus(idProfissional: number, ativo: boolean) {
    const exists = await this.prisma.profissional.findUnique({ where: { idProfissional } });
    if (!exists) {
      throw new NotFoundException('Profissional não encontrado');
    }
    return this.prisma.profissional.update({
      where: { idProfissional },
      data: { ativo },
      select: {
        idProfissional: true,
        nome: true,
        ativo: true,
      },
    });
  }

  async updateProfessionalRole(idProfissional: number, role: string) {
    const exists = await this.prisma.profissional.findUnique({ where: { idProfissional } });
    if (!exists) {
      throw new NotFoundException('Profissional não encontrado');
    }
    return this.prisma.profissional.update({
      where: { idProfissional },
      data: { role },
      select: {
        idProfissional: true,
        nome: true,
        role: true,
      },
    });
  }
}
