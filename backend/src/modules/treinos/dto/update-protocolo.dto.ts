import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Nunca inclui idAluno/idProfissional/idProtocolo — esses campos definem a
// posse do recurso e não podem ser reatribuídos via body do cliente.
export class UpdateProtocoloDto {
  @IsString()
  @IsOptional()
  @MaxLength(120, {
    message: 'O nome da periodização deve ter no máximo 120 caracteres',
  })
  nome?: string;

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

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
