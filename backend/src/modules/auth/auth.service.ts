import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import {
  DEFAULT_CATALOG,
  DEFAULT_TECNICAS,
  DEFAULT_INSTRUCOES,
} from '../../constants/default-catalog';

// Hash "dummy" comparado quando o e-mail não existe, para que bcrypt.compare()
// sempre execute o mesmo trabalho — evita um timing side-channel que revelaria
// se um e-mail está cadastrado antes mesmo de checar a senha.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  'senha-nao-existe-para-timing-safety',
  10,
);

// E-mail é gravado sempre em minúsculas e sem espaços nas pontas, para que
// "Joao@x.com" e "joao@x.com" sejam a mesma conta.
function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { senha, nome, cref, profissao, telefone, instagram } = registerDto;
    const email = normalizarEmail(registerDto.email);

    const emailExists = await this.buscarPorEmail(email);

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
            idProfissional,
          },
        });

        for (const exName of exercises) {
          await this.prisma.exercicio.create({
            data: {
              nome: exName,
              idGrupoMuscular: group.idGrupoMuscular,
              idProfissional,
            },
          });
        }
      }

      // 2. Seed default techniques
      for (const tech of DEFAULT_TECNICAS) {
        await this.prisma.tecnicaTreino.create({
          data: {
            nome: tech.nome,
            descricao: tech.desc,
            idProfissional,
          },
        });
      }

      // 3. Seed default execution instructions
      for (const texto of DEFAULT_INSTRUCOES) {
        await this.prisma.instrucaoTreino.create({
          data: { texto, idProfissional },
        });
      }
    } catch (err) {
      console.error(
        `Falha ao semear catálogo inicial para o profissional ${idProfissional}:`,
        err,
      );
    }
  }

  // Busca sem diferenciar maiúsculas: contas criadas antes da normalização
  // podem ter o e-mail gravado com letras maiúsculas.
  private buscarPorEmail(email: string) {
    return this.prisma.profissional.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  }

  async login(loginDto: LoginDto) {
    const { senha } = loginDto;

    const profesional = await this.buscarPorEmail(
      normalizarEmail(loginDto.email),
    );

    // Sempre compara contra um hash — real ou "dummy" — para não revelar,
    // nem pela resposta nem pelo tempo de resposta, se o e-mail existe.
    const isMatch = await bcrypt.compare(
      senha,
      profesional?.senhaHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!profesional || !isMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Só revela o status "pendente" depois de confirmar que a senha está
    // correta — quem não conhece a senha nunca aprende que a conta existe.
    if (!profesional.ativo) {
      throw new UnauthorizedException(
        'Conta pendente de aprovação. Aguarde a liberação do administrador.',
      );
    }

    const payload = {
      sub: profesional.idProfissional,
      email: profesional.email,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      profissional: {
        idProfissional: profesional.idProfissional,
        nome: profesional.nome,
        email: profesional.email,
        cref: profesional.cref,
        profissao: profesional.profissao,
        telefone: profesional.telefone,
        instagram: profesional.instagram,
        logoUrl: profesional.logoUrl,
        rodapeTreino: profesional.rodapeTreino,
        role: profesional.role,
      },
    };
  }
}
