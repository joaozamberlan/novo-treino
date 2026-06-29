import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExercicioDto {
  @IsInt({ message: 'Grupo muscular inválido' })
  @IsNotEmpty({ message: 'Grupo muscular é obrigatório' })
  idGrupoMuscular: number;

  @IsString({ message: 'O nome do exercício deve ser uma string' })
  @IsNotEmpty({ message: 'O nome do exercício é obrigatório' })
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;
}
