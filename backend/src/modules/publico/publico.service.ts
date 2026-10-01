import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicoService {
  constructor(private prisma: PrismaService) {}

  // Logo do treinador (pública: aparece na tela de login do aluno e no PDF)
  async getLogo(idProfissional: number) {
    const logo = await this.prisma.logoProfissional.findUnique({
      where: { idProfissional },
      select: { dados: true, mime: true },
    });
    if (!logo) {
      throw new NotFoundException('Logo não encontrada.');
    }
    return logo;
  }
}
