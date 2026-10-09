import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AreaAlunoService } from './area-aluno.service';
import { AlunoAuthService } from './aluno-auth.service';
import { JwtAlunoGuard } from './jwt-aluno.guard';
import { GetAluno } from './get-aluno.decorator';
import type { AlunoLogado } from './jwt-aluno.strategy';
import {
  EncerrarSessaoDto,
  RegistrarCardioDto,
  SalvarSeriesDto,
} from './dto/series.dto';

// Área do aluno logado (telefone + PIN). O aluno de cada rota vem sempre do
// JWT — nenhum endpoint aceita idAluno pela URL ou pelo body.
@Controller('aluno')
@UseGuards(JwtAlunoGuard)
export class AreaAlunoController {
  constructor(
    private readonly areaAlunoService: AreaAlunoService,
    private readonly alunoAuthService: AlunoAuthService,
  ) {}

  // GET /aluno/me — dados do aluno e do treinador; renova a sessão perto do vencimento
  @Get('me')
  async getMe(@GetAluno() aluno: AlunoLogado) {
    const dados = await this.areaAlunoService.getMe(aluno.idAluno);
    return {
      ...dados,
      accessToken: this.alunoAuthService.renovarSeNecessario(aluno),
    };
  }

  @Get('protocolos')
  async listarProtocolos(@GetAluno() aluno: AlunoLogado) {
    return this.areaAlunoService.listarProtocolos(aluno.idAluno);
  }

  // Declarada antes de protocolos/:idProtocolo para "atual" não cair no ParseIntPipe
  @Get('protocolos/atual')
  async getProtocoloAtual(@GetAluno() aluno: AlunoLogado) {
    return this.areaAlunoService.getProtocoloAtual(aluno.idAluno);
  }

  @Get('protocolos/:idProtocolo')
  async getProtocolo(
    @GetAluno() aluno: AlunoLogado,
    @Param('idProtocolo', ParseIntPipe) idProtocolo: number,
  ) {
    return this.areaAlunoService.getProtocolo(aluno.idAluno, idProtocolo);
  }

  @Get('progresso/:idProtocolo')
  async getProgresso(
    @GetAluno() aluno: AlunoLogado,
    @Param('idProtocolo', ParseIntPipe) idProtocolo: number,
  ) {
    return this.areaAlunoService.getProgresso(aluno.idAluno, idProtocolo);
  }

  // GET /aluno/sessao/:idTreino — busca ou cria sessão do dia e retorna histórico anterior
  @Get('sessao/:idTreino')
  async getSessao(
    @GetAluno() aluno: AlunoLogado,
    @Param('idTreino', ParseIntPipe) idTreino: number,
  ) {
    return this.areaAlunoService.getOuCriarSessao(aluno.idAluno, idTreino);
  }

  // POST /aluno/sessao/:idSessao/toggle/:idTreinoExercicio — toggle exercício
  @Post('sessao/:idSessao/toggle/:idTreinoExercicio')
  async toggleExercicio(
    @GetAluno() aluno: AlunoLogado,
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
  ) {
    return this.areaAlunoService.toggleExercicio(
      aluno.idAluno,
      idSessao,
      idTreinoExercicio,
    );
  }

  // POST /aluno/sessao/:idSessao/exercicio/:idTreinoExercicio/series — salva séries realizadas
  @Post('sessao/:idSessao/exercicio/:idTreinoExercicio/series')
  async salvarSeries(
    @GetAluno() aluno: AlunoLogado,
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
    @Body() body: SalvarSeriesDto,
  ) {
    return this.areaAlunoService.salvarSeriesExercicio(
      aluno.idAluno,
      idSessao,
      idTreinoExercicio,
      body.series,
    );
  }

  // DELETE /aluno/sessao/:idSessao/exercicio/:idTreinoExercicio/series/:numeroSerie — remove uma série extra adicionada pelo aluno
  @Delete('sessao/:idSessao/exercicio/:idTreinoExercicio/series/:numeroSerie')
  async removerSerieExtra(
    @GetAluno() aluno: AlunoLogado,
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
    @Param('numeroSerie', ParseIntPipe) numeroSerie: number,
  ) {
    return this.areaAlunoService.removerSerieExtra(
      aluno.idAluno,
      idSessao,
      idTreinoExercicio,
      numeroSerie,
    );
  }

  // POST /aluno/sessao/:idSessao/cardio — marca (ou desmarca) o aeróbico da sessão
  @Post('sessao/:idSessao/cardio')
  async registrarCardio(
    @GetAluno() aluno: AlunoLogado,
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Body() body: RegistrarCardioDto,
  ) {
    return this.areaAlunoService.registrarCardio(
      aluno.idAluno,
      idSessao,
      body.minutos ?? null,
    );
  }

  // POST /aluno/sessao/:idSessao/encerrar — encerra o treino e comita para o histórico
  @Post('sessao/:idSessao/encerrar')
  async encerrarSessao(
    @GetAluno() aluno: AlunoLogado,
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Body() body: EncerrarSessaoDto,
  ) {
    return this.areaAlunoService.encerrarSessao(
      aluno.idAluno,
      idSessao,
      body.exercicios,
    );
  }

  // POST /aluno/sessao/:idTreino/nova — inicia uma nova sessão (nova semana)
  @Post('sessao/:idTreino/nova')
  async iniciarNovaSessao(
    @GetAluno() aluno: AlunoLogado,
    @Param('idTreino', ParseIntPipe) idTreino: number,
  ) {
    return this.areaAlunoService.iniciarNovaSessao(aluno.idAluno, idTreino);
  }
}
