import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateAlunoDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
