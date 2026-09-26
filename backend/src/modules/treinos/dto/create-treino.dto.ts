import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_ORDEM } from './limites';

export class CreateTreinoDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome da ficha é obrigatório' })
  @MaxLength(120, {
    message: 'O nome da ficha deve ter no máximo 120 caracteres',
  })
  nome: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, {
    message: 'A observação deve ter no máximo 1000 caracteres',
  })
  observacao?: string;

  @IsInt()
  @Min(0)
  @Max(MAX_ORDEM)
  @IsNotEmpty({ message: 'A ordem é obrigatória' })
  ordem: number;
}
