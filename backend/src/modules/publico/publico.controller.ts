import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PublicoService } from './publico.service';

// Endpoints sem autenticação — mais expostos a scraping/automação do que os
// autenticados. O treino do aluno saiu daqui: fica em /aluno/*, com login.
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('publico')
export class PublicoController {
  constructor(private readonly publicoService: PublicoService) {}

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
}
