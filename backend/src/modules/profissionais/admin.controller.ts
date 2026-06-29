import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ProfissionaisService } from './profissionais.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly profissionaisService: ProfissionaisService) {}

  @Get('profissionais')
  async listAll() {
    return this.profissionaisService.listAllProfessionals();
  }

  @Patch('profissionais/:id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('ativo') ativo: boolean,
  ) {
    return this.profissionaisService.updateProfessionalStatus(id, ativo);
  }

  @Patch('profissionais/:id/role')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: string,
  ) {
    return this.profissionaisService.updateProfessionalRole(id, role);
  }
}
