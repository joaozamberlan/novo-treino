import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProfissionaisService } from './profissionais.service';
import { UpdateProfissionalDto } from './dto/update-profissional.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetProfissional } from '../auth/get-profissional.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Profissional } from '@prisma/client';

// Só imagens — SVG fica de fora de propósito (pode carregar <script>).
const ALLOWED_LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

// O mimetype vem do cliente; a assinatura dos primeiros bytes confirma que o
// conteúdo é mesmo a imagem declarada.
function assinaturaConfere(buffer: Buffer, mime: string): boolean {
  if (mime === 'image/png') {
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mime === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === 'image/webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  return false;
}

@Controller('profissionais')
@UseGuards(JwtAuthGuard)
export class ProfissionaisController {
  constructor(private readonly profissionaisService: ProfissionaisService) {}

  @Get('me')
  async getProfile(@GetProfissional() profissional: Profissional) {
    return this.profissionaisService.getProfile(profissional.idProfissional);
  }

  @Patch('me')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateProfile(
    @GetProfissional() profissional: Profissional,
    @Body() updateDto: UpdateProfissionalDto,
  ) {
    return this.profissionaisService.updateProfile(
      profissional.idProfissional,
      updateDto,
    );
  }

  @Patch('me/senha')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async changePassword(
    @GetProfissional() profissional: Profissional,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.profissionaisService.changePassword(
      profissional.idProfissional,
      changePasswordDto.senhaAtual,
      changePasswordDto.novaSenha,
    );
  }

  // A logo vai para o banco (tabela LogoProfissional), não para o disco:
  // o container do Railway perde os arquivos locais a cada deploy.
  @Post('me/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_LOGO_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_LOGO_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new UnsupportedMediaTypeException(
              'Envie uma imagem PNG, JPEG ou WEBP.',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadLogo(
    @GetProfissional() profissional: Profissional,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    if (!assinaturaConfere(file.buffer, file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        'O arquivo não é uma imagem PNG, JPEG ou WEBP válida.',
      );
    }

    const logoUrl = await this.profissionaisService.salvarLogo(
      profissional.idProfissional,
      file.buffer,
      file.mimetype,
    );

    return { logoUrl };
  }
}
