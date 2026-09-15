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
import { diskStorage } from 'multer';
import type { Request } from 'express';
import { join } from 'path';
import type { Profissional } from '@prisma/client';

// Só imagens — SVG fica de fora de propósito (pode carregar <script>).
const ALLOWED_LOGO_MIME_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

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

  /**
   * NOTA PARA MIGRAÇÃO FUTURA (CLOUDFLARE R2):
   * Atualmente os arquivos são salvos no disco efêmero do container (pasta /uploads).
   * Para deploy estável em produção no Railway sem perder arquivos em redeploys,
   * migrar este upload para o Cloudflare R2 (gratuito até 10GB, compatível com S3 API):
   *
   * 1. Instalar: npm install @aws-sdk/client-s3
   * 2. Configurar S3Client com as credenciais do Cloudflare R2 (Endpoint, AccessKeyId, SecretAccessKey)
   * 3. Trocar diskStorage por memoryStorage() no Multer
   * 4. Fazer PutObjectCommand enviando file.buffer para o Bucket R2
   * 5. Salvar a URL pública do R2 (ex: https://pub-xxxx.r2.dev/logos/logo-id.ext ou seu domínio customizado)
   */
  @Post('me/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_LOGO_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_LOGO_MIME_TYPES[file.mimetype]) {
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
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req: Request, file, callback) => {
          // idProfissional vem do usuário autenticado (JwtStrategy.validate),
          // nunca de dado enviado pelo cliente no upload.
          const profId =
            (req.user as Profissional | undefined)?.idProfissional ?? 'anon';
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          // Extensão derivada do mimetype já validado pelo fileFilter — nunca do
          // nome de arquivo enviado pelo cliente, para evitar path traversal ou
          // uma extensão que não bate com o conteúdo real.
          const ext = ALLOWED_LOGO_MIME_TYPES[file.mimetype] ?? '';
          callback(null, `logo-${profId}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadLogo(
    @GetProfissional() profissional: Profissional,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const logoUrl = `${baseUrl}/uploads/${file.filename}`;

    await this.profissionaisService.updateProfile(profissional.idProfissional, {
      logoUrl,
    });

    return { logoUrl };
  }
}
