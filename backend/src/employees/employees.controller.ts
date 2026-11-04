import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { resolveHouseScope } from '../common/house-scope';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOrSuperAdminGuard } from '../auth/super-admin.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@Body() dto: CreateEmployeeDto, @Request() req) {
    return this.employeesService.create(dto, resolveHouseScope(req.user));
  }

  @Get()
  findAll(@Request() req) {
    return this.employeesService.findAll(resolveHouseScope(req.user));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.employeesService.findOne(id, resolveHouseScope(req.user));
  }

  // Editar (incluye salario) y eliminar: solo admin de casa o super admin
  @Patch(':id')
  @UseGuards(AdminOrSuperAdminGuard)
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto, @Request() req) {
    return this.employeesService.update(id, updateEmployeeDto, resolveHouseScope(req.user));
  }

  @Delete(':id')
  @UseGuards(AdminOrSuperAdminGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.employeesService.remove(id, resolveHouseScope(req.user));
  }
}