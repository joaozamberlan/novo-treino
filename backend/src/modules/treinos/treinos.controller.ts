import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { TreinosService } from './treinos.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { CreateTreinoDto } from './dto/create-treino.dto';
import { AddExercicioDto } from './dto/add-exercicio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetProfissional } from '../auth/get-profissional.decorator';
import type { Profissional } from '@prisma/client';

@Controller('treinos')
@UseGuards(JwtAuthGuard)
export class TreinosController {
  constructor(private readonly treinosService: TreinosService) {}

  // --- PROTOCOLOS ---
  @Post('protocolos/:idAluno')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createProtocolo(
    @Param('idAluno', ParseIntPipe) idAluno: number,
    @GetProfissional() profissional: Profissional,
    @Body() createDto: CreateProtocoloDto,
  ) {
    return this.treinosService.createProtocolo(idAluno, profissional.idProfissional, createDto);
  }

  @Get('protocolos/:idAluno')
  async findAllProtocolos(
    @Param('idAluno', ParseIntPipe) idAluno: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.findAllProtocolos(idAluno, profissional.idProfissional);
  }

  @Get('protocolos/detalhes/:idProtocolo')
  async findOneProtocolo(
    @Param('idProtocolo', ParseIntPipe) idProtocolo: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.findOneProtocolo(idProtocolo, profissional.idProfissional);
  }

  @Patch('protocolos/:idProtocolo')
  async updateProtocolo(
    @Param('idProtocolo', ParseIntPipe) idProtocolo: number,
    @GetProfissional() profissional: Profissional,
    @Body() updateDto: any,
  ) {
    return this.treinosService.updateProtocolo(idProtocolo, profissional.idProfissional, updateDto);
  }

  // --- FICHAS (TREINOS) ---
  @Post('fichas/:idProtocolo')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createTreino(
    @Param('idProtocolo', ParseIntPipe) idProtocolo: number,
    @GetProfissional() profissional: Profissional,
    @Body() createDto: CreateTreinoDto,
  ) {
    return this.treinosService.createTreino(idProtocolo, profissional.idProfissional, createDto);
  }

  @Patch('fichas/:idTreino')
  async updateTreino(
    @Param('idTreino', ParseIntPipe) idTreino: number,
    @GetProfissional() profissional: Profissional,
    @Body() updateDto: any,
  ) {
    return this.treinosService.updateTreino(idTreino, profissional.idProfissional, updateDto);
  }

  // --- EXERCICIOS NO TREINO ---
  @Post('exercicios/:idTreino')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addExercicioToTreino(
    @Param('idTreino', ParseIntPipe) idTreino: number,
    @GetProfissional() profissional: Profissional,
    @Body() addDto: AddExercicioDto,
  ) {
    return this.treinosService.addExercicioToTreino(idTreino, profissional.idProfissional, addDto);
  }

  @Patch('exercicios/:idTreinoExercicio')
  async updateExercicioInTreino(
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
    @GetProfissional() profissional: Profissional,
    @Body() updateDto: any,
  ) {
    return this.treinosService.updateExercicioInTreino(idTreinoExercicio, profissional.idProfissional, updateDto);
  }

  @Delete('exercicios/:idTreinoExercicio')
  async removeExercicioFromTreino(
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.removeExercicioFromTreino(idTreinoExercicio, profissional.idProfissional);
  }

  // --- VOLUME SEMANAL ---
  @Get('volume/:idAluno')
  async getVolumeSemanal(
    @Param('idAluno', ParseIntPipe) idAluno: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.getVolumeSemanal(idAluno, profissional.idProfissional);
  }
}
