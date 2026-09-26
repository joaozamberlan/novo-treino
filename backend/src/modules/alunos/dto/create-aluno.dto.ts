import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAlunoDto {
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres' })
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  @IsOptional()
  @MaxLength(254, { message: 'O e-mail deve ter no máximo 254 caracteres' })
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30, { message: 'O telefone deve ter no máximo 30 caracteres' })
  telefone?: string;
}
