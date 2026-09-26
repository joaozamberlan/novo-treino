import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateExercicioDto {
  @IsInt({ message: 'Grupo muscular inválido' })
  @IsNotEmpty({ message: 'Grupo muscular é obrigatório' })
  idGrupoMuscular: number;

  @IsString({ message: 'O nome do exercício deve ser uma string' })
  @IsNotEmpty({ message: 'O nome do exercício é obrigatório' })
  @MaxLength(120, {
    message: 'O nome do exercício deve ter no máximo 120 caracteres',
  })
  nome: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, {
    message: 'A descrição deve ter no máximo 1000 caracteres',
  })
  descricao?: string;

  // Só http/https — bloqueia esquemas como javascript: que poderiam ser
  // renderizados como link clicável na ficha pública do aluno.
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'URL de vídeo inválida' },
  )
  @IsOptional()
  @MaxLength(500, {
    message: 'A URL do vídeo deve ter no máximo 500 caracteres',
  })
  videoUrl?: string;
}
