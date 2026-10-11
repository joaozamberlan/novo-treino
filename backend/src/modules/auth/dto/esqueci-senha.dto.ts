import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class EsqueciSenhaDto {
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @MaxLength(254, { message: 'O e-mail deve ter no máximo 254 caracteres' })
  email: string;
}
