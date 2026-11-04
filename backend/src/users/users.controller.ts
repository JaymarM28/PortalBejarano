import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService, CreateUserDto, UpdateUserDto, ChangePasswordDto } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOrSuperAdminGuard } from '../auth/super-admin.guard';
import { UserRole } from './user.entity';
import { resolveHouseScope } from '../common/house-scope';

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
        : resolveHouseScope(req.user);

    return this.usersService.create(createUserDto, houseId);
  }

  @Get()
  findAll(@Request() req) {
    const houseId =
      req.user.role === UserRole.SUPER_ADMIN ? undefined : resolveHouseScope(req.user);

    return this.usersService.findAll(houseId);
  }

  // Debe declararse antes de ':id'
  @Patch('me/password')
  changeOwnPassword(@Body() body: ChangePasswordDto, @Request() req) {
    return this.usersService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOneForRequester(id, req.user);
  }

  @Patch(':id')
  @UseGuards(AdminOrSuperAdminGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @UseGuards(AdminOrSuperAdminGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user);
  }
}
