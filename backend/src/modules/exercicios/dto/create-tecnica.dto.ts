import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTecnicaDto {
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(80)
  nome: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  descricao?: string;
}
