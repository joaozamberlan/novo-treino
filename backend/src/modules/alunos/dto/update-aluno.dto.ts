import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SEXOS_ALUNO } from './create-aluno.dto';

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

  // null limpa (volta a "Não informado")
  @IsOptional()
  @IsIn(SEXOS_ALUNO, { message: 'Sexo inválido' })
  sexo?: string | null;
}
