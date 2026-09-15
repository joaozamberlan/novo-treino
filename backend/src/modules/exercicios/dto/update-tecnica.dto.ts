import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTecnicaDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  descricao?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
