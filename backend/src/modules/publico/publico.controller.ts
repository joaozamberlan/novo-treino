import { Controller, Get, Post, Param, ParseIntPipe, Body } from '@nestjs/common';
import { PublicoService } from './publico.service';

@Controller('publico')
export class PublicoController {
  constructor(private readonly publicoService: PublicoService) {}

  @Get('treinos/:token')
  async findActiveByToken(@Param('token') token: string) {
    return this.publicoService.findActiveByToken(token);
  }

  // GET /publico/sessao/:token/:idTreino — busca ou cria sessão do dia e retorna histórico anterior
  @Get('sessao/:token/:idTreino')
  async getSessao(
    @Param('token') token: string,
    @Param('idTreino', ParseIntPipe) idTreino: number,
  ) {
    return this.publicoService.getOuCriarSessao(token, idTreino);
  }

  // POST /publico/sessao/:idSessao/toggle/:idTreinoExercicio — toggle exercício
  @Post('sessao/:idSessao/toggle/:idTreinoExercicio')
  async toggleExercicio(
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
  ) {
    return this.publicoService.toggleExercicio(idSessao, idTreinoExercicio);
  }

  // POST /publico/sessao/:idSessao/exercicio/:idTreinoExercicio/series — salva séries realizadas
  @Post('sessao/:idSessao/exercicio/:idTreinoExercicio/series')
  async salvarSeries(
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
    @Body() body: { series: Array<{ numeroSerie: number; cargaKg?: number | null; repeticoes?: number | null; concluido?: boolean }> },
  ) {
    return this.publicoService.salvarSeriesExercicio(idSessao, idTreinoExercicio, body.series || []);
  }

  // POST /publico/sessao/:idSessao/encerrar — encerra o treino e comita para o histórico
  @Post('sessao/:idSessao/encerrar')
  async encerrarSessao(
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Body() body?: {
      exercicios?: Array<{
        idTreinoExercicio: number;
        series: Array<{
          numeroSerie: number;
          cargaKg?: number | null;
          repeticoes?: number | null;
          concluido?: boolean;
        }>;
      }>;
    },
  ) {
    return this.publicoService.encerrarSessao(idSessao, body?.exercicios);
  }

  // POST /publico/sessao/:token/:idTreino/nova — inicia uma nova sessão (nova semana)
  @Post('sessao/:token/:idTreino/nova')
  async iniciarNovaSessao(
    @Param('token') token: string,
    @Param('idTreino', ParseIntPipe) idTreino: number,
  ) {
    return this.publicoService.iniciarNovaSessao(token, idTreino);
  }
}
