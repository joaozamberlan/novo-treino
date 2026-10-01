import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AlunoAuthService } from './aluno-auth.service';
import { LoginAlunoDto, PrimeiroAcessoDto } from './dto/aluno-auth.dto';

// Mesmo limite do login do treinador: 5 tentativas por minuto por IP. O
// bloqueio por aluno (5 erros → 15 min) fica no AlunoAuthService.
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller('aluno/auth')
export class AlunoAuthController {
  constructor(private readonly alunoAuthService: AlunoAuthService) {}

  // GET /aluno/auth/acesso/:token — o que o link do treinador deve mostrar
  @Get('acesso/:token')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async getAcesso(@Param('token') token: string) {
    return this.alunoAuthService.getAcesso(token);
  }

  @Post('primeiro-acesso')
  @Throttle(AUTH_THROTTLE)
  async primeiroAcesso(@Body() dto: PrimeiroAcessoDto) {
    return this.alunoAuthService.primeiroAcesso(dto);
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  async login(@Body() dto: LoginAlunoDto) {
    return this.alunoAuthService.login(dto);
  }
}
