import { IsInt, IsOptional, IsString } from 'class-validator';

// Nunca inclui idTreino — reatribuir esse campo via body permitiria mover a
// prescrição para a ficha de outro treinador. idExercicio/idTecnica seguem
// aceitos (o service valida que pertencem ao mesmo treinador antes de gravar).
export class UpdateTreinoExercicioDto {
  @IsInt()
  @IsOptional()
  idExercicio?: number;

  @IsInt()
  @IsOptional()
  idTecnica?: number | null;

  @IsInt()
  @IsOptional()
  series?: number;

  @IsString()
  @IsOptional()
  repeticoes?: string;

  @IsString()
  @IsOptional()
  carga?: string | null;

  @IsInt()
  @IsOptional()
  descansoSegundos?: number | null;

  @IsInt()
  @IsOptional()
  descansoMaxSegundos?: number | null;

  @IsString()
  @IsOptional()
  observacao?: string | null;

  @IsInt()
  @IsOptional()
  ordem?: number;
}
