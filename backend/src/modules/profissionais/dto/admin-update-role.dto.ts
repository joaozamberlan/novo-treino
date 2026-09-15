import { IsIn } from 'class-validator';

// Mantém os três valores já usados/previstos no schema e no AdminGuard
// (SUPERADMIN é o único que passa no AdminGuard hoje).
export const ALLOWED_ROLES = ['USER', 'ADMIN', 'SUPERADMIN'] as const;

export class AdminUpdateRoleDto {
  @IsIn(ALLOWED_ROLES, {
    message: `role deve ser um de: ${ALLOWED_ROLES.join(', ')}`,
  })
  role: (typeof ALLOWED_ROLES)[number];
}
