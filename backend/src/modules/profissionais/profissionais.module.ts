import { Module } from '@nestjs/common';
import { ProfissionaisController } from './profissionais.controller';
import { AdminController } from './admin.controller';
import { ProfissionaisService } from './profissionais.service';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [ProfissionaisController, AdminController],
  providers: [ProfissionaisService],
})
export class ProfissionaisModule {}
