import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TreinosService } from './treinos.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { CreateTreinoDto } from './dto/create-treino.dto';
import { AddExercicioDto } from './dto/add-exercicio.dto';
import { DuplicarProtocoloDto } from './dto/duplicar-protocolo.dto';
import { UpdateProtocoloDto } from './dto/update-protocolo.dto';
import { UpdateTreinoDto } from './dto/update-treino.dto';
import { UpdateTreinoExercicioDto } from './dto/update-treino-exercicio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetProfissional } from '../auth/get-profissional.decorator';
import type { Profissional } from '@prisma/client';

// forbidNonWhitelisted: campos fora do DTO (ex.: idProfissional, idProtocolo,
// idTreino tentando reatribuir a posse do recurso) são rejeitados com 400 em
// vez de silenciosamente descartados — sinal explícito de payload malicioso.
const STRICT_VALIDATION = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
});

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
    return this.treinosService.createProtocolo(
      idAluno,
      profissional.idProfissional,
      createDto,
    );
  }

  @Get('visao-geral/:idAluno')
  async getVisaoGeralAluno(
    @Param('idAluno', ParseIntPipe) idAluno: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.getVisaoGeralAluno(
      idAluno,
      profissional.idProfissional,
    );
  }

  @Get('protocolos/:idAluno')
  async findAllProtocolos(
    @Param('idAluno', ParseIntPipe) idAluno: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.findAllProtocolos(
      idAluno,
      profissional.idProfissional,
    );
  }

  @Get('protocolos/detalhes/:idProtocolo')
  async findOneProtocolo(
    @Param('idProtocolo', ParseIntPipe) idProtocolo: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.findOneProtocolo(
      idProtocolo,
      profissional.idProfissional,
    );
  }

  @Patch('protocolos/:idProtocolo')
  @UsePipes(STRICT_VALIDATION)
  async updateProtocolo(
    @Param('idProtocolo', ParseIntPipe) idProtocolo: number,
    @GetProfissional() profissional: Profissional,
    @Body() updateDto: UpdateProtocoloDto,
  ) {
    return this.treinosService.updateProtocolo(
      idProtocolo,
      profissional.idProfissional,
      updateDto,
    );
  }

  @Post('protocolos/:idProtocolo/duplicar')
  @UsePipes(STRICT_VALIDATION)
  async duplicarProtocolo(
    @Param('idProtocolo', ParseIntPipe) idProtocolo: number,
    @GetProfissional() profissional: Profissional,
    @Body() dto: DuplicarProtocoloDto,
  ) {
    return this.treinosService.duplicarProtocolo(
      idProtocolo,
      dto.idAlunoDestino,
      profissional.idProfissional,
    );
  }

  @Delete('protocolos/:idProtocolo')
  async deleteProtocolo(
    @Param('idProtocolo', ParseIntPipe) idProtocolo: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.deleteProtocolo(
      idProtocolo,
      profissional.idProfissional,
    );
  }

  // --- FICHAS (TREINOS) ---
  @Post('fichas/:idProtocolo')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createTreino(
    @Param('idProtocolo', ParseIntPipe) idProtocolo: number,
    @GetProfissional() profissional: Profissional,
    @Body() createDto: CreateTreinoDto,
  ) {
    return this.treinosService.createTreino(
      idProtocolo,
      profissional.idProfissional,
      createDto,
    );
  }

  @Patch('fichas/:idTreino')
  @UsePipes(STRICT_VALIDATION)
  async updateTreino(
    @Param('idTreino', ParseIntPipe) idTreino: number,
    @GetProfissional() profissional: Profissional,
    @Body() updateDto: UpdateTreinoDto,
  ) {
    return this.treinosService.updateTreino(
      idTreino,
      profissional.idProfissional,
      updateDto,
    );
  }

  @Delete('fichas/:idTreino')
  async deleteTreino(
    @Param('idTreino', ParseIntPipe) idTreino: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.deleteTreino(
      idTreino,
      profissional.idProfissional,
    );
  }

  // --- EXERCICIOS NO TREINO ---
  @Post('exercicios/:idTreino')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addExercicioToTreino(
    @Param('idTreino', ParseIntPipe) idTreino: number,
    @GetProfissional() profissional: Profissional,
    @Body() addDto: AddExercicioDto,
  ) {
    return this.treinosService.addExercicioToTreino(
      idTreino,
      profissional.idProfissional,
      addDto,
    );
  }

  @Patch('exercicios/:idTreinoExercicio')
  @UsePipes(STRICT_VALIDATION)
  async updateExercicioInTreino(
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
    @GetProfissional() profissional: Profissional,
    @Body() updateDto: UpdateTreinoExercicioDto,
  ) {
    return this.treinosService.updateExercicioInTreino(
      idTreinoExercicio,
      profissional.idProfissional,
      updateDto,
    );
  }

  @Delete('exercicios/:idTreinoExercicio')
  async removeExercicioFromTreino(
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.removeExercicioFromTreino(
      idTreinoExercicio,
      profissional.idProfissional,
    );
  }

  // --- PROGRESSO DE CARGAS ---
  @Get('progresso/:idProtocolo')
  async getProgresso(
    @Param('idProtocolo', ParseIntPipe) idProtocolo: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.getProgresso(
      idProtocolo,
      profissional.idProfissional,
    );
  }

  // --- VOLUME SEMANAL ---
  @Get('volume/:idAluno')
  async getVolumeSemanal(
    @Param('idAluno', ParseIntPipe) idAluno: number,
    @GetProfissional() profissional: Profissional,
  ) {
    return this.treinosService.getVolumeSemanal(
      idAluno,
      profissional.idProfissional,
    );
  }
}
