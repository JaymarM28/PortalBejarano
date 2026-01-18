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
  }

  async validate(payload: any) {
    
    try {
      const user = await this.authService.validateUser(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
      
      const userData = { 
        userId: payload.sub, 
        email: payload.email, 
        role: payload.role,
        fullName: payload.fullName ,
        houseId: payload.houseId
      };
      
      return userData;
    } catch (error) {
      throw error;
    }
  }
}
