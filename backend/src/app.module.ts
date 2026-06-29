import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    PrismaModule,
    AuthModule,
    ProfissionaisModule,
    AlunosModule,
    ExerciciosModule,
    TreinosModule,
    PublicoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
