import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Nunca inclui idProtocolo — reatribuir esse campo via body permitiria mover
// a ficha para o protocolo de outro treinador (ou de outro aluno).
export class UpdateTreinoDto {
  @IsString()
  @IsOptional()
  @MaxLength(120, {
    message: 'O nome da ficha deve ter no máximo 120 caracteres',
  })
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, {
    message: 'A observação deve ter no máximo 1000 caracteres',
  })
  observacao?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  rodape?: string | null;

  @IsInt()
  @IsOptional()
  ordem?: number;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
