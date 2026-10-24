import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Regiões do corpo que a ilustração do app sabe acender. 'nenhuma' é a
// escolha explícita de "Sem região". A mesma lista está em
// frontend/src/utils/musculos.ts.
export const REGIOES_GRUPO = [
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'antebraco',
  'abdomen',
  'gluteos',
  'quadriceps',
  'posterior_coxa',
  'adutores',
  'panturrilha',
  'nenhuma',
] as const;

export class GrupoMuscularDto {
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(80)
  nome: string;

  // Ausente: na criação fica vazia (segue o nome); na edição não muda
  @IsOptional()
  @IsIn(REGIOES_GRUPO, { message: 'Região do corpo inválida' })
  regiao?: string;
}
