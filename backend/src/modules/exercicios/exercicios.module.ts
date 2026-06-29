import { Module } from '@nestjs/common';
import { ExerciciosController } from './exercicios.controller';
import { ExerciciosService } from './exercicios.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ExerciciosController],
  providers: [ExerciciosService]
})
export class ExerciciosModule {}
