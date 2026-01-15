import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  fullName: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  fullName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    console.log('👤 UsersService.create() - Datos recibidos:', JSON.stringify(createUserDto, null, 2));
    console.log('📧 Email:', createUserDto.email);
    console.log('🔑 Password:', createUserDto.password ? '✅ PRESENTE' : '❌ AUSENTE');
    console.log('👤 FullName:', createUserDto.fullName);
    
    if (!createUserDto.password) {
      throw new Error('Password es requerido');
    }
    
    console.log('🔐 Hasheando password...');
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    console.log('✅ Password hasheado:', hashedPassword.substring(0, 20) + '...');
    
    // NO incluir password original en el spread
    const { password, ...userDataWithoutPassword } = createUserDto;
    
    const user = this.userRepository.create({
      ...userDataWithoutPassword,
      password: hashedPassword,
      role: UserRole.ADMIN
    });

    console.log('💾 Guardando usuario en BD...');
    const savedUser = await this.userRepository.save(user);
    console.log('✅ Usuario guardado con ID:', savedUser.id);
    
    const { password: pwd, ...result } = savedUser;
    return result as User;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' }
    });
    
    return users.map(user => {
      const { password, ...result } = user;
      return result as User;
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    
    const { password, ...result } = user;
    return result as User;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    console.log('🔄 UsersService.update() - Datos recibidos:', JSON.stringify(updateUserDto, null, 2));

    // Si hay password, hashearlo
    if (updateUserDto.password) {
      console.log('🔑 Actualizando password...');
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      Object.assign(user, { ...updateUserDto, password: hashedPassword });
    } else {
      Object.assign(user, updateUserDto);
    }
    
    const savedUser = await this.userRepository.save(user);
    
    const { password, ...result } = savedUser;
    return result as User;
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.remove(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ForbiddenException('La contraseña actual es incorrecta');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    await this.userRepository.save(user);

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
