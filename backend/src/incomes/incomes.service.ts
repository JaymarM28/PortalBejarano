import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Income } from './income.entity';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
  ) {}

  async create(dto: CreateIncomeDto, userId: string, houseId: string): Promise<Income> {
    const income = this.incomeRepository.create({ ...dto, userId, houseId });
    return this.incomeRepository.save(income);
  }

  async findAll(userId: string, houseId: string): Promise<Income[]> {
    return this.incomeRepository.find({
      where: { userId, houseId },
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Income> {
    const income = await this.incomeRepository.findOne({ where: { id } });
    if (!income) throw new NotFoundException('Ingreso no encontrado');
    if (income.userId !== userId) throw new ForbiddenException('Sin acceso a este ingreso');
    return income;
  }

  async update(id: string, dto: UpdateIncomeDto, userId: string): Promise<Income> {
    const income = await this.findOne(id, userId);
    Object.assign(income, dto);
    return this.incomeRepository.save(income);
  }

  async remove(id: string, userId: string): Promise<void> {
    const income = await this.findOne(id, userId);
    await this.incomeRepository.remove(income);
  }

  async getStatsByMonth(year: number, month: number, userId: string, houseId: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const incomes = await this.incomeRepository.find({
      where: { userId, houseId, date: Between(startDate as any, endDate as any) },
    });

    const total = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const byType = incomes.reduce((acc: any, i) => {
      if (!acc[i.type]) acc[i.type] = { type: i.type, total: 0, count: 0 };
      acc[i.type].total += Number(i.amount);
      acc[i.type].count += 1;
      return acc;
    }, {});

    return { year, month, total, count: incomes.length, byType: Object.values(byType) };
  }

  async getTotalByPeriod(userId: string, houseId: string, startDate: Date, endDate: Date): Promise<number> {
    const incomes = await this.incomeRepository.find({
      where: { userId, houseId, date: Between(startDate as any, endDate as any) },
    });
    return incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  }
}
