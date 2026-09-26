import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

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
  @MaxLength(30, { message: 'As repetições devem ter no máximo 30 caracteres' })
  repeticoes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30, { message: 'A carga deve ter no máximo 30 caracteres' })
  carga?: string | null;

  @IsInt()
  @IsOptional()
  descansoSegundos?: number | null;

  @IsInt()
  @IsOptional()
  descansoMaxSegundos?: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(1000, {
    message: 'A observação deve ter no máximo 1000 caracteres',
  })
  observacao?: string | null;

  @IsInt()
  @IsOptional()
  ordem?: number;
}
