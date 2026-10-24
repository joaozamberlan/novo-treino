import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Corpo do mapa do volume semanal; opcional no cadastro e na edição
export const SEXOS_ALUNO = ['masculino', 'feminino'] as const;

export class CreateAlunoDto {
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres' })
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  @IsOptional()
  @MaxLength(254, { message: 'O e-mail deve ter no máximo 254 caracteres' })
  email?: string;

  // Obrigatório: é o login do aluno (telefone + PIN)
  // (o class-validator devolve as mensagens de baixo para cima: "obrigatório" vem primeiro)
  @MaxLength(30, { message: 'O telefone deve ter no máximo 30 caracteres' })
  @IsString({ message: 'O telefone deve ser um texto' })
  @IsNotEmpty({ message: 'O telefone é obrigatório' })
  telefone: string;

  @IsOptional()
  @IsIn(SEXOS_ALUNO, { message: 'Sexo inválido' })
  sexo?: string;
}
