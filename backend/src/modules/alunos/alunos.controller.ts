import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AlunosService } from './alunos.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetProfissional } from '../auth/get-profissional.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { Profissional } from '@prisma/client';

@Controller('alunos')
@UseGuards(JwtAuthGuard)
export class AlunosController {
  constructor(private readonly alunosService: AlunosService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createAlunoDto: CreateAlunoDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.alunosService.create(
      createAlunoDto,
      profissional.idProfissional,
    );
  }

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async findAll(
    @GetProfissional() profissional: Profissional,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.alunosService.findAll(profissional.idProfissional, pagination);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.alunosService.findOne(id, profissional.idProfissional);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAlunoDto: UpdateAlunoDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.alunosService.update(
      id,
      updateAlunoDto,
      profissional.idProfissional,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.alunosService.remove(id, profissional.idProfissional);
  }

  // Gera um novo link público, invalidando o anterior — para quando o
  // treinador precisar reenviar o link com segurança (ex.: link vazou).
  @Post(':id/token/regenerar')
  async regenerateToken(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.alunosService.regenerateToken(id, profissional.idProfissional);
  }

  // Revoga o link público sem gerar um novo.
  @Post(':id/token/revogar')
  async revokeToken(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.alunosService.revokeToken(id, profissional.idProfissional);
  }
}
