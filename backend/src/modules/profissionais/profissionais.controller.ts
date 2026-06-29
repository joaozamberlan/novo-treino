import { Body, Controller, Get, Patch, Post, UseGuards, UseInterceptors, UploadedFile, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProfissionaisService } from './profissionais.service';
import { UpdateProfissionalDto } from './dto/update-profissional.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetProfissional } from '../auth/get-profissional.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Profissional } from '@prisma/client';

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
    return this.profissionaisService.updateProfile(profissional.idProfissional, updateDto);
  }

  @Post('me/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req: any, file: any, callback: any) => {
          const profId = (req as any).user.sub;
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `logo-${profId}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadLogo(
    @GetProfissional() profissional: Profissional,
    @UploadedFile() file: any,
  ) {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const logoUrl = `${baseUrl}/uploads/${file.filename}`;
    
    await this.profissionaisService.updateProfile(profissional.idProfissional, {
      logoUrl,
    });

    return { logoUrl };
  }
}
