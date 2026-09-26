import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AddExercicioDto {
  @IsInt()
  @IsNotEmpty({ message: 'Exercício é obrigatório' })
  idExercicio: number;

  @IsInt()
  @IsOptional()
  idTecnica?: number;

  @IsInt()
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
  @IsOptional()
  descansoSegundos?: number;

  @IsInt()
  @IsOptional()
  descansoMaxSegundos?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000, {
    message: 'A observação deve ter no máximo 1000 caracteres',
  })
  observacao?: string;

  @IsInt()
  @IsNotEmpty({ message: 'A ordem no treino é obrigatória' })
  ordem: number;
}
