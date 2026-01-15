import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('🔐 JwtAuthGuard: Verificando autenticación...');
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    console.log('📋 Authorization header:', authHeader ? '✅ PRESENTE' : '❌ AUSENTE');
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('🔍 JwtAuthGuard handleRequest:');
    console.log('  - Error:', err);
    console.log('  - User:', user);
    console.log('  - Info:', info);
    
    if (err || !user) {
      console.log('❌ JwtAuthGuard: Autenticación FALLIDA');
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    
    console.log('✅ JwtAuthGuard: Autenticación EXITOSA');
    return user;
  }
}
