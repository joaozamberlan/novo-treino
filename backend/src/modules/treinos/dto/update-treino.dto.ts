import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CARDIO_TIPOS, MAX_CARDIO_MINUTOS, MAX_ORDEM } from './limites';

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

  // null nos dois campos remove o aeróbico da ficha
  @IsIn(CARDIO_TIPOS, { message: 'Tipo de aeróbico inválido' })
  @IsOptional()
  cardioTipo?: string | null;

  @IsInt()
  @Min(1)
  @Max(MAX_CARDIO_MINUTOS)
  @IsOptional()
  cardioMinutos?: number | null;

  @IsInt()
  @Min(0)
  @Max(MAX_ORDEM)
  @IsOptional()
  ordem?: number;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
