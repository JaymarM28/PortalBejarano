import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Income } from '../incomes/income.entity';
import { Payment } from '../payments/payment.entity';
import { MarketExpense } from '../market-expenses/market-expense.entity';
import { House } from '../houses/house.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(MarketExpense)
    private expenseRepository: Repository<MarketExpense>,
    @InjectRepository(House)
    private houseRepository: Repository<House>,
  ) {}

  async getSummary(userId: string, houseId: string, year: number, month?: number) {
    const house = await this.houseRepository.findOne({ where: { id: houseId } });
    const numberOfPeople = house?.numberOfPeople || 1;

    const { startDate, endDate } = this.getPeriodDates(year, month);

    const [incomes, payments, expenses] = await Promise.all([
      this.incomeRepository.find({
        where: { userId, houseId, date: Between(startDate as any, endDate as any) },
      }),
      this.paymentRepository.find({
        where: { houseId, paymentDate: Between(startDate as any, endDate as any) },
        relations: ['employee'],
      }),
      this.expenseRepository.find({
        where: { houseId, date: Between(startDate as any, endDate as any) },
      }),
    ]);

    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const totalPayments = payments.reduce((s, p) => s + Number(p.totalAmount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalEgress = totalPayments + totalExpenses;
    const balance = totalIncome - totalEgress;

    const incomeByType = incomes.reduce((acc: any, i) => {
      if (!acc[i.type]) acc[i.type] = { type: i.type, total: 0, count: 0 };
      acc[i.type].total += Number(i.amount);
      acc[i.type].count += 1;
      return acc;
    }, {});

    const paymentByEmployee = payments.reduce((acc: any, p) => {
      const name = p.employee?.fullName || 'Desconocido';
      if (!acc[name]) acc[name] = { employee: name, total: 0, count: 0 };
      acc[name].total += Number(p.totalAmount);
      acc[name].count += 1;
      return acc;
    }, {});

    return {
      period: { year, month: month || null },
      numberOfPeople,
      summary: {
        totalIncome,
        totalEgress,
        totalPayments,
        totalExpenses,
        balance,
        balancePerPerson: numberOfPeople > 0 ? balance / numberOfPeople : balance,
      },
      incomes: {
        total: totalIncome,
        count: incomes.length,
        byType: Object.values(incomeByType),
      },
      egress: {
        payments: {
          total: totalPayments,
          count: payments.length,
          byEmployee: Object.values(paymentByEmployee),
        },
        expenses: {
          total: totalExpenses,
          count: expenses.length,
        },
      },
    };
  }

  async getAnnualSummary(userId: string, houseId: string, year: number) {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const { startDate, endDate } = this.getPeriodDates(year, m);

      const [incomes, payments, expenses] = await Promise.all([
        this.incomeRepository.find({
          where: { userId, houseId, date: Between(startDate as any, endDate as any) },
        }),
        this.paymentRepository.find({
          where: { houseId, paymentDate: Between(startDate as any, endDate as any) },
        }),
        this.expenseRepository.find({
          where: { houseId, date: Between(startDate as any, endDate as any) },
        }),
      ]);

      months.push({
        month: m,
        totalIncome: incomes.reduce((s, i) => s + Number(i.amount), 0),
        totalPayments: payments.reduce((s, p) => s + Number(p.totalAmount), 0),
        totalExpenses: expenses.reduce((s, e) => s + Number(e.amount), 0),
      });
    }

    return { year, months };
  }

  private getPeriodDates(year: number, month?: number) {
    const startDate = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
    const endDate = month ? new Date(year, month, 0) : new Date(year, 11, 31);
    return { startDate, endDate };
  }
}
