import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

// Nunca inclui idAluno/idProfissional/idProtocolo — esses campos definem a
// posse do recurso e não podem ser reatribuídos via body do cliente.
export class UpdateProtocoloDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  objetivo?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
