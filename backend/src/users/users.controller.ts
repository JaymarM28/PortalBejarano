import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOrSuperAdminGuard } from '../auth/super-admin.guard';
import { UserRole } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

@Post()
@UseGuards(AdminOrSuperAdminGuard)
create(@Body() createUserDto: CreateUserDto, @Request() req) {
  const houseId =
    req.user.role === UserRole.SUPER_ADMIN
      ? createUserDto.houseId
      : req.user.houseId;

  return this.usersService.create(createUserDto, houseId);
}


@Get()
findAll(@Request() req) {
  const houseId =
    req.user.role === UserRole.SUPER_ADMIN
      ? null
      : req.user.houseId;

  return this.usersService.findAll(houseId);
}

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.user.houseId);
  }

  @Patch(':id')
  @UseGuards(AdminOrSuperAdminGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, updateUserDto, req.user.houseId);
  }

  @Delete(':id')
  @UseGuards(AdminOrSuperAdminGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user.userId, req.user.houseId);
  }

  @Patch('me/password')
  changeOwnPassword(@Body() body: { currentPassword: string; newPassword: string }, @Request() req) {
    return this.usersService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
  }
}