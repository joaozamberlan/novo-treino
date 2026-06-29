import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AlunosService } from './alunos.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetProfissional } from '../auth/get-profissional.decorator';
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
    return this.alunosService.create(createAlunoDto, profissional.idProfissional);
  }

  @Get()
  async findAll(@GetProfissional() profissional: Profissional) {
    return this.alunosService.findAll(profissional.idProfissional);
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
    return this.alunosService.update(id, updateAlunoDto, profissional.idProfissional);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.alunosService.remove(id, profissional.idProfissional);
  }
}
