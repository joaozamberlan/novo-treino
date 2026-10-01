import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

const PIN_REGEX = /^\d{4}$/;
const PIN_MENSAGEM = 'O PIN deve ter 4 dígitos';

export class LoginAlunoDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o telefone' })
  @MaxLength(30, { message: 'O telefone deve ter no máximo 30 caracteres' })
  telefone: string;

  @IsString()
  @Matches(PIN_REGEX, { message: PIN_MENSAGEM })
  pin: string;
}

export class PrimeiroAcessoDto extends LoginAlunoDto {
  // Token do link enviado pelo treinador: prova de posse no primeiro acesso
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  token: string;
}
