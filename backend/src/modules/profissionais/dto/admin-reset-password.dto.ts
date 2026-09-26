import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AdminResetPasswordDto {
  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  @IsNotEmpty({ message: 'A nova senha é obrigatória' })
  @MaxLength(72, { message: 'A nova senha deve ter no máximo 72 caracteres' })
  novaSenha: string;
}
