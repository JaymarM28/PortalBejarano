import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret-key-change-in-production',
    });
    console.log('🔑 JwtStrategy inicializado con secret:', process.env.JWT_SECRET ? '✅ DESDE .env' : '⚠️ DEFAULT');
  }

  async validate(payload: any) {
    console.log('\n🔐 JwtStrategy.validate() ejecutándose...');
    console.log('📦 JWT Payload recibido:', JSON.stringify(payload, null, 2));
    
    try {
      const user = await this.authService.validateUser(payload.sub);
      
      if (!user) {
        console.log('❌ Usuario no encontrado en BD para ID:', payload.sub);
        throw new UnauthorizedException('Usuario no encontrado');
      }
      
      const userData = { 
        userId: payload.sub, 
        email: payload.email, 
        role: payload.role,
        fullName: payload.fullName 
      };
      
      console.log('✅ Usuario validado exitosamente:', JSON.stringify(userData, null, 2));
      return userData;
    } catch (error) {
      console.log('💥 Error en validación:', error.message);
      throw error;
    }
  }
}
