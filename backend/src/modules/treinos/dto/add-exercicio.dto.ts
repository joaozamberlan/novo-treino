import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  repeticoes: string;

  @IsString()
  @IsOptional()
  carga?: string;

  @IsInt()
  @IsOptional()
  descansoSegundos?: number;

  @IsString()
  @IsOptional()
  observacao?: string;

  @IsInt()
  @IsNotEmpty({ message: 'A ordem no treino é obrigatória' })
  ordem: number;
}
