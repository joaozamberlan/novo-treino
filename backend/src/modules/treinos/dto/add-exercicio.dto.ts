import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_DESCANSO_SEGUNDOS, MAX_ORDEM, MAX_SERIES } from './limites';

export class AddExercicioDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Exercício é obrigatório' })
  idExercicio: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  idTecnica?: number;

  @IsInt()
  @Min(1, { message: 'Informe ao menos 1 série' })
  @Max(MAX_SERIES, { message: `No máximo ${MAX_SERIES} séries` })
  @IsNotEmpty({ message: 'Número de séries é obrigatório' })
  series: number;

  @IsString()
  @IsNotEmpty({ message: 'Repetições são obrigatórias' })
  @MaxLength(30, { message: 'As repetições devem ter no máximo 30 caracteres' })
  repeticoes: string;

  @IsString()
  @IsOptional()
  @MaxLength(30, { message: 'A carga deve ter no máximo 30 caracteres' })
  carga?: string;

  @IsInt()
  @Min(0)
  @Max(MAX_DESCANSO_SEGUNDOS, { message: 'Descanso de no máximo 1 hora' })
  @IsOptional()
  descansoSegundos?: number;

  @IsInt()
  @Min(0)
  @Max(MAX_DESCANSO_SEGUNDOS, { message: 'Descanso de no máximo 1 hora' })
  @IsOptional()
  descansoMaxSegundos?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000, {
    message: 'A observação deve ter no máximo 1000 caracteres',
  })
  observacao?: string;

  @IsInt()
  @Min(0)
  @Max(MAX_ORDEM)
  @IsNotEmpty({ message: 'A ordem no treino é obrigatória' })
  ordem: number;
}
