import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

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

  // Só http/https — bloqueia esquemas como javascript: que poderiam ser
  // renderizados como link clicável na ficha pública do aluno.
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'URL de vídeo inválida' },
  )
  @IsOptional()
  videoUrl?: string;
}
