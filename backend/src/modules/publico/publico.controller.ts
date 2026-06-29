import { Controller, Get, Param } from '@nestjs/common';
import { PublicoService } from './publico.service';

@Controller('publico')
export class PublicoController {
  constructor(private readonly publicoService: PublicoService) {}

  @Get('treinos/:token')
  async findActiveByToken(@Param('token') token: string) {
    return this.publicoService.findActiveByToken(token);
  }
}
