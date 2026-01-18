import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/user.entity';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Solo el Super Admin puede realizar esta acción');
    }

    return true;
  }
}

@Injectable()
export class AdminHouseGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role !== UserRole.ADMINHOUSE) {
      throw new ForbiddenException('Solo el administrador de casa puede realizar esta acción');
    }

    return true;
  }
}

@Injectable()
export class AdminOrSuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (
      user?.role === UserRole.SUPER_ADMIN ||
      user?.role === UserRole.ADMINHOUSE
    ) {
      return true;
    }

    throw new ForbiddenException(
      'No tienes permisos para realizar esta acción'
    );
  }
}
