import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateInstrucaoDto {
  @IsString({ message: 'A instrução deve ser um texto' })
  @IsNotEmpty({ message: 'A instrução é obrigatória' })
  @MaxLength(200)
  texto: string;
}
