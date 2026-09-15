import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProfissionaisModule } from './modules/profissionais/profissionais.module';
import { AlunosModule } from './modules/alunos/alunos.module';
import { ExerciciosModule } from './modules/exercicios/exercicios.module';
import { TreinosModule } from './modules/treinos/treinos.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicoModule } from './modules/publico/publico.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite padrão global: 60 requisições/minuto por IP. Rotas sensíveis
    // (login, registro, endpoints públicos) usam limites mais estritos via
    // @Throttle nos próprios controllers.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    ProfissionaisModule,
    AlunosModule,
    ExerciciosModule,
    TreinosModule,
    PublicoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
