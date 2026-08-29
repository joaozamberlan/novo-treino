import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { PublicoService } from './publico.service';

@Controller('publico')
export class PublicoController {
  constructor(private readonly publicoService: PublicoService) {}

  @Get('treinos/:token')
  async findActiveByToken(@Param('token') token: string) {
    return this.publicoService.findActiveByToken(token);
  }

  // GET /publico/sessao/:token/:idTreino — busca ou cria sessão do dia
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
}
