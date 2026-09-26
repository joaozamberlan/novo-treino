import { IsInt, IsNotEmpty, Min } from 'class-validator';

// Só o aluno de destino. A periodização de origem vem da URL e a posse
// (idProfissional) sempre vem do token — nunca do body.
export class DuplicarProtocoloDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Aluno de destino é obrigatório' })
  idAlunoDestino: number;
}
