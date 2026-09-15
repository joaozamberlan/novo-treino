import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProfissionaisService } from './profissionais.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminUpdateStatusDto } from './dto/admin-update-status.dto';
import { AdminUpdateRoleDto } from './dto/admin-update-role.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly profissionaisService: ProfissionaisService) {}

  @Get('profissionais')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async listAll(@Query() pagination: PaginationQueryDto) {
    return this.profissionaisService.listAllProfessionals(pagination);
  }

  @Patch('profissionais/:id/status')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateStatusDto,
  ) {
    return this.profissionaisService.updateProfessionalStatus(id, dto.ativo);
  }

  @Patch('profissionais/:id/role')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateRoleDto,
  ) {
    return this.profissionaisService.updateProfessionalRole(id, dto.role);
  }

  @Patch('profissionais/:id/reset-senha')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.profissionaisService.resetPasswordByAdmin(id, dto.novaSenha);
  }
}
