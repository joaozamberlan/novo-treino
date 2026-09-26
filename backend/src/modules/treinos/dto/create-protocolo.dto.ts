import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProtocoloDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do protocolo é obrigatório' })
  @MaxLength(120, {
    message: 'O nome da periodização deve ter no máximo 120 caracteres',
  })
  nome: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'O objetivo deve ter no máximo 500 caracteres' })
  objetivo?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;
}
