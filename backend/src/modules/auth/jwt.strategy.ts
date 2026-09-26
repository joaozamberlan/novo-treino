import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayloadProfissional } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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

  // Tokens emitidos antes destes campos existirem não têm `tipo` nem `ver`:
  // valem como token de profissional na versão 0, para não derrubar as
  // sessões abertas no deploy.
  async validate(payload: Partial<JwtPayloadProfissional>) {
    if (payload.tipo !== undefined && payload.tipo !== 'profissional') {
      throw new UnauthorizedException('Token não é de profissional');
    }
    const user = await this.prisma.profissional.findUnique({
      where: { idProfissional: payload.sub },
    });
    if (!user || !user.ativo) {
      throw new UnauthorizedException('Profissional não autorizado ou inativo');
    }
    // Senha trocada ou redefinida depois da emissão: sessão encerrada
    if ((payload.ver ?? 0) !== user.versaoToken) {
      throw new UnauthorizedException('Sessão expirada');
    }
    return user;
  }
}
