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
import { ExerciciosService } from './exercicios.service';
import { CreateExercicioDto } from './dto/create-exercicio.dto';
import { UpdateExercicioDto } from './dto/update-exercicio.dto';
import { GrupoMuscularDto } from './dto/grupo-muscular.dto';
import { CreateTecnicaDto } from './dto/create-tecnica.dto';
import { UpdateTecnicaDto } from './dto/update-tecnica.dto';
import { CreateInstrucaoDto } from './dto/create-instrucao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetProfissional } from '../auth/get-profissional.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { Profissional } from '@prisma/client';

const VALIDATE = new ValidationPipe({ whitelist: true, transform: true });

@Controller('exercicios')
@UseGuards(JwtAuthGuard)
export class ExerciciosController {
  constructor(private readonly exerciciosService: ExerciciosService) {}

  // --- GRUPOS MUSCULARES ---
  @Post('grupos')
  @UsePipes(VALIDATE)
  async createGrupo(
    @Body() dto: GrupoMuscularDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.createGrupoMuscular(
      dto.nome,
      profissional.idProfissional,
    );
  }

  @Get('grupos')
  async findAllGrupos(@GetProfissional() profissional: Profissional) {
    return this.exerciciosService.findAllGruposMusculares(
      profissional.idProfissional,
    );
  }

  @Patch('grupos/:id')
  @UsePipes(VALIDATE)
  async updateGrupo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GrupoMuscularDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.updateGrupoMuscular(
      id,
      dto.nome,
      profissional.idProfissional,
    );
  }

  @Delete('grupos/:id')
  async removeGrupo(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.removeGrupoMuscular(
      id,
      profissional.idProfissional,
    );
  }

  // --- TECNICAS DE TREINO ---
  @Post('tecnicas')
  @UsePipes(VALIDATE)
  async createTecnica(
    @Body() dto: CreateTecnicaDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.createTecnicaTreino(
      dto.nome,
      profissional.idProfissional,
      dto.descricao,
    );
  }

  @Get('tecnicas')
  async findAllTecnicas(@GetProfissional() profissional: Profissional) {
    return this.exerciciosService.findAllTecnicas(profissional.idProfissional);
  }

  @Patch('tecnicas/:id')
  @UsePipes(VALIDATE)
  async updateTecnica(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTecnicaDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.updateTecnicaTreino(
      id,
      dto,
      profissional.idProfissional,
    );
  }

  @Delete('tecnicas/:id')
  async removeTecnica(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.removeTecnicaTreino(
      id,
      profissional.idProfissional,
    );
  }

  // --- INSTRUCOES DE EXECUCAO ---
  @Post('instrucoes')
  @UsePipes(VALIDATE)
  async createInstrucao(
    @Body() dto: CreateInstrucaoDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.createInstrucao(
      dto.texto,
      profissional.idProfissional,
    );
  }

  @Get('instrucoes')
  async findAllInstrucoes(@GetProfissional() profissional: Profissional) {
    return this.exerciciosService.findAllInstrucoes(
      profissional.idProfissional,
    );
  }

  @Patch('instrucoes/:id')
  @UsePipes(VALIDATE)
  async updateInstrucao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateInstrucaoDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.updateInstrucao(
      id,
      dto.texto,
      profissional.idProfissional,
    );
  }

  @Delete('instrucoes/:id')
  async removeInstrucao(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.removeInstrucao(
      id,
      profissional.idProfissional,
    );
  }

  // --- EXERCICIOS ---
  @Post()
  @UsePipes(VALIDATE)
  async create(
    @Body() createDto: CreateExercicioDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.createExercicio(
      createDto,
      profissional.idProfissional,
    );
  }

  @Get()
  @UsePipes(VALIDATE)
  async findAll(
    @GetProfissional() profissional: Profissional,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.exerciciosService.findAllExercicios(
      profissional.idProfissional,
      pagination,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.findOneExercicio(
      id,
      profissional.idProfissional,
    );
  }

  @Patch(':id')
  @UsePipes(VALIDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateExercicioDto,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.updateExercicio(
      id,
      updateDto,
      profissional.idProfissional,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.exerciciosService.removeExercicio(
      id,
      profissional.idProfissional,
    );
  }

  @Post('seed')
  async seed(@GetProfissional() profissional: Profissional) {
    return this.exerciciosService.seedCatalogForProfessional(
      profissional.idProfissional,
    );
  }
}
