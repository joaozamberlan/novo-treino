import { Module } from '@nestjs/common';
import { ProfissionaisController } from './profissionais.controller';
import { AdminController } from './admin.controller';
import { ProfissionaisService } from './profissionais.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProfissionaisController, AdminController],
  providers: [ProfissionaisService],
})
export class ProfissionaisModule {}
