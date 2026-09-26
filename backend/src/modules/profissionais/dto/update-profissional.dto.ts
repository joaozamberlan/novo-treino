import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfissionalDto {
  @IsString()
  @IsOptional()
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres' })
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'O CREF deve ter no máximo 20 caracteres' })
  cref?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80, { message: 'A profissão deve ter no máximo 80 caracteres' })
  profissao?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30, { message: 'O telefone deve ter no máximo 30 caracteres' })
  telefone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'O Instagram deve ter no máximo 100 caracteres' })
  instagram?: string;

  // logoUrl não entra aqui: só o upload (POST /profissionais/me/logo) define
  // a logo, para que o link público e o PDF nunca apontem para uma URL
  // arbitrária enviada pelo cliente.

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'O rodapé deve ter no máximo 1000 caracteres' })
  rodapeTreino?: string | null;
}
