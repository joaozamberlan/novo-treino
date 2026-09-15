import { IsBoolean } from 'class-validator';

export class AdminUpdateStatusDto {
  @IsBoolean()
  ativo: boolean;
}
