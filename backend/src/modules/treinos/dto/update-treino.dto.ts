import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

// Nunca inclui idProtocolo — reatribuir esse campo via body permitiria mover
// a ficha para o protocolo de outro treinador (ou de outro aluno).
export class UpdateTreinoDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  observacao?: string | null;

  @IsInt()
  @IsOptional()
  ordem?: number;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
