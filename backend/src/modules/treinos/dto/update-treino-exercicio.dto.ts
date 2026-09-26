import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_DESCANSO_SEGUNDOS, MAX_ORDEM, MAX_SERIES } from './limites';

// Nunca inclui idTreino — reatribuir esse campo via body permitiria mover a
// prescrição para a ficha de outro treinador. idExercicio/idTecnica seguem
// aceitos (o service valida que pertencem ao mesmo treinador antes de gravar).
export class UpdateTreinoExercicioDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  idExercicio?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  idTecnica?: number | null;

  @IsInt()
  @Min(1, { message: 'Informe ao menos 1 série' })
  @Max(MAX_SERIES, { message: `No máximo ${MAX_SERIES} séries` })
  @IsOptional()
  series?: number;

  @IsString()
  @IsOptional()
  @MaxLength(30, { message: 'As repetições devem ter no máximo 30 caracteres' })
  repeticoes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30, { message: 'A carga deve ter no máximo 30 caracteres' })
  carga?: string | null;

  @IsInt()
  @Min(0)
  @Max(MAX_DESCANSO_SEGUNDOS, { message: 'Descanso de no máximo 1 hora' })
  @IsOptional()
  descansoSegundos?: number | null;

  @IsInt()
  @Min(0)
  @Max(MAX_DESCANSO_SEGUNDOS, { message: 'Descanso de no máximo 1 hora' })
  @IsOptional()
  descansoMaxSegundos?: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(1000, {
    message: 'A observação deve ter no máximo 1000 caracteres',
  })
  observacao?: string | null;

  @IsInt()
  @Min(0)
  @Max(MAX_ORDEM)
  @IsOptional()
  ordem?: number;
}
