import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GrupoMuscularDto {
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(80)
  nome: string;
}
