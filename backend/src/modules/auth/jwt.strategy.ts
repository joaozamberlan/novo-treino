import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'alguma-chave-secreta-e-segura-de-sua-escolha',
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.prisma.profissional.findUnique({
      where: { idProfissional: payload.sub },
    });
    if (!user || !user.ativo) {
      throw new UnauthorizedException('Profissional não autorizado ou inativo');
    }
    return user;
  }
}
