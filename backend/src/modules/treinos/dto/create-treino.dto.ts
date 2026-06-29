import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTreinoDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome da ficha é obrigatório' })
  nome: string;

  @IsString()
  @IsOptional()
  observacao?: string;

  @IsInt()
  @IsNotEmpty({ message: 'A ordem é obrigatória' })
  ordem: number;
}
