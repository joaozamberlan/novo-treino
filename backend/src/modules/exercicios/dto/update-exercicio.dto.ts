import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateExercicioDto {
  @IsInt()
  @IsOptional()
  idGrupoMuscular?: number;

  @IsString()
  @IsOptional()
  @MaxLength(120, {
    message: 'O nome do exercício deve ter no máximo 120 caracteres',
  })
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, {
    message: 'A descrição deve ter no máximo 1000 caracteres',
  })
  descricao?: string;

  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'URL de vídeo inválida' },
  )
  @IsOptional()
  @MaxLength(500, {
    message: 'A URL do vídeo deve ter no máximo 500 caracteres',
  })
  videoUrl?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
