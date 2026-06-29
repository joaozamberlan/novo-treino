import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ExerciciosService } from './exercicios.service';
import { CreateExercicioDto } from './dto/create-exercicio.dto';
import { UpdateExercicioDto } from './dto/update-exercicio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetProfissional } from '../auth/get-profissional.decorator';
import type { Profissional } from '@prisma/client';

@Controller('exercicios')
@UseGuards(JwtAuthGuard)
export class ExerciciosController {
  constructor(private readonly exerciciosService: ExerciciosService) {}

  // --- GRUPOS MUSCULARES ---
  @Post('grupos')
  async createGrupo(
    @Body('nome') nome: string,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.createGrupoMuscular(nome, profissional.idProfissional);
  }

  @Get('grupos')
  async findAllGrupos(@GetProfissional() profissional: Profissional) {
    return this.exerciciosService.findAllGruposMusculares(profissional.idProfissional);
  }

  @Patch('grupos/:id')
  async updateGrupo(
    @Param('id', ParseIntPipe) id: number,
    @Body('nome') nome: string,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.updateGrupoMuscular(id, nome, profissional.idProfissional);
  }

  @Delete('grupos/:id')
  async removeGrupo(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.removeGrupoMuscular(id, profissional.idProfissional);
  }

  // --- TECNICAS DE TREINO ---
  @Post('tecnicas')
  async createTecnica(
    @Body('nome') nome: string,
    @Body('descricao') descricao: string | undefined,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.createTecnicaTreino(nome, profissional.idProfissional, descricao);
  }

  @Get('tecnicas')
  async findAllTecnicas(@GetProfissional() profissional: Profissional) {
    return this.exerciciosService.findAllTecnicas(profissional.idProfissional);
  }

  @Patch('tecnicas/:id')
  async updateTecnica(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: { nome?: string; descricao?: string; ativo?: boolean },
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.updateTecnicaTreino(id, updateDto, profissional.idProfissional);
  }

  @Delete('tecnicas/:id')
  async removeTecnica(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.removeTecnicaTreino(id, profissional.idProfissional);
  }

  // --- EXERCICIOS ---
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createDto: CreateExercicioDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.createExercicio(createDto, profissional.idProfissional);
  }

  @Get()
  async findAll(@GetProfissional() profissional: Profissional) {
    return this.exerciciosService.findAllExercicios(profissional.idProfissional);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.findOneExercicio(id, profissional.idProfissional);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateExercicioDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.updateExercicio(id, updateDto, profissional.idProfissional);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.removeExercicio(id, profissional.idProfissional);
  }

  @Post('seed')
  async seed(@GetProfissional() profissional: Profissional) {
    return this.exerciciosService.seedCatalogForProfessional(profissional.idProfissional);
  }
}
