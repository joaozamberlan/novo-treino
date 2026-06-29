import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProtocoloDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do protocolo é obrigatório' })
  nome: string;

  @IsString()
  @IsOptional()
  objetivo?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;
}
