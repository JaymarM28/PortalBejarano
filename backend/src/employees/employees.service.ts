import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, houseId: string): Promise<Employee> {
    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      houseId
    });
    return this.employeeRepository.save(employee);
  }

  async findAll(houseId?: string): Promise<Employee[]> {
    const where = houseId ? { houseId } : {};
    return this.employeeRepository.find({
      where,
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string, houseId?: string): Promise<Employee> {
    const where: any = { id };
    if (houseId) where.houseId = houseId;

    const employee = await this.employeeRepository.findOne({ where });
    if (!employee) {
      throw new NotFoundException('Empleada no encontrada');
    }
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto, houseId?: string): Promise<Employee> {
    const employee = await this.findOne(id, houseId);
    Object.assign(employee, updateEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  async remove(id: string, houseId?: string): Promise<void> {
    const employee = await this.findOne(id, houseId);
    await this.employeeRepository.remove(employee);
  }
}