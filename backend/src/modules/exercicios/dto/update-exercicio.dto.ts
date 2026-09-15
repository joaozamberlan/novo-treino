import { IsBoolean, IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

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

  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'URL de vídeo inválida' },
  )
  @IsOptional()
  videoUrl?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
