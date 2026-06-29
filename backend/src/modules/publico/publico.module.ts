import { Module } from '@nestjs/common';
import { PublicoController } from './publico.controller';
import { PublicoService } from './publico.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicoController],
  providers: [PublicoService],
})
export class PublicoModule {}
