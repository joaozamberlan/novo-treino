import {
  Controller,
  Get,
  Header,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PublicoService } from './publico.service';

// Endpoints sem autenticação — mais expostos a scraping/automação do que os
// autenticados. 30/min por IP acomoda um aluno ativo registrando séries
// (cada campo sincroniza com debounce próprio) sem travar o uso legítimo.
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('publico')
export class PublicoController {
  constructor(private readonly publicoService: PublicoService) {}

  @Get('manifest/:token')
  @Header('Content-Type', 'application/manifest+json')
  @Header('Cache-Control', 'public, max-age=300')
  async getManifest(@Param('token') token: string) {
    return this.publicoService.getManifest(token);
  }

  @Get('treinos/:token')
  async findActiveByToken(@Param('token') token: string) {
    return this.publicoService.findActiveByToken(token);
  }

  // URL versionada (?v=) a cada novo envio, então pode ficar em cache longo
  @Get('logo/:idProfissional')
  async getLogo(
    @Param('idProfissional', ParseIntPipe) idProfissional: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const logo = await this.publicoService.getLogo(idProfissional);
    res.set({
      'Content-Type': logo.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    return new StreamableFile(Buffer.from(logo.dados));
  }

  @Get('progresso/:token')
  async getProgresso(@Param('token') token: string) {
    return this.publicoService.getProgresso(token);
  }

  // GET /publico/sessao/:token/:idTreino — busca ou cria sessão do dia e retorna histórico anterior
  @Get('sessao/:token/:idTreino')
  async getSessao(
    @Param('token') token: string,
    @Param('idTreino', ParseIntPipe) idTreino: number,
  ) {
    return this.publicoService.getOuCriarSessao(token, idTreino);
  }

  // POST /publico/sessao/:token/:idSessao/toggle/:idTreinoExercicio — toggle exercício
  @Post('sessao/:token/:idSessao/toggle/:idTreinoExercicio')
  async toggleExercicio(
    @Param('token') token: string,
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
  ) {
    return this.publicoService.toggleExercicio(
      token,
      idSessao,
      idTreinoExercicio,
    );
  }

  // POST /publico/sessao/:token/:idSessao/exercicio/:idTreinoExercicio/series — salva séries realizadas
  @Post('sessao/:token/:idSessao/exercicio/:idTreinoExercicio/series')
  async salvarSeries(
    @Param('token') token: string,
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
    @Body()
    body: {
      series: Array<{
        numeroSerie: number;
        cargaKg?: number | null;
        repeticoes?: number | null;
        concluido?: boolean;
      }>;
    },
  ) {
    return this.publicoService.salvarSeriesExercicio(
      token,
      idSessao,
      idTreinoExercicio,
      body.series || [],
    );
  }

  // DELETE /publico/sessao/:token/:idSessao/exercicio/:idTreinoExercicio/series/:numeroSerie — remove uma série extra adicionada pelo aluno
  @Delete(
    'sessao/:token/:idSessao/exercicio/:idTreinoExercicio/series/:numeroSerie',
  )
  async removerSerieExtra(
    @Param('token') token: string,
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Param('idTreinoExercicio', ParseIntPipe) idTreinoExercicio: number,
    @Param('numeroSerie', ParseIntPipe) numeroSerie: number,
  ) {
    return this.publicoService.removerSerieExtra(
      token,
      idSessao,
      idTreinoExercicio,
      numeroSerie,
    );
  }

  // POST /publico/sessao/:token/:idSessao/encerrar — encerra o treino e comita para o histórico
  @Post('sessao/:token/:idSessao/encerrar')
  async encerrarSessao(
    @Param('token') token: string,
    @Param('idSessao', ParseIntPipe) idSessao: number,
    @Body()
    body?: {
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
    return this.publicoService.encerrarSessao(
      token,
      idSessao,
      body?.exercicios,
    );
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
