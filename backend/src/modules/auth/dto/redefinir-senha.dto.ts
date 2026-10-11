import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RedefinirSenhaDto {
  @IsString()
  @IsNotEmpty({ message: 'Link inválido ou expirado. Peça um novo.' })
  @MaxLength(200, { message: 'Link inválido ou expirado. Peça um novo.' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  @IsNotEmpty({ message: 'A nova senha é obrigatória' })
  @MaxLength(72, { message: 'A nova senha deve ter no máximo 72 caracteres' })
  novaSenha: string;
}
