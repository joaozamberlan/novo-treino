import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateExercicioDto {
  @IsInt()
  @IsOptional()
  idGrupoMuscular?: number;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
