import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsBoolean, IsString } from 'class-validator';
import { AuthUser, resolveHouseScope } from '../common/house-scope';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  houseId?: string;  
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

  @IsOptional()
  houseId?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, houseId: string): Promise<User> {
    if (!createUserDto.password) {
      throw new Error('Password es requerido');
    }
    
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const { password, ...userDataWithoutPassword } = createUserDto;
    
    const user = this.userRepository.create({
      ...userDataWithoutPassword,
      password: hashedPassword,
      role: UserRole.ADMIN,
      houseId
    });

    const savedUser = await this.userRepository.save(user);
    
    const { password: pwd, ...result } = savedUser;
    return result as User;
  }

  async findAll(houseId?: string): Promise<User[]> {
    const where = houseId ? { houseId } : {};
    
    const users = await this.userRepository.find({
      where,
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

  async findOneForRequester(id: string, requester: AuthUser): Promise<User> {
    const user = await this.loadAccessibleUser(id, requester);
    const { password, ...result } = user;
    return result as User;
  }

  /**
   * Carga un usuario verificando que quien hace la petición tenga acceso:
   * - Super admin: cualquier usuario.
   * - Resto: solo usuarios de su misma casa y nunca un super admin.
   * Se responde 404 (no 403) para no revelar la existencia de usuarios de otras casas.
   */
  private async loadAccessibleUser(id: string, requester: AuthUser): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (requester.role === UserRole.SUPER_ADMIN) {
      return user;
    }
    const houseId = resolveHouseScope(requester);
    if (user.houseId !== houseId || user.role === UserRole.SUPER_ADMIN) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, requester: AuthUser): Promise<User> {
    const user = await this.loadAccessibleUser(id, requester);

    // Solo el super admin puede mover usuarios entre casas
    if (requester.role !== UserRole.SUPER_ADMIN) {
      delete updateUserDto.houseId;
    }

    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      Object.assign(user, { ...updateUserDto, password: hashedPassword });
    } else {
      Object.assign(user, updateUserDto);
    }
    
    const savedUser = await this.userRepository.save(user);
    
    const { password, ...result } = savedUser;
    return result as User;
  }

  async remove(id: string, requester: AuthUser): Promise<void> {
    if (id === requester.userId) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }

    const user = await this.loadAccessibleUser(id, requester);

    await this.userRepository.remove(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ForbiddenException('La contraseña actual es incorrecta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    await this.userRepository.save(user);

    return { message: 'Contraseña actualizada exitosamente' };
  }
}