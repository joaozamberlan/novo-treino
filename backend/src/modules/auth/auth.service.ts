import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { DEFAULT_CATALOG, DEFAULT_TECNICAS } from '../../constants/default-catalog';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, senha, nome, cref, profissao, telefone, instagram } = registerDto;

    const emailExists = await this.prisma.profissional.findUnique({
      where: { email },
    });

    if (emailExists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const profissional = await this.prisma.profissional.create({
      data: {
        email,
        senhaHash,
        nome,
        cref,
        profissao: profissao || 'Personal Trainer',
        telefone,
        instagram,
      },
    });

    // Seed default catalog for the registered professional
    await this.seedCatalogForNewProfessional(profissional.idProfissional);

    // Remove hashed password from the response
    const { senhaHash: _, ...result } = profissional;
    return result;
  }

  private async seedCatalogForNewProfessional(idProfissional: number) {
    try {
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
    } catch (err) {
      console.error(`Falha ao semear catálogo inicial para o profissional ${idProfissional}:`, err);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, senha } = loginDto;

    const profesional = await this.prisma.profissional.findUnique({
      where: { email },
    });

    if (!profesional || !profesional.ativo) {
      throw new UnauthorizedException('Credenciais inválidas ou conta inativa');
    }

    const isMatch = await bcrypt.compare(senha, profesional.senhaHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: profesional.idProfissional, email: profesional.email };
    
    return {
      accessToken: this.jwtService.sign(payload),
      profissional: {
        idProfissional: profesional.idProfissional,
        nome: profesional.nome,
        email: profesional.email,
        cref: profesional.cref,
        profissao: profesional.profissao,
        logoUrl: profesional.logoUrl,
        role: profesional.role,
      },
    };
  }
}
