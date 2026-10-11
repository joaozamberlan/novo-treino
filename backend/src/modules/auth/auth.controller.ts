import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RecuperacaoSenhaService } from './recuperacao-senha.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';

// Limite estrito: login/registro são os alvos naturais de força bruta e
// credential stuffing. 5 tentativas por minuto por IP não incomoda um
// usuário legítimo (nem digitando a senha errada duas ou três vezes).
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private recuperacaoSenha: RecuperacaoSenhaService,
  ) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // O login pergunta se o envio de e-mail está configurado para decidir o que
  // mostrar em "Esqueceu a senha?"
  @Get('recuperacao-senha')
  recuperacaoSenhaDisponivel() {
    return { disponivel: this.recuperacaoSenha.disponivel };
  }

  @Post('esqueci-senha')
  @Throttle(AUTH_THROTTLE)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async esqueciSenha(@Body() dto: EsqueciSenhaDto) {
    return this.recuperacaoSenha.solicitar(dto.email);
  }

  @Post('redefinir-senha')
  @Throttle(AUTH_THROTTLE)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async redefinirSenha(@Body() dto: RedefinirSenhaDto) {
    return this.recuperacaoSenha.redefinir(dto.token, dto.novaSenha);
  }
}
