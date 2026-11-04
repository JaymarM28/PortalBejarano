import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/user.entity';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  houseId?: string | null;
}

/**
 * Devuelve el houseId con el que se deben filtrar los datos del usuario autenticado.
 *
 * - Usuarios normales y admins de casa: siempre su propia casa. Si no tienen casa
 *   asignada se lanza 403 (antes un houseId vacío devolvía los datos de TODAS las casas).
 * - Super admin: su casa si tiene una asignada; si no, `undefined` (alcance global).
 */
export function resolveHouseScope(user: AuthUser): string | undefined {
  if (user?.houseId) {
    return user.houseId;
  }
  if (user?.role === UserRole.SUPER_ADMIN) {
    return undefined;
  }
  throw new ForbiddenException('Tu usuario no tiene una casa asignada');
}
