import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, createdByAdmin = false) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      fullName: registerDto.fullName,
      role: createdByAdmin ? UserRole.ADMIN : UserRole.SUPER_ADMIN,
      houseId: registerDto.houseId
    });

    await this.userRepository.save(user);
    
    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email, isActive: true }
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      fullName: user.fullName,
      houseId: user.houseId 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        houseId: user.houseId
      }
    };
  }

  async validateUser(userId: string): Promise<User> {
    return this.userRepository.findOne({ where: { id: userId, isActive: true } });
  }
}
