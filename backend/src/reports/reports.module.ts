import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from '../incomes/income.entity';
import { Payment } from '../payments/payment.entity';
import { MarketExpense } from '../market-expenses/market-expense.entity';
import { House } from '../houses/house.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Income, Payment, MarketExpense, House])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
