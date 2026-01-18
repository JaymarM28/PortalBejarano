import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@Body() dto: CreateEmployeeDto, @Request() req) {
    return this.employeesService.create(dto, req.user.houseId);
  }

  @Get()
  findAll(@Request() req) {
    return this.employeesService.findAll(req.user.houseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.employeesService.findOne(id, req.user.houseId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto, @Request() req) {
    return this.employeesService.update(id, updateEmployeeDto, req.user.houseId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.employeesService.remove(id, req.user.houseId);
  }
}