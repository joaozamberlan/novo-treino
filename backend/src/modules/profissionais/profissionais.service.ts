import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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

  async changePassword(idProfissional: number, senhaAtual: string, novaSenha: string) {
    if (!senhaAtual || !novaSenha) {
      throw new BadRequestException('Informe a senha atual e a nova senha');
    }
    if (novaSenha.length < 6) {
      throw new BadRequestException('A nova senha deve ter no mínimo 6 caracteres');
    }

    const prof = await this.prisma.profissional.findUnique({
      where: { idProfissional },
    });
    if (!prof) {
      throw new NotFoundException('Profissional não encontrado');
    }

    const isMatch = await bcrypt.compare(senhaAtual, prof.senhaHash);
    if (!isMatch) {
      throw new UnauthorizedException('A senha atual está incorreta');
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    await this.prisma.profissional.update({
      where: { idProfissional },
      data: { senhaHash },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async resetPasswordByAdmin(idProfissional: number, novaSenha: string) {
    if (!novaSenha || novaSenha.length < 6) {
      throw new BadRequestException('A nova senha deve ter no mínimo 6 caracteres');
    }
    const exists = await this.prisma.profissional.findUnique({ where: { idProfissional } });
    if (!exists) {
      throw new NotFoundException('Profissional não encontrado');
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    await this.prisma.profissional.update({
      where: { idProfissional },
      data: { senhaHash },
    });

    return { message: 'Senha redefinida com sucesso' };
  }
}
