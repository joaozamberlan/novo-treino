import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { AlunoAuthController } from './aluno-auth.controller';
import { AlunoAuthService, SESSAO_ALUNO_EXPIRA_EM } from './aluno-auth.service';
import { AreaAlunoController } from './area-aluno.controller';
import { AreaAlunoService } from './area-aluno.service';
import { JwtAlunoStrategy } from './jwt-aluno.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    // Mesmo segredo do treinador; o que separa os dois tokens é o campo `tipo`.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_SECRET não definido. Configure a variável de ambiente JWT_SECRET antes de iniciar a aplicação.',
          );
        }
        return { secret, signOptions: { expiresIn: SESSAO_ALUNO_EXPIRA_EM } };
      },
    }),
  ],
  controllers: [AlunoAuthController, AreaAlunoController],
  providers: [AlunoAuthService, AreaAlunoService, JwtAlunoStrategy],
})
export class AreaAlunoModule {}
