import { IsOptional, IsString } from 'class-validator';

export class UpdateProfissionalDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
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
}
