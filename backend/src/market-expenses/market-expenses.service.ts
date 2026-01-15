
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MarketExpense } from './market-expense.entity';
import { CreateMarketExpenseDto, UpdateMarketExpenseDto } from './dto/market-expense.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from 'src/users/users.service';
import { InternalServerErrorException } from '@nestjs/common';


@Injectable()
export class MarketExpensesService {
  constructor(
    @InjectRepository(MarketExpense)
    private marketExpenseRepository: Repository<MarketExpense>,
    private emailService: EmailService,
    private usersService: UsersService,    
  ) {}

async create(createDto: CreateMarketExpenseDto, userId: string): Promise<MarketExpense> {

    const expense = this.marketExpenseRepository.create({
      ...createDto,
      createdById: userId,
    });

  try {
    // Guardar el gasto
    const savedExpense = await this.marketExpenseRepository.save(expense);

    // ✅ CARGAR LAS RELACIONES después de guardar
    const expenseWithRelations = await this.marketExpenseRepository.findOne({
      where: { id: savedExpense.id }
    });

    if (!expenseWithRelations) {
      throw new InternalServerErrorException('Error al cargar el gasto guardado');
    }

    // Enviar email con el gasto que tiene las relaciones cargadas
    const allUsers = await this.usersService.findAll();
    await this.emailService.sendExpenseNotification(expenseWithRelations, allUsers);

    return expenseWithRelations;
  } catch (error) {
    console.error('Error en create market expense:', error);
    throw new InternalServerErrorException('Error al crear el gasto de mercado');
  }
}

  async findAll(): Promise<MarketExpense[]> {
    return this.marketExpenseRepository.find({
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MarketExpense> {
    const expense = await this.marketExpenseRepository.findOne({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    return expense;
  }

  async update(id: string, updateDto: UpdateMarketExpenseDto): Promise<MarketExpense> {
    const expense = await this.findOne(id);
    Object.assign(expense, updateDto);
    return this.marketExpenseRepository.save(expense);
  }

  async remove(id: string): Promise<void> {
    const expense = await this.findOne(id);
    await this.marketExpenseRepository.remove(expense);
  }

  async getStatsByMonth(year: number, month: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const expenses = await this.marketExpenseRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
    });

    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const count = expenses.length;

    // Agrupar por responsable
    const byResponsible = expenses.reduce((acc: any, exp) => {
      const name = exp.responsible.fullName;
      if (!acc[name]) {
        acc[name] = { name, total: 0, count: 0 };
      }
      acc[name].total += Number(exp.amount);
      acc[name].count += 1;
      return acc;
    }, {});

    // Agrupar por lugar
    const byPlace = expenses.reduce((acc: any, exp) => {
      const place = exp.place;
      if (!acc[place]) {
        acc[place] = { place, total: 0, count: 0 };
      }
      acc[place].total += Number(exp.amount);
      acc[place].count += 1;
      return acc;
    }, {});

    return {
      month,
      year,
      total,
      count,
      byResponsible: Object.values(byResponsible),
      byPlace: Object.values(byPlace),
    };
  }

  async getGeneralStats(): Promise<any> {
    const expenses = await this.marketExpenseRepository.find();

    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const count = expenses.length;

    const byResponsible = expenses.reduce((acc: any, exp) => {
      const name = exp.responsible.fullName;
      if (!acc[name]) {
        acc[name] = { name, total: 0, count: 0 };
      }
      acc[name].total += Number(exp.amount);
      acc[name].count += 1;
      return acc;
    }, {});

    const byPlace = expenses.reduce((acc: any, exp) => {
      const place = exp.place;
      if (!acc[place]) {
        acc[place] = { place, total: 0, count: 0 };
      }
      acc[place].total += Number(exp.amount);
      acc[place].count += 1;
      return acc;
    }, {});

    return {
      total,
      count,
      byResponsible: Object.values(byResponsible),
      byPlace: Object.values(byPlace),
    };
  }
}
