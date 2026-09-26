import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAlunoDto {
  @IsString()
  @IsOptional()
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres' })
  nome?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(254, { message: 'O e-mail deve ter no máximo 254 caracteres' })
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30, { message: 'O telefone deve ter no máximo 30 caracteres' })
  telefone?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
