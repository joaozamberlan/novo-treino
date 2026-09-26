import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @MaxLength(254, { message: 'O e-mail deve ter no máximo 254 caracteres' })
  email: string;

  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres' })
  senha: string;

  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres' })
  nome: string;

  @IsString({ message: 'O CREF deve ser uma string' })
  @IsNotEmpty({ message: 'O CREF é obrigatório' })
  @MaxLength(20, { message: 'O CREF deve ter no máximo 20 caracteres' })
  cref: string;

  @IsString()
  @IsOptional()
  @MaxLength(80, { message: 'A profissão deve ter no máximo 80 caracteres' })
  profissao?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30, { message: 'O telefone deve ter no máximo 30 caracteres' })
  telefone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'O Instagram deve ter no máximo 100 caracteres' })
  instagram?: string;
}
