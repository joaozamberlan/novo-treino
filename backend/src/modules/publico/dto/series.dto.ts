import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Rotas públicas não têm login: os limites de tamanho impedem que um único
// request dispare milhares de upserts no banco.
const MAX_SERIES_POR_EXERCICIO = 30;
const MAX_EXERCICIOS_POR_SESSAO = 40;

export class SerieRealizadaDto {
  @IsInt()
  @Min(1)
  @Max(MAX_SERIES_POR_EXERCICIO)
  numeroSerie: number;

  // null limpa o campo; ausente mantém o valor salvo
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(1000)
  cargaKg?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  repeticoes?: number | null;

  @IsOptional()
  @IsBoolean()
  concluido?: boolean;
}

export class SalvarSeriesDto {
  @IsArray()
  @ArrayMaxSize(MAX_SERIES_POR_EXERCICIO)
  @ValidateNested({ each: true })
  @Type(() => SerieRealizadaDto)
  series: SerieRealizadaDto[];
}

export class ExercicioSeriesDto {
  @IsInt()
  @Min(1)
  idTreinoExercicio: number;

  @IsArray()
  @ArrayMaxSize(MAX_SERIES_POR_EXERCICIO)
  @ValidateNested({ each: true })
  @Type(() => SerieRealizadaDto)
  series: SerieRealizadaDto[];
}

export class EncerrarSessaoDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_EXERCICIOS_POR_SESSAO)
  @ValidateNested({ each: true })
  @Type(() => ExercicioSeriesDto)
  exercicios?: ExercicioSeriesDto[];
}
