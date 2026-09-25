import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfissionalDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'O CREF deve ter no máximo 20 caracteres' })
  cref?: string;

  @IsString()
  @IsOptional()
  profissao?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  instagram?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'O rodapé deve ter no máximo 1000 caracteres' })
  rodapeTreino?: string | null;
}
