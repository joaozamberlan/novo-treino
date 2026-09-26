import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'A senha atual é obrigatória' })
  @MaxLength(200, {
    message: 'A senha atual deve ter no máximo 200 caracteres',
  })
  senhaAtual: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  @MaxLength(72, { message: 'A nova senha deve ter no máximo 72 caracteres' })
  novaSenha: string;
}
