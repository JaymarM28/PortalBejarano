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

  async getSummary(userId: string, houseId: string | undefined, year: number, month?: number) {
    const house = houseId ? await this.houseRepository.findOne({ where: { id: houseId } }) : null;
    const numberOfPeople = house?.numberOfPeople || 1;

    const { startDate, endDate } = this.getPeriodDates(year, month);
    const { incomes, payments, expenses } = await this.loadPeriod(userId, houseId, startDate, endDate, true);

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
        // Lo que le queda al usuario después de cubrir su parte de los egresos de la casa
        balancePerPerson: totalIncome - totalEgress / numberOfPeople,
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

  async getAnnualSummary(userId: string, houseId: string | undefined, year: number) {
    const { startDate, endDate } = this.getPeriodDates(year);
    const { incomes, payments, expenses } = await this.loadPeriod(userId, houseId, startDate, endDate, false);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      totalIncome: 0,
      totalPayments: 0,
      totalExpenses: 0,
    }));
    // TypeORM devuelve las columnas `date` como 'YYYY-MM-DD'
    const monthIndex = (d: Date | string) =>
      d instanceof Date ? d.getUTCMonth() : Number(String(d).slice(5, 7)) - 1;

    incomes.forEach(i => (months[monthIndex(i.date)].totalIncome += Number(i.amount)));
    payments.forEach(p => (months[monthIndex(p.paymentDate)].totalPayments += Number(p.totalAmount)));
    expenses.forEach(e => (months[monthIndex(e.date)].totalExpenses += Number(e.amount)));

    return { year, months };
  }

  /**
   * Datos del periodo: los ingresos son solo los del usuario que consulta (cada usuario
   * ve únicamente los suyos); los egresos (pagos y gastos) son los de la casa.
   */
  private async loadPeriod(
    userId: string,
    houseId: string | undefined,
    startDate: string,
    endDate: string,
    withEmployee: boolean,
  ) {
    const houseFilter = houseId ? { houseId } : {};
    const [incomes, payments, expenses] = await Promise.all([
      this.incomeRepository.find({
        where: { userId, ...houseFilter, date: Between(startDate as any, endDate as any) },
      }),
      this.paymentRepository.find({
        where: { ...houseFilter, paymentDate: Between(startDate as any, endDate as any) },
        relations: withEmployee ? ['employee'] : [],
      }),
      this.expenseRepository.find({
        where: { ...houseFilter, date: Between(startDate as any, endDate as any) },
      }),
    ]);
    return { incomes, payments, expenses };
  }

  /**
   * Devuelve fechas 'YYYY-MM-DD' (no objetos Date) para que la comparación con las
   * columnas `date` no dependa de la zona horaria del servidor.
   */
  private getPeriodDates(year: number, month?: number) {
    const pad = (n: number) => String(n).padStart(2, '0');
    if (!month) {
      return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
    }
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return {
      startDate: `${year}-${pad(month)}-01`,
      endDate: `${year}-${pad(month)}-${pad(lastDay)}`,
    };
  }
}
