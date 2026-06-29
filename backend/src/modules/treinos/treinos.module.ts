import { Module } from '@nestjs/common';
import { TreinosController } from './treinos.controller';
import { TreinosService } from './treinos.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TreinosController],
  providers: [TreinosService]
})
export class TreinosModule {}
