import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

// Payload do JWT do aluno. `tipo` impede que este token seja aceito nas rotas
// do treinador (e vice-versa); `ver` é a versaoToken do aluno na emissão.
export interface JwtPayloadAluno {
  sub: number;
  tipo: 'aluno';
  ver: number;
}

// O que as rotas /aluno/* recebem em @GetAluno()
export interface AlunoLogado {
  idAluno: number;
  idProfissional: number;
  nome: string;
  versaoToken: number;
  // Expiração do token usado na requisição (segundos desde 1970)
  tokenExp: number;
}

export const SESSAO_ALUNO_ENCERRADA =
  'Seu acesso foi atualizado. Entre de novo.';

@Injectable()
export class JwtAlunoStrategy extends PassportStrategy(Strategy, 'jwt-aluno') {
  constructor(private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_SECRET não definido. Configure a variável de ambiente JWT_SECRET antes de iniciar a aplicação.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(
    payload: Partial<JwtPayloadAluno> & { exp?: number },
  ): Promise<AlunoLogado> {
    if (payload.tipo !== 'aluno' || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('Token não é de aluno');
    }
    const aluno = await this.prisma.aluno.findUnique({
      where: { idAluno: payload.sub },
      select: {
        idAluno: true,
        idProfissional: true,
        nome: true,
        versaoToken: true,
      },
    });
    // PIN redefinido ou acesso revogado depois da emissão: sessão encerrada
    if (!aluno || payload.ver !== aluno.versaoToken) {
      throw new UnauthorizedException(SESSAO_ALUNO_ENCERRADA);
    }
    return { ...aluno, tokenExp: payload.exp ?? 0 };
  }
}
